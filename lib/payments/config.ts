/* ==========================================================================
   Which payment backend are we using? (Same live/demo seam as AI, auth, deals.)

   - LIVE  — the ALAT keys are set, so we call ALATPay (collection) and the
             ALAT Wallet (payout/refund) for real.
   - MOCK  — no keys, so payments are simulated: a fake virtual account, an
             instant "paid", a fake payout reference. The whole escrow flow
             still works end to end on stage with no bank access.

   ALATPay (collection) and the ALAT Wallet (payout) are two separate ALAT
   products with separate keys, so each can go live independently — collection
   can be real while payout is still mocked, which matches how ALAT grants
   access (self-serve ALATPay first, bank-issued Wallet key later).
   ========================================================================== */

export const ALATPAY_API_KEY = process.env.ALATPAY_API_KEY ?? "";
export const ALATPAY_BUSINESS_ID = process.env.ALATPAY_BUSINESS_ID ?? "";
export const ALAT_WALLET_API_KEY = process.env.ALAT_WALLET_API_KEY ?? "";
export const ALAT_ESCROW_POOL_ACCOUNT = process.env.ALAT_ESCROW_POOL_ACCOUNT ?? "";

/** True when ALATPay collection can run for real. */
export function collectionLive(): boolean {
  return Boolean(ALATPAY_API_KEY && ALATPAY_BUSINESS_ID);
}

/** True when ALAT Wallet payouts/refunds can run for real. */
export function payoutLive(): boolean {
  return Boolean(ALAT_WALLET_API_KEY && ALAT_ESCROW_POOL_ACCOUNT);
}
