/* ==========================================================================
   POST /api/dispute
   Body: { buyer: { claim, evidence? }, seller: { claim, evidence? },
           item?, amount?, chat? }
   The AI dispute judge decides: release to seller, refund buyer, or split.
   ========================================================================== */

import { getDisputeDecision } from "@/lib/ai/dispute";
import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import type { DisputeRequest } from "@/lib/ai/types";

export async function POST(req: Request): Promise<Response> {
  // Unauthenticated + calls the Anthropic API, so throttle to protect the AI budget.
  const rl = rateLimit(req, "ai", 20, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  const body = await readJson<DisputeRequest>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!body.buyer || !isNonEmptyString(body.buyer.claim)) {
    return jsonError("buyer.claim is required.");
  }
  if (!body.seller || !isNonEmptyString(body.seller.claim)) {
    return jsonError("seller.claim is required.");
  }

  const result = await getDisputeDecision({
    buyer: body.buyer,
    seller: body.seller,
    item: body.item,
    amount: body.amount,
    chat: body.chat,
  });
  return Response.json(result);
}
