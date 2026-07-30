/* ==========================================================================
   /api/deals/[id]
   GET   → one deal
   PATCH → advance the deal { status, note? } — fund, ship, complete, dispute, refund
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { getDeal, setDealStatus } from "@/lib/deals/store";
import type { DealStatus } from "@/lib/deals/types";

const VALID_STATUS: DealStatus[] = ["created", "funded", "shipped", "completed", "disputed", "refunded"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = await readJson<{ status?: string; note?: string }>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!body.status || !VALID_STATUS.includes(body.status as DealStatus)) {
    return jsonError(`status must be one of: ${VALID_STATUS.join(", ")}`);
  }

  const deal = await setDealStatus(id, body.status as DealStatus, body.note);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal });
}
