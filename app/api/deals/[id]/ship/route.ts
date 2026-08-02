/* ==========================================================================
   POST /api/deals/:id/ship
   Seller dispatches the item. Mints the buyer's secret handover code and
   starts the auto-release timer.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { shipDeal } from "@/lib/deals/store";
import type { PayoutAccount } from "@/lib/deals/types";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Optional: the seller's payout account, captured at ship time so the release
  // can pay them.
  const body = await readJson<{ sellerPayout?: PayoutAccount }>(req).catch(() => null);
  const deal = await shipDeal(id, body?.sellerPayout);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal });
}
