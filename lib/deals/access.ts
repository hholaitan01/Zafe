/* ==========================================================================
   Deal authorization — the guard against IDOR (Insecure Direct Object
   Reference). Deal IDs are handled server-side with the Supabase service-role
   key, which bypasses RLS, so *the route handler* must prove the caller is
   entitled to the deal. Without this, anyone could read or mutate any deal by
   guessing/enumerating its id.

   Rule: the caller must be a PARTY to the deal — its buyer or its seller —
   identified from the signed-in Supabase session (cookies), never from a
   client-supplied id/email. In demo mode (no auth keys) there is a single
   local session and no cross-user data, so access is allowed.

   Not-a-party is reported as 404, not 403, so the endpoint never confirms that
   a deal exists to someone who has no business seeing it (blocks enumeration).
   ========================================================================== */

import { authConfigured } from "@/lib/auth/config";
import { getServerUser } from "@/lib/auth/server";
import { getDeal } from "./store";
import { normalizeContact } from "./helpers";
import type { Deal } from "./types";

export type DealAccess =
  | { ok: true; deal: Deal }
  | { ok: false; status: 401 | 404 };

/** True if `email` (or phone) belongs to the deal's buyer or seller. */
export function isPartyToDeal(deal: Deal, email: string): boolean {
  const me = normalizeContact(email);
  if (!me) return false;
  if (deal.buyerEmail && normalizeContact(deal.buyerEmail) === me) return true;
  if (deal.seller?.contact && normalizeContact(deal.seller.contact) === me) return true;
  return false;
}

/**
 * Fetch a deal only if the caller is entitled to it.
 *  - demo mode (no auth configured) → allowed (single local session)
 *  - live mode, no session          → 401 (must sign in)
 *  - live mode, not a party         → 404 (hide the deal's existence)
 */
export async function authorizeDeal(id: string): Promise<DealAccess> {
  const deal = await getDeal(id);
  if (!deal) return { ok: false, status: 404 };

  // Demo mode: no real multi-tenancy to protect.
  if (!authConfigured()) return { ok: true, deal };

  const user = await getServerUser();
  if (!user?.email) return { ok: false, status: 401 };
  if (!isPartyToDeal(deal, user.email)) return { ok: false, status: 404 };
  return { ok: true, deal };
}
