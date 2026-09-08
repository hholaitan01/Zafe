/* ==========================================================================
   Canonical user identity (audit #17) — a dual-key transition from email to a
   stable id.

   Data was keyed by email. Email can change, which would orphan a trader's
   deals and standing. This introduces a stable `id` (the Supabase auth user id)
   ALONGSIDE the email, without a big-bang migration: new records carry both,
   reads prefer the id and fall back to email, and old email-only records are
   backfilled with the id the first time their owner is seen again. Nothing
   breaks during the transition, and the app steadily moves onto the stable key.

   Pure matching + a thin caller helper. Server-only (callerIdentity reads the
   session via requireCaller).
   ========================================================================== */

import { requireCaller } from "./server";

export interface UserIdentity {
  /** The stable id (Supabase auth uid in live; a per-email demo id in the sandbox). */
  id?: string;
  email: string;
}

/**
 * Does this record belong to `who`? Prefers the stable id when both the record
 * and the caller carry one; otherwise falls back to a case-insensitive email
 * match. That fallback is what keeps email-only records (created before the id
 * was captured) reachable during the transition.
 */
export function identityMatches(
  record: { userId?: string | null; email?: string | null },
  who: UserIdentity,
): boolean {
  if (record.userId && who.id) return record.userId === who.id;
  const a = (record.email ?? "").trim().toLowerCase();
  const b = (who.email ?? "").trim().toLowerCase();
  return !!a && a === b;
}

/**
 * The caller's identity for scoping their own data: the trusted session (live)
 * or the demo fallback (sandbox). Null when there is no caller. The id is always
 * carried alongside the email so reads can move onto the stable key.
 */
export async function callerIdentity(demoFallback?: { email?: string; name?: string }): Promise<UserIdentity | null> {
  const u = await requireCaller(demoFallback);
  if (!u?.email) return null;
  return { id: u.id, email: u.email };
}
