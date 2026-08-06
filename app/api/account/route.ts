/* ==========================================================================
   DELETE /api/account
   Close the signed-in user's account. This is permanent:
     • blocked while any escrow is still in play (funded / delivered / disputed),
       so money is never stranded;
     • erases their personal data (profile, seller payout record, reputation);
     • removes the login itself (Supabase auth user).

   Settled deal records are shared history with the counterparty and are kept.
   Identity is the session only — a user can close their OWN account, never
   another's. In demo mode there's no server account, so the client just clears
   its local session.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authConfigured } from "@/lib/auth/config";
import { deleteAuthUser, getServerUser } from "@/lib/auth/server";
import { listDealsBySellerContacts, listDealsForUser } from "@/lib/deals/store";
import { deleteProfile } from "@/lib/profiles/store";
import { deleteReputation } from "@/lib/reputation/store";
import { deleteSeller } from "@/lib/sellers/store";

// Money is in play at these statuses — the account can't be closed until they settle.
const OPEN_STATUSES = ["funded", "shipped", "disputed"];

export async function DELETE(): Promise<Response> {
  // Demo mode: no server account to delete. The client clears its local session.
  if (!authConfigured()) return Response.json({ ok: true, mode: "demo" });

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

  // Erase personal data (best-effort — a missing table shouldn't block closure).
  await Promise.all([
    deleteProfile(email).catch(() => {}),
    deleteSeller(email).catch(() => {}),
    deleteReputation(email).catch(() => {}),
  ]);

  // Remove the login itself. If this fails, report it rather than half-closing.
  const removed = await deleteAuthUser(user.id);
  if (!removed) return jsonError("We couldn't fully close your account. Please try again.", 500);

  return Response.json({ ok: true });
}
