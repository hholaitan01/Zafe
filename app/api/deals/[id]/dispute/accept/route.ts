/* ==========================================================================
   POST /api/deals/:id/dispute/accept
   The caller accepts the AI's suggested resolution. Only when BOTH parties
   accept does the money actually move (settled server-side). The caller's side
   is taken from the trusted session, never the client — a buyer can't accept on
   the seller's behalf. In demo mode one local session stands in for both sides,
   so a demo accept settles immediately.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { acceptDispute } from "@/lib/deals/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to act on this deal." : "Deal not found", access.status);

  const role = await callerRoleOnDeal(access.deal);
  const party = role === "demo" ? "both" : role === "buyer" ? "buyer" : role === "seller" ? "seller" : null;
  if (!party) return jsonError("Only a party to this deal can accept the resolution.", 403);

  const out = await acceptDispute(id, party);
  if (!out.ok) return jsonError(out.error ?? "Couldn't record your acceptance.", out.error === "not_found" ? 404 : 409);
  return Response.json({ deal: out.deal, settled: out.settled });
}
