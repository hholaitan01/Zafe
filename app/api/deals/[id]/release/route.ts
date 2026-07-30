/* ==========================================================================
   POST /api/deals/:id/release   { code }
   Buyer confirms delivery with their secret handover code → seller is paid.
   A wrong code can't release the money.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { releaseWithCode } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = await readJson<{ code?: string }>(req);
  if (!body || !isNonEmptyString(body.code)) return jsonError("A handover 'code' is required.");

  const result = await releaseWithCode(id, body.code);
  if (!result.ok) {
    if (result.error === "not_found") return jsonError("Deal not found", 404);
    return jsonError(result.error ?? "Could not release the money.");
  }
  return Response.json({ deal: result.deal });
}
