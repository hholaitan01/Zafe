/* ==========================================================================
   POST /api/deals/:id/ship
   Seller dispatches the item. Mints the buyer's secret handover code and
   starts the auto-release timer.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { shipDeal } from "@/lib/deals/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to update this deal." : "Deal not found", access.status);

  const role = await callerRoleOnDeal(access.deal);
  if (role !== "seller" && role !== "demo") {
    return jsonError("Only the seller can mark this deal as shipped.", 403);
  }

  // Never accept a bank account from this request. The lifecycle service looks
  // up the seller's saved payout account server-side, preventing a client from
  // redirecting the escrow to an arbitrary account.
  const deal = await shipDeal(id);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal });
}
