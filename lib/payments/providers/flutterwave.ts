/* ==========================================================================
   Flutterwave provider (api.flutterwave.com/v3).

   One secret key (FLW_SECRET_KEY) covers collection, payout (transfers) and
   status re-query. Webhooks are authenticated differently from Paystack:
   Flutterwave does NOT sign the body — it sends a fixed `verif-hash` header that
   must equal a secret hash you set in the dashboard (FLW_SECRET_HASH). We
   compare it in constant time and fail closed when it is missing or wrong.

   Amounts on the wire are whole Naira (Flutterwave's NGN unit), so no minor-unit
   conversion is needed. As with the ALAT and Paystack clients, confirm the exact
   fields against your Flutterwave dashboard before the first real transaction —
   only the pure logic here (hash check, event parsing) runs without live keys.
   ========================================================================== */

import { timingSafeEqual } from "node:crypto";
import { FLW_SECRET_KEY, FLW_SECRET_HASH } from "../config";
import type {
  CollectionAccount,
  CollectionRequest,
  PaymentProvider,
  TransferRequest,
  TransferResult,
  WebhookEvent,
} from "./types";

const BASE = "https://api.flutterwave.com/v3";
const TEN_MIN_MS = 10 * 60 * 1000;

function headers() {
  return { Authorization: `Bearer ${FLW_SECRET_KEY}`, "Content-Type": "application/json" };
}
async function api(path: string, init?: RequestInit): Promise<{ status?: string; data?: Record<string, unknown>; message?: string }> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status === "error") {
    throw new Error(`Flutterwave ${path} failed: ${res.status} ${body?.message ?? ""}`.trim());
  }
  return body;
}

export const flutterwaveProvider: PaymentProvider = {
  id: "flutterwave",

  async createCollection(req: CollectionRequest): Promise<CollectionAccount> {
    // A one-time (non-permanent) virtual account for this exact amount, tagged
    // with our reference (tx_ref) so the webhook maps straight back to the deal.
    const body = await api("/virtual-account-numbers", {
      method: "POST",
      body: JSON.stringify({
        email: req.customerEmail,
        amount: req.amountNaira,
        currency: "NGN",
        tx_ref: req.reference,
        is_permanent: false,
        narration: req.customerName,
      }),
    });
    const d = body.data ?? {};
    return {
      accountNumber: String(d.account_number ?? ""),
      bankName: String(d.bank_name ?? "Bank"),
      providerRef: req.reference,
      expiresAt: new Date(Date.now() + TEN_MIN_MS).toISOString(),
    };
  },

  async verifyTransaction(providerRef: string): Promise<{ successful: boolean } | null> {
    try {
      const body = await api(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerRef)}`);
      return { successful: body.data?.status === "successful" };
    } catch {
      return null;
    }
  },

  async transfer(req: TransferRequest): Promise<TransferResult> {
    try {
      if (req.accountName) {
        const resolved = await api("/accounts/resolve", {
          method: "POST",
          body: JSON.stringify({ account_number: req.accountNumber, account_bank: req.bankCode }),
        });
        const name = String(resolved.data?.account_name ?? "");
        if (name && !namesRoughlyMatch(name, req.accountName)) {
          return { ok: false, error: "Account name mismatch — transfer blocked." };
        }
      }
      // `reference` is deterministic per operation, so a retry reuses it and
      // Flutterwave's duplicate-reference guard blocks a second transfer.
      const out = await api("/transfers", {
        method: "POST",
        body: JSON.stringify({
          account_bank: req.bankCode,
          account_number: req.accountNumber,
          amount: req.amountNaira,
          currency: "NGN",
          narration: req.narration,
          reference: req.reference,
        }),
      });
      const status = String(out.data?.status ?? "").toUpperCase();
      if (status === "FAILED") {
        return { ok: false, error: "Transfer failed." };
      }
      return { ok: true, ref: String(out.data?.id ?? req.reference) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },

  parseWebhook(rawBody: string, reqHeaders: Headers): WebhookEvent | null {
    let evt: { event?: string; data?: { tx_ref?: string; id?: number | string; status?: string } };
    try {
      evt = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!evt || typeof evt.event !== "string" || !evt.data) return null;

    const authenticated = verifyHash(reqHeaders.get("verif-hash"));
    const reference = String(evt.data.tx_ref ?? "");
    return {
      authenticated,
      funded: evt.event === "charge.completed" && evt.data.status === "successful",
      reference,
      providerRef: reference,
      eventId: `flutterwave:${evt.data.id ?? reference}`,
    };
  },
};

/** Flutterwave sends a fixed secret hash in `verif-hash`; it must equal ours. */
export function verifyHash(headerValue: string | null): boolean {
  if (!FLW_SECRET_HASH || !headerValue) return false;
  const a = Buffer.from(FLW_SECRET_HASH);
  const b = Buffer.from(headerValue.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

function namesRoughlyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  return norm(a).includes(norm(b).slice(0, 6)) || norm(b).includes(norm(a).slice(0, 6));
}
