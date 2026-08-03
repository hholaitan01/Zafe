/* ==========================================================================
   POST /api/deals/:id/release   { code }
   Buyer confirms delivery with their secret handover code → seller is paid.
   A wrong code can't release the money.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { releaseWithCode } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Only a party to the deal may release it (guards against IDOR); the handover
  // code is the second factor that actually authorizes the payout.
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to release this deal." : "Deal not found", access.status);
  const body = await readJson<{ code?: string }>(req);
  if (!body || !isNonEmptyString(body.code)) return jsonError("A handover 'code' is required.");

  const result = await releaseWithCode(id, body.code);
  if (!result.ok) {
    if (result.error === "not_found") return jsonError("Deal not found", 404);
    return jsonError(result.error ?? "Could not release the money.");
  }
  return Response.json({ deal: result.deal });
}
