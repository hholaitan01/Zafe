/* ==========================================================================
   POST /api/deals/:id/dispute
   Body: { reason?, buyer?: { claim, evidence? }, seller?: { claim, evidence? } }
   A live caller may submit only their own side's claim. If the other side has
   not submitted a claim yet, the request is rejected rather than accepting a
   client assertion on their behalf.
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
  } else {
    const existing = access.deal.dispute;
    const buyer = role === "buyer" ? body.buyer : existing?.buyer;
    const seller = role === "seller" ? body.seller : existing?.seller;

    if (!buyer || !isNonEmptyString(buyer.claim)) {
      return jsonError("The buyer must submit a claim before this dispute can be judged.");
    }
    if (!seller || !isNonEmptyString(seller.claim)) {
      return jsonError("The seller must submit a claim before this dispute can be judged.");
    }

    const outcome = await openDispute(id, {
      reason: body.reason,
      buyer,
      seller,
    });
    if (!outcome.ok) return jsonError(outcome.error === "not_found" ? "Deal not found" : (outcome.error ?? "Couldn't open the dispute."), outcome.error === "not_found" ? 404 : 400);
    return Response.json({ deal: outcome.deal, resolution: outcome.resolution });
  }

  const outcome = await openDispute(id, { reason: body.reason, buyer: body.buyer, seller: body.seller });
  if (!outcome.ok) return jsonError(outcome.error === "not_found" ? "Deal not found" : (outcome.error ?? "Couldn't open the dispute."), outcome.error === "not_found" ? 404 : 400);
  return Response.json({ deal: outcome.deal, resolution: outcome.resolution });
}
