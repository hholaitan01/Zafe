/* ==========================================================================
   The payments service the deal lifecycle + routes call.

   High-level money-moves over a Deal, with the live/mock seam: when the ALAT
   keys are set we call ALATPay / the ALAT Wallet for real; otherwise we
   simulate (fake account, fake payout ref) so the whole escrow flow runs on
   stage with no bank access. These never throw — a live failure comes back as
   { ok: false, error } so the caller can decide, exactly like the AI layer.
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";
import { generateVirtualAccount, isValidAlatPayCallback, isAlatPayCallbackSignatureValid, alatPayWebhookSecretConfigured, checkTransactionStatus } from "./alatpay";
import { accountNameEnquiry, debitWalletTransfer } from "./wallet";
import { ALAT_ESCROW_POOL_ACCOUNT, activeProvider } from "./config";
import { getProvider } from "./providers";
import { payoutEntry, refundEntry } from "@/lib/ledger/entries";
import { recordSafe } from "@/lib/ledger/store";
import { collectionAmount, computeFee } from "./fee";
import { beginSettlement, completeSettlement, failSettlement, settlementKey } from "./settlement";
import { getSeller } from "@/lib/sellers/store";
import { cooldownUntil } from "@/lib/sellers/payout-guard";

export { isValidAlatPayCallback, isAlatPayCallbackSignatureValid, alatPayWebhookSecretConfigured, checkTransactionStatus };

export type PaymentMode = "live" | "mock";

export interface CollectionAccount {
  accountNumber: string;
  bankName: string;
  expiresAt: string;
  alatTransactionId?: string;
  mode: PaymentMode;
  /** What the buyer must transfer: the deal amount plus their half of the fee. */
  amountDue: number;
}

export interface TransferResult {
  ok: boolean;
  ref?: string;
  error?: string;
  mode: PaymentMode;
}

const TEN_MIN_MS = 10 * 60 * 1000;

function ref(prefix: string, dealId: string): string {
  return `${prefix}_${dealId}_${Date.now()}`;
}

/** A one-time account for the buyer to pay the escrow into (funds the deal). */
export async function createCollectionAccount(deal: Deal): Promise<CollectionAccount> {
  const expiresAt = new Date(Date.now() + TEN_MIN_MS).toISOString();
  const provider = activeProvider("collection");
  // The buyer pays the deal amount plus their half of the fee.
  const amountDue = collectionAmount(deal.item.amount);

  if (provider === "mock") {
    // Mock: a believable NUBAN so the payment screen can show something on stage.
    return { accountNumber: "0" + String(Math.floor(1e9 + Math.random() * 9e9)), bankName: "Wema Bank (demo)", expiresAt, mode: "mock", amountDue };
  }

  if (provider === "paystack" || provider === "flutterwave") {
    const acct = await getProvider(provider).createCollection({
      amountNaira: amountDue,
      reference: deal.reference,
      customerEmail: deal.buyerEmail || "buyer@zafe.ng",
      customerName: deal.buyerEmail?.split("@")[0] || "Zafe buyer",
    });
    return { accountNumber: acct.accountNumber, bankName: acct.bankName, expiresAt: acct.expiresAt, alatTransactionId: acct.providerRef, mode: "live", amountDue };
  }

  const res = await generateVirtualAccount({
    amount: amountDue,
    transactionRef: deal.reference,
    buyerEmail: deal.buyerEmail || "buyer@zafe.ng",
    buyerPhone: "",
    buyerName: deal.buyerEmail?.split("@")[0] || "Zafe buyer",
  });
  return {
    accountNumber: res.data?.virtualBankAccountNumber ?? "",
    bankName: res.data?.bankName ?? "Wema Bank",
    expiresAt,
    alatTransactionId: res.data?.transactionId,
    mode: "live",
    amountDue,
  };
}

/**
 * Release the escrowed money to the seller's payout account, minus the seller's
 * half of the fee. `amount` is the principal being released (default: the whole
 * deal). Pass `chargeFee: false` for a move that carries no fee — a dispute
 * split remainder — so the seller receives the full principal.
 */
