/* ==========================================================================
   ALAT Wallet Services (playground.alat.ng) — bank-grade wallet APIs that move
   the money out: pay the seller, refund the buyer, verify a payout account.
   LIVE client only — the mock path in ./index never calls these. (Ported from
   Jerry's lib/alat-wallet.ts; logic unchanged.)

   The Wallet key is bank-issued (not self-serve) — request it early. The
   transfer `securityInfo` is an encrypted signature whose exact scheme must be
   confirmed with the bank contact before going live; don't guess at it.
   ========================================================================== */

import { ALAT_WALLET_API_KEY } from "./config";

const ALAT_WALLET_BASE_URL = "https://playground.alat.ng"; // confirm path prefix in the portal once you have access

function alatWalletHeaders() {
  return { "x-api-key": ALAT_WALLET_API_KEY, "Content-Type": "application/json" };
}

/** Confirm a payout account resolves to a name (any Nigerian bank), before releasing funds. */
export async function accountNameEnquiry(input: { bankCode: string; accountNumber: string }) {
  const res = await fetch(`${ALAT_WALLET_BASE_URL}/debit-wallet/api/Shared/AccountNameEnquiry/${input.bankCode}/${input.accountNumber}`, {
    headers: alatWalletHeaders(),
  });
  if (!res.ok) throw new Error(`ALAT account enquiry failed: ${res.status}`);
  return res.json();
}

/** Pay a seller (or refund a buyer) from the escrow pool. Intrabank + interbank via NIP. */
export async function debitWalletTransfer(input: {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  destinationBankCode: string;
  amount: number;
  transactionReference: string;
  narration: string;
  securityInfo: string; // TODO: confirm exact encryption scheme with bank contact
}) {
  const res = await fetch(`${ALAT_WALLET_BASE_URL}/debit-wallet/api/Shared/Transfer`, {
    method: "POST",
    headers: alatWalletHeaders(),
    body: JSON.stringify({
      sourceAccountNumber: input.sourceAccountNumber,
      destinationAccountNumber: input.destinationAccountNumber,
      destinationBankCode: input.destinationBankCode,
      amount: input.amount,
      transactionReference: input.transactionReference,
      useCustomNarration: true,
      narration: input.narration,
      securityInfo: input.securityInfo,
    }),
  });
  if (!res.ok) throw new Error(`ALAT debit wallet transfer failed: ${res.status}`);
  return res.json(); // expect PENDING; final status arrives via callback
}
