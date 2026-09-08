/* ==========================================================================
   POST /api/webhooks/paystack
   Paystack's "charge.success" callback → marks the matching deal "funded".

   Two guarantees, same posture as the ALAT webhook:
     • AUTHENTICATE first. Paystack signs the raw body with HMAC-SHA512 using the
       secret key. A body whose signature does not verify is refused (fail
       closed) — we never fund on payload shape alone.
     • Process EXACTLY ONCE. Paystack re-delivers until it gets a 200, so we
       claim the event id and no-op every repeat, and (defence in depth) re-query
       the transaction's true status before funding.
   ========================================================================== */

import { getDealByReference, setDealStatus } from "@/lib/deals/store";
import { canTransition } from "@/lib/deals/transitions";
import { paystackProvider } from "@/lib/payments/providers";
import { claimOnce } from "@/lib/payments/idempotency";
import { verifyFunding } from "@/lib/payments/funding";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(req, "webhook", 60, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  // Read the RAW body so the HMAC is computed over exactly what was signed.
  const raw = await req.text();
  const event = paystackProvider.parseWebhook(raw, req.headers);
  if (!event) return Response.json({ error: "unrecognised payload" }, { status: 400 });

  // AUTHENTICATE before doing anything.
  if (!event.authenticated) {
    return Response.json({ error: "invalid or missing signature" }, { status: 401 });
  }

  // Only successful collections fund; acknowledge everything else so Paystack
  // stops retrying.
  if (!event.funded) return Response.json({ received: true });

  const deal = await getDealByReference(event.reference);
  if (!deal) return Response.json({ error: "deal not found" }, { status: 404 });

  // A settled deal is terminal for funding: never move completed/refunded/resolved
  // back to funded. Acknowledge so the provider stops retrying.
  if (!canTransition(deal.status, "funded")) {
    return Response.json({ received: true, alreadySettled: true });
  }

  // VERIFY BEFORE CLAIMING (audit #8). Confirm the transaction is really
  // successful with Paystack, then that the buyer paid the right currency and
  // amount — BEFORE consuming the event id. A transient verify failure returns
  // 409 without burning the event, so Paystack's retry can still fund the deal;
  // claiming first would strand a real payment as a "duplicate" forever.
  const verified = await paystackProvider.verifyTransaction(event.providerRef ?? event.reference);
  if (!verified?.successful) {
    return Response.json({ error: "callback did not match verified status" }, { status: 409 });
  }
  const funding = verifyFunding(deal, { amountNaira: event.amountNaira, currency: event.currency });
  if (!funding.ok) {
    return Response.json({ error: `funding rejected: ${funding.reason}` }, { status: 409 });
  }

  // Now claim, so funding happens exactly once. A re-delivery is a no-op; and
  // setDealStatus("funded") is itself idempotent (funded → funded).
  const first = await claimOnce(event.eventId);
  if (!first) return Response.json({ received: true, duplicate: true });

  await setDealStatus(deal.id, "funded", "Payment confirmed by Paystack — money held in escrow.");
  return Response.json({ received: true });
}
