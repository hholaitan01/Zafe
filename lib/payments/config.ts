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
/** Shared secret ALATPay signs webhook callbacks with (HMAC). Set this to
    authenticate callbacks cryptographically instead of trusting the payload's
    (non-secret) business id. Confirm ALAT's exact header + scheme, then wire it
    in isValidAlatPayCallback. */
export const ALATPAY_WEBHOOK_SECRET = process.env.ALATPAY_WEBHOOK_SECRET ?? "";

/** True when ALATPay collection can run for real. */
export function collectionLive(): boolean {
  return Boolean(ALATPAY_API_KEY && ALATPAY_BUSINESS_ID);
}

/** True when ALAT Wallet payouts/refunds can run for real. */
export function payoutLive(): boolean {
  return Boolean(ALAT_WALLET_API_KEY && ALAT_ESCROW_POOL_ACCOUNT);
}

/* --------------------------------------------------------------------------
   Paystack — the gateway we are moving to. One secret key covers both
   collection (charge / dedicated account) and payout (transfers), and Paystack
   signs webhooks with that same secret, so a single key flips both live.
   -------------------------------------------------------------------------- */
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";

/** True when Paystack can run for real (collection and payout both). */
export function paystackLive(): boolean {
  return Boolean(PAYSTACK_SECRET_KEY);
}

export type PaymentProviderId = "paystack" | "alat" | "mock";

/** Optional explicit override; otherwise we auto-detect by which keys are set. */
const PAYMENTS_PROVIDER = (process.env.PAYMENTS_PROVIDER ?? "").toLowerCase();

/**
 * The active provider for a money-move.
 * - explicit `PAYMENTS_PROVIDER` wins when that provider's keys are present;
 * - otherwise Paystack (if keyed), then ALAT (if keyed), else mock.
 * `kind` lets collection and payout resolve independently, matching ALAT's
 * split (collection can be live while payout is still mocked).
 */
export function activeProvider(kind: "collection" | "payout"): PaymentProviderId {
  const alatLive = kind === "collection" ? collectionLive() : payoutLive();
  if (PAYMENTS_PROVIDER === "paystack" && paystackLive()) return "paystack";
  if (PAYMENTS_PROVIDER === "alat" && alatLive) return "alat";
  if (PAYMENTS_PROVIDER === "mock") return "mock";
  if (paystackLive()) return "paystack";
  if (alatLive) return "alat";
  return "mock";
}
