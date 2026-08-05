/* ==========================================================================
   POST /api/refund  { dealId, amount? }
   Refund the buyer (full, or partial with the remainder paid to the seller).
   The dispute flow applies refunds automatically from the AI ruling; this is
   the direct REST entry. (Ported from Jerry's refund route; now on `deals`.)
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { refundDeal } from "@/lib/deals/store";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ dealId?: string; amount?: number }>(req);
  if (!body?.dealId) return jsonError("dealId is required.");
  if (body.amount !== undefined && (typeof body.amount !== "number" || body.amount <= 0)) {
    return jsonError("amount must be a positive number.");
  }

  // Refunds return escrow to the buyer. Guard against IDOR, and only let the
  // SELLER issue one (goodwill / correcting their own sale) — never the buyer,
  // who could otherwise refund themselves after taking delivery. Platform
  // refunds run through the dispute flow, not this route.
  const access = await authorizeDeal(body.dealId);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to refund this deal." : "Deal not found", access.status);
  const role = await callerRoleOnDeal(access.deal);
  if (role === "buyer" || role === "other") {
    return jsonError("Only the seller can issue a refund here. Disputes are resolved from the dispute flow.", 403);
  }

  const result = await refundDeal(body.dealId, body.amount);
  if (!result.ok) return jsonError(result.error ?? "Refund failed.", result.error === "not_found" ? 404 : 400);

  return Response.json({ ok: true, deal: result.deal });
}
