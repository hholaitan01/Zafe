/* ==========================================================================
   Payout-change OTP store — the one-time code that confirms a payout-account
   change (audit #19).

   A change to the payout account issues a 6-digit code, delivered by email
   (notify/email.ts). The code is stored HASHED, tied to the seller's email AND
   the fingerprint of the new account, single-use, and short-lived. Verifying
   requires the same email + the same new account, so a code can't be replayed
   against a different account.

   Same live/demo seam as the rest: a Supabase `payout_change_otps` table when
   configured, an in-memory map otherwise. Server-only (service-role key).
   ========================================================================== */

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";
import { normalizeContact } from "@/lib/deals/helpers";

const TTL_MS = 10 * 60 * 1000; // 10 minutes

function live(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}
let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

interface OtpRecord {
  codeHash: string;
  fingerprint: string;
  expiresAt: number; // epoch ms
  attempts: number; // wrong tries so far; the code self-invalidates past the cap
}

/** Wrong tries before a code is burned, so it can't be brute-forced (audit #12). */
const MAX_ATTEMPTS = 5;

// Demo store: one active code per email.
const g = globalThis as unknown as { __zafePayoutOtps?: Map<string, OtpRecord> };
function mem(): Map<string, OtpRecord> {
  if (!g.__zafePayoutOtps) g.__zafePayoutOtps = new Map();
  return g.__zafePayoutOtps;
}

function hash(code: string, email: string): string {
  // Salt with the email so identical codes for different users don't collide.
  return createHash("sha256").update(`${email}:${code}`).digest("hex");
}
function sixDigits(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Issue a code for this email + new-account fingerprint, replacing any prior
 * one. Returns the plaintext code for the mailer to deliver — it is never
 * persisted or returned to the browser in live mode.
 */
export async function createPayoutOtp(email: string, fingerprint: string): Promise<string> {
  const key = normalizeContact(email);
  const code = sixDigits();
  const rec: OtpRecord = { codeHash: hash(code, key), fingerprint, expiresAt: Date.now() + TTL_MS, attempts: 0 };
  if (!live()) {
    mem().set(key, rec);
    return code;
  }
  await db().from("payout_change_otps").upsert(
    { email: key, code_hash: rec.codeHash, fingerprint, expires_at: new Date(rec.expiresAt).toISOString(), attempts: 0 },
    { onConflict: "email" },
  );
  return code;
}

/**
 * Verify a code against this email + new-account fingerprint. Consumes the code
 * on success (single-use). False on a wrong code, an expired code, or a code
 * issued for a different account.
 */
export async function verifyPayoutOtp(email: string, fingerprint: string, code: string): Promise<boolean> {
  const key = normalizeContact(email);
  const want = hash(code.trim(), key);

  if (!live()) {
    const rec = mem().get(key);
    if (!rec || rec.expiresAt < Date.now() || rec.fingerprint !== fingerprint) return false;
    if (safeEqualHex(rec.codeHash, want)) {
      mem().delete(key); // single-use
      return true;
    }
    // Wrong code: count it and burn the code once the cap is hit.
    rec.attempts += 1;
    if (rec.attempts >= MAX_ATTEMPTS) mem().delete(key);
    return false;
  }

  const { data } = await db().from("payout_change_otps").select("*").eq("email", key).maybeSingle();
  if (!data) return false;
  const expired = Date.parse(String(data.expires_at)) < Date.now();
  if (expired || data.fingerprint !== fingerprint) return false;
  if (safeEqualHex(String(data.code_hash), want)) {
    await db().from("payout_change_otps").delete().eq("email", key); // single-use
    return true;
  }
  const attempts = Number(data.attempts ?? 0) + 1;
  if (attempts >= MAX_ATTEMPTS) await db().from("payout_change_otps").delete().eq("email", key);
  else await db().from("payout_change_otps").update({ attempts }).eq("email", key);
  return false;
}

/** Test-only: clear the in-memory demo store. */
export function _resetPayoutOtps(): void {
  mem().clear();
}
