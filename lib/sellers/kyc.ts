/* ==========================================================================
   Seller identity verification (KYC) seam.

   Submitting a payout form is NOT identity verification. The "Verified" badge —
   which the trust model and buyers rely on — must reflect a real check, or it
   means nothing in a product whose whole promise is trust.

   Same live/demo seam as the rest of the app:
     • DEMO (no Supabase backend) — a sandbox with no real identities, so we
       treat sellers as verified to keep the happy-path flow demoable.
     • LIVE — a real BVN/vNIN check runs through the configured provider
       (KYC_PROVIDER). With no provider or a failed check, the seller stays
       unverified: an unverified badge is honest, a fake verified one is not.

   Provider: Dojah (dojah.io). BVN and vNIN lookups return the name registered
   with the government; we pass only when it matches the name the seller entered.
   The ID number is used to verify and then discarded — it is never stored.

   Env:
     KYC_PROVIDER=dojah
     DOJAH_APP_ID=...             (dashboard → app)
     DOJAH_SECRET_KEY=...         (dashboard → API keys; the Authorization value)
     DOJAH_BASE_URL=https://api.dojah.io      (or https://sandbox.dojah.io to test)
   Sandbox test values: BVN 22222222222, vNIN 70123456789.
   ========================================================================== */

import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";

const KYC_PROVIDER = (process.env.KYC_PROVIDER ?? "").toLowerCase();
const DOJAH_APP_ID = process.env.DOJAH_APP_ID ?? "";
const DOJAH_SECRET_KEY = process.env.DOJAH_SECRET_KEY ?? "";
const DOJAH_BASE_URL = (process.env.DOJAH_BASE_URL ?? "https://api.dojah.io").replace(/\/$/, "");

function backendLive(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export interface KycInput {
  email: string;
  fullName?: string;
  phone?: string;
  /** "bvn" (default) or "vnin" — the kind of number the seller submitted. */
  idType?: "bvn" | "vnin";
  /** The BVN or vNIN. Used only to verify, never persisted. */
  idNumber?: string;
}

/**
 * Verify a seller's identity. Returns whether they are genuinely verified —
 * never a blanket true just because a form was submitted. Fails closed: any
 * error, misconfiguration, or name mismatch returns false.
 */
export async function verifySellerIdentity(input: KycInput): Promise<boolean> {
  // Sandbox: no real identities to check, so keep the flow demoable.
  if (!backendLive()) return true;

  // Live: verification requires the Dojah provider + credentials + a name and id.
  if (KYC_PROVIDER !== "dojah" || !DOJAH_APP_ID || !DOJAH_SECRET_KEY) return false;
  const id = (input.idNumber ?? "").trim();
  const name = (input.fullName ?? "").trim();
  if (!id || !name) return false;

  try {
    return await dojahVerify(input.idType === "vnin" ? "vnin" : "bvn", id, name);
  } catch {
    return false; // never mark verified on a network/parse error
  }
}

/** Look the id up with Dojah and confirm the registered name matches. */
async function dojahVerify(type: "bvn" | "vnin", id: string, fullName: string): Promise<boolean> {
  const path = type === "vnin" ? `/api/v1/kyc/vnin?vnin=${encodeURIComponent(id)}` : `/api/v1/kyc/bvn?bvn=${encodeURIComponent(id)}`;
  const res = await fetch(`${DOJAH_BASE_URL}${path}`, {
    headers: { AppId: DOJAH_APP_ID, Authorization: DOJAH_SECRET_KEY },
  });
  if (!res.ok) return false;

  const body = (await res.json().catch(() => null)) as { entity?: Record<string, unknown> } | null;
  const e = body?.entity;
  if (!e) return false;

  // BVN returns first_name/last_name; vNIN returns firstname/surname.
  const first = String(e.first_name ?? e.firstname ?? "");
  const last = String(e.last_name ?? e.surname ?? "");
  return nameMatches(fullName, first, last);
}

/** The government-registered first AND last name must both appear in the name
    the seller entered (order-insensitive, punctuation/case-insensitive). */
function nameMatches(fullName: string, first: string, last: string): boolean {
  const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
  const submitted = new Set(fullName.split(/\s+/).map(norm).filter(Boolean));
  const f = norm(first);
  const l = norm(last);
  if (!f || !l) return false;
  return submitted.has(f) && submitted.has(l);
}
