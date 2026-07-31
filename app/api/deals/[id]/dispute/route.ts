/* ==========================================================================
   POST /api/deals/:id/dispute
   Body: { buyer: { claim, evidence? }, seller: { claim, evidence? } }
   The full dispute flow: open the dispute, run the AI judge on both sides'
   evidence, apply the decision, and move the money. Returns the updated deal
   (with dispute.resolution) so the Dispute screen can show the ruling.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { openAndJudgeDispute, type DisputeInput } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = await readJson<DisputeInput>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!body.buyer || !isNonEmptyString(body.buyer.claim)) return jsonError("buyer.claim is required.");
  if (!body.seller || !isNonEmptyString(body.seller.claim)) return jsonError("seller.claim is required.");

  const deal = await openAndJudgeDispute(id, { buyer: body.buyer, seller: body.seller });
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal, resolution: deal.dispute?.resolution });
}
