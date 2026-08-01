/* ==========================================================================
   POST /api/webhooks/alatpay
   ALATPay's "the money truly landed" callback. We never trust a screenshot:
   we verify the callback AND re-query ALATPay's own status endpoint, then mark
   the matching deal "funded". (Ported from Jerry's webhook; now on `deals`, and
   the Trust Score already ran at deal creation so it isn't recomputed here.)
   ========================================================================== */

import { getDealByReference, setDealStatus } from "@/lib/deals/store";
import { checkTransactionStatus, isValidAlatPayCallback } from "@/lib/payments";
import { collectionLive } from "@/lib/payments/config";

export async function POST(req: Request): Promise<Response> {
  const payload = await req.json().catch(() => null);

  if (!isValidAlatPayCallback(payload)) {
    return Response.json({ error: "invalid callback payload" }, { status: 401 });
  }
  const data = (payload as { data: { status: string; orderId: string; transactionId?: string; id?: string } }).data;
  if (data.status !== "completed" && data.status !== "successful") {
    return Response.json({ received: true }); // ignore pending/failed events
  }

  // Find the deal by its reference (the ALATPay orderId).
  const deal = await getDealByReference(data.orderId);
  if (!deal) return Response.json({ error: "deal not found" }, { status: 404 });

  // Re-query rather than trusting the callback alone — the "no fake receipts" guarantee.
  if (collectionLive()) {
    const idToVerify = deal.alatTransactionId || data.transactionId || data.id;
    if (!idToVerify) return Response.json({ error: "missing transaction id for verification" }, { status: 400 });
    const verified = await checkTransactionStatus(idToVerify).catch(() => null);
    const vs = verified?.data?.status;
    if (vs !== "completed" && vs !== "successful") {
      return Response.json({ error: "callback did not match verified status" }, { status: 409 });
    }
  }

  await setDealStatus(deal.id, "funded", "Payment confirmed by ALATPay — money held in escrow.");
  return Response.json({ received: true });
}
