/* ==========================================================================
   POST /api/refund  { dealId, amount? }
   Refund the buyer (full, or partial with the remainder paid to the seller).
   The dispute flow applies refunds automatically from the AI ruling; this is
   the direct REST entry. (Ported from Jerry's refund route; now on `deals`.)
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { refundDeal } from "@/lib/deals/store";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ dealId?: string; amount?: number }>(req);
  if (!body?.dealId) return jsonError("dealId is required.");
  if (body.amount !== undefined && (typeof body.amount !== "number" || body.amount <= 0)) {
    return jsonError("amount must be a positive number.");
  }

  const result = await refundDeal(body.dealId, body.amount);
  if (!result.ok) return jsonError(result.error ?? "Refund failed.", result.error === "not_found" ? 404 : 400);

  return Response.json({ ok: true, deal: result.deal });
}
