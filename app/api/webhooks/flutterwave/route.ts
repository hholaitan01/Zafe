/* ==========================================================================
   POST /api/webhooks/flutterwave
   Flutterwave's "charge.completed" callback → marks the matching deal "funded".

   Two guarantees, same posture as the ALAT and Paystack webhooks:
     • AUTHENTICATE first. Flutterwave echoes a secret hash in the `verif-hash`
       header; a request whose hash does not match ours is refused (fail closed)
       — we never fund on payload shape alone.
     • Process EXACTLY ONCE. Flutterwave re-delivers until it gets a 200, so we
       claim the event id and no-op every repeat, and (defence in depth) re-query
       the transaction's true status before funding.
   ========================================================================== */

import { getDealByReference, setDealStatus } from "@/lib/deals/store";
import { flutterwaveProvider } from "@/lib/payments/providers";
import { claimOnce } from "@/lib/payments/idempotency";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(req, "webhook", 60, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  // Read the RAW body so parsing sees exactly what was sent.
  const raw = await req.text();
  const event = flutterwaveProvider.parseWebhook(raw, req.headers);
  if (!event) return Response.json({ error: "unrecognised payload" }, { status: 400 });

  // AUTHENTICATE before doing anything.
  if (!event.authenticated) {
    return Response.json({ error: "invalid or missing signature" }, { status: 401 });
  }

  // Only successful collections fund; acknowledge everything else so Flutterwave
  // stops retrying.
  if (!event.funded) return Response.json({ received: true });

  // Process each event exactly once. A re-delivery is a successful no-op.
  const first = await claimOnce(event.eventId);
  if (!first) return Response.json({ received: true, duplicate: true });

  const deal = await getDealByReference(event.reference);
  if (!deal) return Response.json({ error: "deal not found" }, { status: 404 });

  // Defence in depth: confirm the transaction is really successful with
  // Flutterwave directly, rather than trusting the (already hash-checked) callback.
  const verified = await flutterwaveProvider.verifyTransaction(event.providerRef ?? event.reference);
  if (!verified?.successful) {
    return Response.json({ error: "callback did not match verified status" }, { status: 409 });
  }

  await setDealStatus(deal.id, "funded", "Payment confirmed by Flutterwave — money held in escrow.");
  return Response.json({ received: true });
}
