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
import { ALAT_ESCROW_POOL_ACCOUNT, collectionLive, payoutLive } from "./config";

export { isValidAlatPayCallback, isAlatPayCallbackSignatureValid, alatPayWebhookSecretConfigured, checkTransactionStatus };

export type PaymentMode = "live" | "mock";

export interface CollectionAccount {
  accountNumber: string;
  bankName: string;
  expiresAt: string;
  alatTransactionId?: string;
  mode: PaymentMode;
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

  if (!collectionLive()) {
    // Mock: a believable NUBAN so the payment screen can show something on stage.
    return { accountNumber: "0" + String(Math.floor(1e9 + Math.random() * 9e9)), bankName: "Wema Bank (demo)", expiresAt, mode: "mock" };
  }

  const res = await generateVirtualAccount({
    amount: deal.item.amount,
    transactionRef: deal.reference,
    buyerEmail: deal.buyerEmail || "buyer@trustflow.app",
    buyerPhone: "",
    buyerName: deal.buyerEmail?.split("@")[0] || "TrustFlow buyer",
  });
  return {
    accountNumber: res.data?.virtualBankAccountNumber ?? "",
    bankName: res.data?.bankName ?? "Wema Bank",
    expiresAt,
    alatTransactionId: res.data?.transactionId,
    mode: "live",
  };
}

/** Release the escrowed money to the seller's payout account. */
export async function payoutSeller(deal: Deal, amount = deal.item.amount): Promise<TransferResult> {
  if (!payoutLive()) {
    return { ok: true, ref: ref("mock_payout", deal.id), mode: "mock" };
  }

  const payout = deal.sellerPayout;
  if (!payout?.bankCode || !payout.accountNumber) {
    return { ok: false, error: "Seller has no verified payout account on file.", mode: "live" };
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
      amount,
      transactionReference: ref("payout", deal.id),
      narration: `TrustFlow payout for ${deal.item.title}`,
      securityInfo: "", // TODO: populate once the encryption scheme is confirmed with the bank contact
    });
    return { ok: true, ref: res.data?.reference ?? ref("payout", deal.id), mode: "live" };
  } catch (e) {
    return { ok: false, error: (e as Error).message, mode: "live" };
  }
}

/** Refund the escrowed money (full or partial) to the buyer's account. */
export async function refundBuyer(deal: Deal, amount = deal.item.amount): Promise<TransferResult> {
  if (!payoutLive()) {
    return { ok: true, ref: ref("mock_refund", deal.id), mode: "mock" };
  }

  const acct = deal.buyerPayout;
  if (!acct?.bankCode || !acct.accountNumber) {
    return { ok: false, error: "Buyer has no refund account on file.", mode: "live" };
  }
  try {
    const res = await debitWalletTransfer({
      sourceAccountNumber: ALAT_ESCROW_POOL_ACCOUNT,
      destinationAccountNumber: acct.accountNumber,
      destinationBankCode: acct.bankCode,
      amount,
      transactionReference: ref("refund", deal.id),
      narration: `TrustFlow refund for ${deal.item.title}`,
      securityInfo: "",
    });
    return { ok: true, ref: res.data?.reference ?? ref("refund", deal.id), mode: "live" };
  } catch (e) {
    return { ok: false, error: (e as Error).message, mode: "live" };
  }
}

function namesRoughlyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  return norm(a).includes(norm(b).slice(0, 6)) || norm(b).includes(norm(a).slice(0, 6));
}
