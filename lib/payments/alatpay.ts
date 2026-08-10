/* ==========================================================================
   ALATPay — merchant payment gateway (developer.alatpay.ng). Collects the
   buyer's money into escrow. LIVE client only — the mock path in ./index never
   calls these. (Ported from Jerry's lib/alatpay.ts; logic unchanged.)

   Confirm the exact base URL + callback payload shape against the ALATPay
   merchant dashboard once the business/API key are approved — sandbox vs live
   hosts differ and this hasn't been tested against a live sandbox yet.
   ========================================================================== */

import { createHmac, timingSafeEqual } from "node:crypto";
import { ALATPAY_API_KEY, ALATPAY_BUSINESS_ID, ALATPAY_WEBHOOK_SECRET } from "./config";

const ALATPAY_BASE_URL = "https://apibox.alatpay.ng/bank-transfer/api/v1"; // verify in ALATPay dashboard docs

function alatPayHeaders() {
  return { "Ocp-Apim-Subscription-Key": ALATPAY_API_KEY, "Content-Type": "application/json" };
}

/** A one-time virtual account for the buyer to pay into. ALATPay's expire ~30 min;
    we track our own tighter ~10-min window on the deal. */
export async function generateVirtualAccount(input: {
  amount: number; // naira
  transactionRef: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerName: string;
}) {
  const res = await fetch(`${ALATPAY_BASE_URL}/transactions/${ALATPAY_BUSINESS_ID}`, {
    method: "POST",
    headers: alatPayHeaders(),
    body: JSON.stringify({
      businessId: ALATPAY_BUSINESS_ID,
      amount: input.amount,
      currency: "NGN",
      orderId: input.transactionRef,
      description: "Zafe escrow deposit",
      customer: {
        email: input.buyerEmail,
        phone: input.buyerPhone,
        firstName: input.buyerName.split(" ")[0] || input.buyerName,
        lastName: input.buyerName.split(" ").slice(1).join(" ") || "-",
      },
    }),
  });
  if (!res.ok) throw new Error(`ALATPay virtual account request failed: ${res.status}`);
  return res.json();
}

/** Re-query a transaction's status directly, instead of trusting the callback alone. */
export async function checkTransactionStatus(alatTransactionId: string) {
  const res = await fetch(`${ALATPAY_BASE_URL}/transactions/verify/${alatTransactionId}`, { headers: alatPayHeaders() });
  if (!res.ok) throw new Error(`ALATPay status check failed: ${res.status}`);
  return res.json();
}

/** ALATPay callback SHAPE check. This only confirms the payload looks like an
    ALATPay event for our business — the businessId is an identifier, NOT a
    secret, so this alone does not authenticate the sender. Authentication is
    the HMAC signature (below) in mock-collection deployments, or the live
    re-query in live-collection deployments. */
export function isValidAlatPayCallback(payload: unknown): boolean {
  const p = payload as { data?: { businessId?: string; status?: unknown } } | null;
  return Boolean(p && p.data && p.data.businessId === ALATPAY_BUSINESS_ID && typeof p.data.status === "string");
}

/**
 * Verify an ALATPay webhook's HMAC signature against the RAW request body.
 * Returns false when no secret is configured (caller must then fall back to the
 * live re-query, or refuse to fund). Confirm ALAT's exact header name and
 * digest scheme in the merchant dashboard; this uses HMAC-SHA256(hex).
 */
export function isAlatPayCallbackSignatureValid(rawBody: string, signatureHeader: string | null): boolean {
  if (!ALATPAY_WEBHOOK_SECRET || !signatureHeader) return false;
  const expected = createHmac("sha256", ALATPAY_WEBHOOK_SECRET).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when a webhook secret is configured, so signatures can be verified. */
export function alatPayWebhookSecretConfigured(): boolean {
  return Boolean(ALATPAY_WEBHOOK_SECRET);
}
