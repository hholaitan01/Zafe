/* ==========================================================================
   GET /api/receipt/:id           → receipt JSON for a deal
   GET /api/receipt/:id?format=text → plain-text receipt (WhatsApp/SMS share)
   (Ported from Jerry's receipt route; now on the `deals` model.)
   ========================================================================== */

import { authorizeDeal } from "@/lib/deals/access";
import { buildReceipt, receiptToText } from "@/lib/payments/receipt";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // A receipt exposes the deal's money details — parties only (guards IDOR).
  const access = await authorizeDeal(id);
  if (!access.ok) return Response.json({ error: access.status === 401 ? "sign in" : "not found" }, { status: access.status });
  const deal = access.deal;

  const receipt = buildReceipt(deal);
  if (new URL(req.url).searchParams.get("format") === "text") {
    return new Response(receiptToText(receipt), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return Response.json({ receipt });
}
