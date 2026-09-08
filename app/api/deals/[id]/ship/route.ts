/* ==========================================================================
   POST /api/deals/:id/ship
   Seller dispatches the item. Mints the buyer's secret handover code and
   starts the auto-release timer.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { shipDeal } from "@/lib/deals/store";
import { publicDeal } from "@/lib/deals/redact";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Only a party to the deal may reach it (guards against IDOR)…
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to update this deal." : "Deal not found", access.status);
  // …and shipping is a SELLER-only action — a buyer must not be able to mark a
  // deal shipped. The payout destination is resolved server-side in shipDeal
  // from the seller's saved account; nothing about it is accepted from the body.
  const role = await callerRoleOnDeal(access.deal);
  if (role !== "seller" && role !== "demo") return jsonError("Only the seller can mark this deal shipped.", 403);
  const deal = await shipDeal(id);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal: publicDeal(deal) });
}
