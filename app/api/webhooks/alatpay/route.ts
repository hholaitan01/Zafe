/* ==========================================================================
   POST /api/webhooks/alatpay
   ALATPay's "the money truly landed" callback → marks the matching deal "funded".

   The payload's businessId is an identifier, NOT a secret, so we never fund on
   the shape check alone. A callback must be AUTHENTICATED one of two ways:
     • live collection → we re-query ALATPay's own status endpoint (can't be forged), or
     • otherwise       → a valid HMAC signature over the raw body (shared secret).
   If neither can vouch for the callback, we refuse to fund. This closes the
   forged-funding path in a mock-collection deployment.
   ========================================================================== */

import { getDealByReference, setDealStatus } from "@/lib/deals/store";
import {
  alatPayWebhookSecretConfigured,
  checkTransactionStatus,
  isAlatPayCallbackSignatureValid,
  isValidAlatPayCallback,
} from "@/lib/payments";
import { collectionLive } from "@/lib/payments/config";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(req: Request): Promise<Response> {
  // Throttle: this endpoint is public and looks a deal up by reference.
  const rl = rateLimit(req, "webhook", 60, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  // Read the RAW body so the HMAC is computed over exactly what was signed.
  const raw = await req.text();
  const signatureHeader = req.headers.get("x-alatpay-signature") ?? req.headers.get("x-signature");
  let payload: unknown = null;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "invalid callback payload" }, { status: 400 });
  }

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

  // AUTHENTICATE before funding.
  if (collectionLive()) {
    // Re-query ALATPay directly rather than trusting the callback — a forged
    // callback can't make ALATPay report a transaction as completed.
    const idToVerify = deal.alatTransactionId || data.transactionId || data.id;
    if (!idToVerify) return Response.json({ error: "missing transaction id for verification" }, { status: 400 });
    const verified = await checkTransactionStatus(idToVerify).catch(() => null);
    const vs = verified?.data?.status;
    if (vs !== "completed" && vs !== "successful") {
      return Response.json({ error: "callback did not match verified status" }, { status: 409 });
    }
  } else if (alatPayWebhookSecretConfigured()) {
    // No live re-query available, so require a valid HMAC signature.
    if (!isAlatPayCallbackSignatureValid(raw, signatureHeader)) {
      return Response.json({ error: "invalid or missing signature" }, { status: 401 });
    }
  } else {
    // Cannot authenticate the callback at all → refuse to fund rather than
    // trust a forgeable payload. Configure ALATPAY_WEBHOOK_SECRET (or run live
    // collection) to enable funding via this webhook.
    return Response.json({ error: "webhook not authenticated; funding refused" }, { status: 503 });
  }

  await setDealStatus(deal.id, "funded", "Payment confirmed by ALATPay — money held in escrow.");
  return Response.json({ received: true });
}
