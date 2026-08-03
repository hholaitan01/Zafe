/* ==========================================================================
   POST /api/deals/:id/dispute
   Body: { buyer: { claim, evidence? }, seller: { claim, evidence? } }
   The full dispute flow: open the dispute, run the AI judge on both sides'
   evidence, apply the decision, and move the money. Returns the updated deal
   (with dispute.resolution) so the Dispute screen can show the ruling.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { openAndJudgeDispute, type DisputeInput } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Only a party to the deal may open a dispute on it (guards against IDOR).
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to dispute this deal." : "Deal not found", access.status);
  const body = await readJson<DisputeInput>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!body.buyer || !isNonEmptyString(body.buyer.claim)) return jsonError("buyer.claim is required.");
  if (!body.seller || !isNonEmptyString(body.seller.claim)) return jsonError("seller.claim is required.");

  const outcome = await openAndJudgeDispute(id, { buyer: body.buyer, seller: body.seller });
  if (!outcome.ok) {
    if (outcome.error === "not_found") return jsonError("Deal not found", 404);
    // Ruling was made but the money didn't move — the deal is left "disputed"
    // (settlement pending), not closed. Surface it so the client can retry.
    return Response.json({ deal: outcome.deal, resolution: outcome.resolution, error: outcome.error }, { status: 502 });
  }
  return Response.json({ deal: outcome.deal, resolution: outcome.resolution });
}
