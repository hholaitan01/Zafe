/* ==========================================================================
   POST /api/deals/:id/dispute
   Body: { reason?, buyer?: { claim, evidence? }, seller?: { claim, evidence? } }
   Open a dispute: the AI suggests a resolution but no money moves until the
   proper acceptance/review flow settles it.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { openDispute, type DisputeInput } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to dispute this deal." : "Deal not found", access.status);
  const body = await readJson<DisputeInput>(req);
  if (!body) return jsonError("Invalid JSON body");

  const role = await callerRoleOnDeal(access.deal);
  if (role === "other") return jsonError("You are not a party to this deal.", 403);

  if (role === "demo") {
    if (!body.buyer || !isNonEmptyString(body.buyer.claim)) return jsonError("buyer.claim is required.");
    if (!body.seller || !isNonEmptyString(body.seller.claim)) return jsonError("seller.claim is required.");
  } else if (role === "buyer") {
    if (!body.buyer || !isNonEmptyString(body.buyer.claim)) return jsonError("buyer.claim is required.");
    if (body.seller?.claim && !isNonEmptyString(body.seller.claim)) return jsonError("seller.claim must be a non-empty string.");
  } else {
    if (!body.seller || !isNonEmptyString(body.seller.claim)) return jsonError("seller.claim is required.");
    if (body.buyer?.claim && !isNonEmptyString(body.buyer.claim)) return jsonError("buyer.claim must be a non-empty string.");
  }

  const outcome = await openDispute(id, { reason: body.reason, buyer: body.buyer, seller: body.seller });
  if (!outcome.ok) return jsonError(outcome.error === "not_found" ? "Deal not found" : (outcome.error ?? "Couldn't open the dispute."), outcome.error === "not_found" ? 404 : 400);
  return Response.json({ deal: outcome.deal, resolution: outcome.resolution });
}
