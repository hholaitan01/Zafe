/* ==========================================================================
   Payout-account change guard — pure helpers for the 2FA + cooldown controls.

   The payout account is where escrow money lands, so changing it is the highest-
   value action an attacker can take with a hijacked seller session. Two controls
   protect it: an email OTP on the change (see payout-otp.ts), and a cooldown
   after it — a freshly changed account is held before it can receive a payout,
   which both blunts a takeover-then-drain and buys time for the real owner to
   react to the "your payout account changed" signal.
   ========================================================================== */

import type { SellerPayout } from "./store";

/** The destination identity of a payout account: its number + bank, normalised. */
export function payoutFingerprint(p?: SellerPayout | null): string {
  const acct = (p?.accountNumber ?? "").replace(/\D/g, "");
  if (!acct) return "";
  const bank = (p?.bankName ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return `${acct}@${bank}`;
}

/** True when `next` names a different (non-empty) account than `current`. */
export function payoutChanged(current?: SellerPayout | null, next?: SellerPayout | null): boolean {
  const a = payoutFingerprint(current);
  const b = payoutFingerprint(next);
  return !!b && a !== b;
}

/** How long a changed payout account is held before it can receive money. */
export function cooldownHours(): number {
  const n = Number(process.env.ZAFE_PAYOUT_COOLDOWN_HOURS ?? "12");
  return Number.isFinite(n) && n >= 0 ? n : 12;
}

/**
 * When the cooldown on a change lifts, or null if it has already lapsed (or the
 * account was never changed). ISO timestamp.
 */
export function cooldownUntil(payoutUpdatedAt?: string | null): string | null {
  if (!payoutUpdatedAt) return null;
  const t = Date.parse(payoutUpdatedAt);
  if (Number.isNaN(t)) return null;
  const until = t + cooldownHours() * 3_600_000;
  return until > Date.now() ? new Date(until).toISOString() : null;
}

/** True while a changed payout account is still inside its cooldown. */
export function withinCooldown(payoutUpdatedAt?: string | null): boolean {
  return cooldownUntil(payoutUpdatedAt) !== null;
}