export async function payoutSeller(
  deal: Deal,
  amount = deal.item.amount,
  opts?: { chargeFee?: boolean; feeOverride?: number },
): Promise<TransferResult> {
  const provider = activeProvider("payout");
  const mode: PaymentMode = provider === "mock" ? "mock" : "live";
  const key = settlementKey("payout", deal.id);

  // Cooldown: a payout account changed within the window is held before it can
  // receive money (a fraud window after a possible account takeover). Checked
  // before the claim so the payout stays cleanly retryable once it lifts.
  const seller = deal.seller?.contact ? await getSeller(deal.seller.contact) : null;
  const until = cooldownUntil(seller?.payoutUpdatedAt);
  if (until) {
    return { ok: false, error: `The seller's payout account changed recently. Payout is on hold until ${new Date(until).toLocaleString("en-NG")}.`, mode };
  }

  // Claim the operation before moving a naira. A second concurrent release, or a
  // retry of one that already succeeded, never fires a second transfer.
  const claim = await beginSettlement(key, { dealId: deal.id, kind: "payout" });
  if (!claim.proceed) {
    if (claim.reason === "succeeded") return { ok: true, ref: claim.ref, mode };
    return { ok: false, error: "A payout for this deal is already in progress.", mode };
  }

  const sellerFee = opts?.feeOverride ?? (opts?.chargeFee === false ? 0 : computeFee(amount).sellerShare);
  const net = amount - sellerFee; // what the seller actually receives

  const result = await doPayout(deal, amount, net, sellerFee, provider);
  if (result.ok) await completeSettlement(key, result.ref ?? key);
  else await failSettlement(key, result.error ?? "payout failed");
  return result;
}

/** The transfer itself, once the operation is claimed. Never throws. */
async function doPayout(
  deal: Deal,
  amount: number,
  net: number,
  sellerFee: number,
  provider: ReturnType<typeof activeProvider>,
): Promise<TransferResult> {
  if (provider === "mock") {
    await recordSafe(payoutEntry(deal.id, amount, sellerFee));
    return { ok: true, ref: ref("mock_payout", deal.id), mode: "mock" };
  }

  const payout = deal.sellerPayout;
  if (!payout?.bankCode || !payout.accountNumber) {
    return { ok: false, error: "Seller has no verified payout account on file.", mode: "live" };
  }

  if (provider === "paystack" || provider === "flutterwave") {
    // Deterministic reference: a retry reuses it, so the provider de-duplicates
    // instead of sending the seller a second payout.
    const r = await getProvider(provider).transfer({
      amountNaira: net,
      bankCode: payout.bankCode,
      accountNumber: payout.accountNumber,
      accountName: payout.accountName,
      reference: `zf_payout_${deal.id}`,
      narration: `Zafe payout for ${deal.item.title}`,
    });
    if (r.ok) await recordSafe(payoutEntry(deal.id, amount, sellerFee));
    return { ok: r.ok, ref: r.ref, error: r.error, mode: "live" };
  }

  try {
    // Confirm the account name before releasing a naira.
    const enquiry = await accountNameEnquiry({ bankCode: payout.bankCode, accountNumber: payout.accountNumber });
    if (payout.accountName && enquiry?.accountName && !namesRoughlyMatch(enquiry.accountName, payout.accountName)) {
      return { ok: false, error: "Seller account name mismatch — payout blocked.", mode: "live" };
    }
    const res = await debitWalletTransfer({
      sourceAccountNumber: ALAT_ESCROW_POOL_ACCOUNT,
      destinationAccountNumber: payout.accountNumber,
      destinationBankCode: payout.bankCode,
      amount: net,
      // Deterministic per deal: a retry reuses it so ALAT de-duplicates, and it
      // matches the settlement claim key so the two never diverge.
      transactionReference: `zf_payout_${deal.id}`,
      narration: `Zafe payout for ${deal.item.title}`,
      securityInfo: "", // TODO: populate once the encryption scheme is confirmed with the bank contact
    });
    await recordSafe(payoutEntry(deal.id, amount, sellerFee));
    return { ok: true, ref: res.data?.reference ?? `zf_payout_${deal.id}`, mode: "live" };
  } catch (e) {
    return { ok: false, error: (e as Error).message, mode: "live" };
  }
}

