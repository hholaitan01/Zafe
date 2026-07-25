/* ==========================================================================
   POST /api/trust-score
   Body: { chat: string, seller?: {...}, item?: {...} }
   Returns a 0–100 Trust Score with reasons and red flags.
   ========================================================================== */

import { getTrustScore } from "@/lib/ai/trust-score";
import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import type { TrustScoreRequest } from "@/lib/ai/types";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<TrustScoreRequest>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!isNonEmptyString(body.chat)) {
    return jsonError("A 'chat' string is required (the pasted buyer/seller conversation).");
  }

  const result = await getTrustScore({
    chat: body.chat,
    seller: body.seller,
    item: body.item,
  });
  return Response.json(result);
}
