/* ==========================================================================
   GET /api/receipt/:id           → receipt JSON for a deal
   GET /api/receipt/:id?format=text → plain-text receipt (WhatsApp/SMS share)
   (Ported from Jerry's receipt route; now on the `deals` model.)
   ========================================================================== */

import { getDeal } from "@/lib/deals/store";
import { buildReceipt, receiptToText } from "@/lib/payments/receipt";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) return Response.json({ error: "not found" }, { status: 404 });

  const receipt = buildReceipt(deal);
  if (new URL(req.url).searchParams.get("format") === "text") {
    return new Response(receiptToText(receipt), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return Response.json({ receipt });
}
