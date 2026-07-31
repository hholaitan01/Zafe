/* ==========================================================================
   POST /api/deals/:id/ship
   Seller dispatches the item. Mints the buyer's secret handover code and
   starts the auto-release timer.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { shipDeal } from "@/lib/deals/store";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const deal = await shipDeal(id);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal });
}