/**
 * Refund the escrowed money (full or partial) to the buyer's account. Zafe keeps
 * no fee on a refund, so the buyer's half of the fee is returned too: the buyer
 * receives `amount + buyerFeeReversed`. `amount` is the principal refunded
 * (default: the whole deal); `buyerFeeReversed` defaults to the buyer's fee half
 * for the deal, which is what they paid on top at funding.
 */
export async function refundBuyer(
  deal: Deal,
  amount = deal.item.amount,
  opts?: { buyerFeeReversed?: number },
): Promise<TransferResult> {
  const provider = activeProvider("payout");
  const mode: PaymentMode = provider === "mock" ? "mock" : "live";
  const key = settlementKey("refund", deal.id);

  // Same claim as a payout: a retried or concurrent refund never pays twice.
  const claim = await beginSettlement(key, { dealId: deal.id, kind: "refund" });
  if (!claim.proceed) {
    if (claim.reason === "succeeded") return { ok: true, ref: claim.ref, mode };
    return { ok: false, error: "A refund for this deal is already in progress.", mode };
  }

  const buyerFeeReversed = opts?.buyerFeeReversed ?? computeFee(deal.item.amount).buyerShare;
  const cashOut = amount + buyerFeeReversed; // principal back plus the buyer's fee back

  const result = await doRefund(deal, amount, cashOut, buyerFeeReversed, provider);
  if (result.ok) await completeSettlement(key, result.ref ?? key);
  else await failSettlement(key, result.error ?? "refund failed");
  return result;
}

/** The transfer itself, once the refund operation is claimed. Never throws. */
async function doRefund(
  deal: Deal,
  amount: number,
  cashOut: number,
  buyerFeeReversed: number,
  provider: ReturnType<typeof activeProvider>,
): Promise<TransferResult> {
  if (provider === "mock") {
    await recordSafe(refundEntry(deal.id, amount, buyerFeeReversed));
    return { ok: true, ref: ref("mock_refund", deal.id), mode: "mock" };
  }

  const acct = deal.buyerPayout;
  if (!acct?.bankCode || !acct.accountNumber) {
    return { ok: false, error: "Buyer has no refund account on file.", mode: "live" };
  }

  if (provider === "paystack" || provider === "flutterwave") {
    const r = await getProvider(provider).transfer({
      amountNaira: cashOut,
      bankCode: acct.bankCode,
      accountNumber: acct.accountNumber,
      accountName: acct.accountName,
      reference: `zf_refund_${deal.id}`,
      narration: `Zafe refund for ${deal.item.title}`,
    });
    if (r.ok) await recordSafe(refundEntry(deal.id, amount, buyerFeeReversed));
    return { ok: r.ok, ref: r.ref, error: r.error, mode: "live" };
  }

  try {
    const res = await debitWalletTransfer({
      sourceAccountNumber: ALAT_ESCROW_POOL_ACCOUNT,
      destinationAccountNumber: acct.accountNumber,
      destinationBankCode: acct.bankCode,
      amount: cashOut,
      // Deterministic per deal, matching the settlement claim key.
      transactionReference: `zf_refund_${deal.id}`,
      narration: `Zafe refund for ${deal.item.title}`,
      securityInfo: "",
    });
    await recordSafe(refundEntry(deal.id, amount, buyerFeeReversed));
    return { ok: true, ref: res.data?.reference ?? `zf_refund_${deal.id}`, mode: "live" };
  } catch (e) {
    return { ok: false, error: (e as Error).message, mode: "live" };
  }
}

function namesRoughlyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  return norm(a).includes(norm(b).slice(0, 6)) || norm(b).includes(norm(a).slice(0, 6));
}
