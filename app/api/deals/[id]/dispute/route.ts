/* ==========================================================================
   POST /api/deals/:id/dispute
   Body: { reason?, buyer: { claim, evidence? }, seller: { claim, evidence? } }
   Open a dispute: the AI SUGGESTS a resolution but no money moves. Both parties
   then accept it (→ /dispute/accept) or escalate (→ /dispute/escalate). Returns
   the updated deal (with dispute.resolution) so the Dispute screen can show it.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { openDispute, type DisputeInput } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Only a party to the deal may open a dispute on it (guards against IDOR).
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to dispute this deal." : "Deal not found", access.status);
  const body = await readJson<DisputeInput>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!body.buyer || !isNonEmptyString(body.buyer.claim)) return jsonError("buyer.claim is required.");
  if (!body.seller || !isNonEmptyString(body.seller.claim)) return jsonError("seller.claim is required.");

  const outcome = await openDispute(id, { reason: body.reason, buyer: body.buyer, seller: body.seller });
  if (!outcome.ok) return jsonError(outcome.error === "not_found" ? "Deal not found" : (outcome.error ?? "Couldn't open the dispute."), outcome.error === "not_found" ? 404 : 400);
  return Response.json({ deal: outcome.deal, resolution: outcome.resolution });
}
