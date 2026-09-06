/* ==========================================================================
   Paystack provider (api.paystack.co).

   One secret key covers collection, payout (transfers) and webhook signing.
   Amounts on the wire are in KOBO (Naira × 100); this module converts so the
   rest of Zafe only ever passes whole Naira.

   The live HTTP shapes follow Paystack's documented API. As with the ALAT
   client, confirm the exact fields against your Paystack dashboard before the
   first real transaction — only the pure logic here (signature verification,
   kobo conversion, event parsing) is exercised without live keys.
   ========================================================================== */

import { createHmac, timingSafeEqual } from "node:crypto";
import { PAYSTACK_SECRET_KEY } from "../config";
import type {
  CollectionAccount,
  CollectionRequest,
  PaymentProvider,
  TransferRequest,
  TransferResult,
  WebhookEvent,
} from "./types";

const BASE = "https://api.paystack.co";
const TEN_MIN_MS = 10 * 60 * 1000;

function headers() {
  return { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" };
}
function toKobo(naira: number): number {
  return Math.round(naira * 100);
}
async function api(path: string, init?: RequestInit): Promise<{ status: boolean; data?: Record<string, unknown>; message?: string }> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status === false) {
    throw new Error(`Paystack ${path} failed: ${res.status} ${body?.message ?? ""}`.trim());
  }
  return body;
}

export const paystackProvider: PaymentProvider = {
  id: "paystack",

  async createCollection(req: CollectionRequest): Promise<CollectionAccount> {
    // "Pay with Transfer" — a one-time virtual account for this exact amount,
    // tagged with our reference so the webhook maps straight back to the deal.
    const body = await api("/charge", {
      method: "POST",
      body: JSON.stringify({
        email: req.customerEmail,
        amount: toKobo(req.amountNaira),
        currency: "NGN",
        reference: req.reference,
        bank_transfer: {},
        metadata: { deal_reference: req.reference, customer_name: req.customerName },
      }),
    });
    const d = body.data ?? {};
    return {
      accountNumber: String(d.account_number ?? d.account_no ?? ""),
      bankName: String(d.bank_name ?? (d.bank as { name?: string } | undefined)?.name ?? "Bank"),
      providerRef: req.reference,
      expiresAt: new Date(Date.now() + TEN_MIN_MS).toISOString(),
    };
  },

  async verifyTransaction(providerRef: string): Promise<{ successful: boolean } | null> {
    try {
      const body = await api(`/transaction/verify/${encodeURIComponent(providerRef)}`);
      return { successful: body.data?.status === "success" };
    } catch {
      return null;
    }
  },

  async transfer(req: TransferRequest): Promise<TransferResult> {
    try {
      if (req.accountName) {
        const resolved = await api(
          `/bank/resolve?account_number=${encodeURIComponent(req.accountNumber)}&bank_code=${encodeURIComponent(req.bankCode)}`,
        );
        const name = String(resolved.data?.account_name ?? "");
        if (name && !namesRoughlyMatch(name, req.accountName)) {
          return { ok: false, error: "Account name mismatch — transfer blocked." };
        }
      }
      const recipient = await api("/transferrecipient", {
        method: "POST",
        body: JSON.stringify({ type: "nuban", name: req.accountName || "Zafe payee", account_number: req.accountNumber, bank_code: req.bankCode, currency: "NGN" }),
      });
      const recipientCode = String(recipient.data?.recipient_code ?? "");
      // `reference` is deterministic per operation, so a retry hits Paystack's
      // duplicate-reference guard instead of sending a second transfer.
      const out = await api("/transfer", {
        method: "POST",
        body: JSON.stringify({ source: "balance", amount: toKobo(req.amountNaira), recipient: recipientCode, reason: req.narration, reference: req.reference }),
      });
      const status = String(out.data?.status ?? "");
      if (status === "failed" || status === "abandoned" || status === "reversed") {
        return { ok: false, error: `Transfer ${status}.` };
      }
      return { ok: true, ref: String(out.data?.transfer_code ?? req.reference) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  parseWebhook(rawBody: string, reqHeaders: Headers): WebhookEvent | null {
    let evt: { event?: string; data?: { reference?: string; id?: number | string; status?: string } };
    try {
      evt = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!evt || typeof evt.event !== "string" || !evt.data) return null;

    const authenticated = verifySignature(rawBody, reqHeaders.get("x-paystack-signature"));
    const reference = String(evt.data.reference ?? "");
    return {
      authenticated,
      funded: evt.event === "charge.success" && evt.data.status === "success",
      reference,
      providerRef: reference,
      eventId: `paystack:${evt.data.id ?? reference}`,
    };
  },
};

/** Paystack signs the raw body with HMAC-SHA512 using the secret key. */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!PAYSTACK_SECRET_KEY || !signatureHeader) return false;
  const expected = createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

function namesRoughlyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  return norm(a).includes(norm(b).slice(0, 6)) || norm(b).includes(norm(a).slice(0, 6));
}
