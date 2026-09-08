/* ==========================================================================
   Which payment backend are we using? (Same live/demo seam as AI, auth, deals.)

   - LIVE  — Paystack (one key covers collection, payout, and webhook signing),
             or Flutterwave. `activeProvider` picks whichever is keyed.
   - MOCK  — no keys, so payments are simulated: a fake virtual account, an
             instant "paid", a fake payout reference. The whole escrow flow
             still works end to end on stage with no bank access.

   ALAT (ALATPay collection + ALAT Wallet payout) is present but DISABLED: its
   payout path is incomplete (securityInfo pending the bank's encryption scheme),
   so activeProvider never selects it. The config + modules stay so it can be
   re-enabled quickly once that's confirmed.
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

/* --------------------------------------------------------------------------
   Flutterwave — the other gateway we may move to. One secret key covers
   collection and payout; webhooks are authenticated by a separate secret hash
   (set in the dashboard) that Flutterwave echoes in the `verif-hash` header.
   -------------------------------------------------------------------------- */
export const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY ?? "";
export const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH ?? "";

/** True when Flutterwave can run for real (collection and payout both). */
export function flutterwaveLive(): boolean {
  return Boolean(FLW_SECRET_KEY);
}

export type PaymentProviderId = "paystack" | "flutterwave" | "alat" | "mock";

/** Optional explicit override; otherwise we auto-detect by which keys are set. */
const PAYMENTS_PROVIDER = (process.env.PAYMENTS_PROVIDER ?? "").toLowerCase();

/**
 * The active provider for a money-move.
 * - explicit `PAYMENTS_PROVIDER` wins when that provider's keys are present;
 * - otherwise Paystack (if keyed), then Flutterwave (if keyed), else mock.
 *
 * ALAT is intentionally NOT selectable right now: its payout path is incomplete
 * (the ALAT Wallet `securityInfo` is pending the bank's encryption scheme), so
 * it must never move real money. Even `PAYMENTS_PROVIDER=alat` or ALAT keys
 * being set resolve to mock rather than the ALAT path. The ALAT modules stay in
 * place, dormant — re-enable by restoring the two `alat` branches below once the
 * scheme is confirmed. The `kind` arg is retained for that future split
 * (collection could go live before payout).
 */
export function activeProvider(_kind: "collection" | "payout"): PaymentProviderId {
  if (PAYMENTS_PROVIDER === "paystack" && paystackLive()) return "paystack";
  if (PAYMENTS_PROVIDER === "flutterwave" && flutterwaveLive()) return "flutterwave";
  if (PAYMENTS_PROVIDER === "mock") return "mock";
  if (paystackLive()) return "paystack";
  if (flutterwaveLive()) return "flutterwave";
  return "mock";
}
