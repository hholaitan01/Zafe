/* ==========================================================================
   POST /api/deals/:id/dispute/escalate
   The caller escalates the dispute to a human reviewer. The deal moves to
   "under_review" and the funds stay locked — no money moves here. The caller's
   side is taken from the trusted session (demo mode → buyer, the single local
   session).
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { escalateDispute } from "@/lib/deals/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to act on this deal." : "Deal not found", access.status);

  const role = await callerRoleOnDeal(access.deal);
  const party = role === "seller" ? "seller" : role === "buyer" || role === "demo" ? "buyer" : null;
  if (!party) return jsonError("Only a party to this deal can escalate it.", 403);

  const out = await escalateDispute(id, party);
  if (!out.ok) return jsonError(out.error ?? "Couldn't escalate the dispute.", out.error === "not_found" ? 404 : 409);
  return Response.json({ deal: out.deal });
}
