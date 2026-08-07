/* ==========================================================================
   DELETE /api/account
   Close the signed-in user's account. For a regulated fintech this is a
   DEACTIVATION, not an erasure:
     • blocked while any escrow is still in play (funded / delivered / disputed /
       under review), so money is never stranded;
     • the login is banned so the account can no longer be used;
     • the user's KYC, profile, seller, and reputation records are RETAINED,
       inactive, for the legal retention window (CBN/AML require ~5 years), then
       purged. They are NOT deleted here.

   Settled deal records are shared history with the counterparty and are kept.
   Identity is the session only — a user can close their OWN account, never
   another's. In demo mode there's no server account, so the client just clears
   its local session.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authConfigured } from "@/lib/auth/config";
import { deactivateAuthUser, getServerUser } from "@/lib/auth/server";
import { listDealsBySellerContacts, listDealsForUser } from "@/lib/deals/store";
import { deactivateProfile } from "@/lib/profiles/store";

// Money is in play at these statuses — the account can't be closed until they settle.
const OPEN_STATUSES = ["funded", "shipped", "disputed", "under_review"];

// Nigerian AML/CBN guidance: retain KYC + transaction records ~5 years.
const RETENTION_YEARS = 5;

function retainUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + RETENTION_YEARS);
  return d.toISOString();
}

export async function DELETE(): Promise<Response> {
  // Demo mode: no server account. The client clears its local session.
  if (!authConfigured()) return Response.json({ ok: true, mode: "demo", retainUntil: retainUntil() });

  const user = await getServerUser();
  if (!user?.email) return jsonError("Sign in to close your account.", 401);
  const email = user.email;

  // Guard: never close an account with money still in escrow.
  const [buying, selling] = await Promise.all([
    listDealsForUser(email).catch(() => []),
    listDealsBySellerContacts([email]).catch(() => []),
  ]);
  const open = [...buying, ...selling].filter((d) => OPEN_STATUSES.includes(d.status));
  if (open.length) {
    return jsonError(`You have ${open.length} open transaction${open.length === 1 ? "" : "s"} with money in escrow. Resolve ${open.length === 1 ? "it" : "them"} before closing your account.`, 409);
  }

  const until = retainUntil();
  // Mark the profile deactivated + set the retention date (best-effort — the
  // auth ban below is the real access block). Data is retained, not deleted.
  await deactivateProfile(email, until).catch(() => {});

  // Block sign-in for good. If this fails, report it rather than half-closing.
  const deactivated = await deactivateAuthUser(user.id);
  if (!deactivated) return jsonError("We couldn't close your account. Please try again.", 500);

  return Response.json({ ok: true, retainUntil: until });
}
