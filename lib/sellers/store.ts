/* ==========================================================================
   Seller accounts — a trader's verification + payout account, persisted so it
   survives across devices and can be read server-side at payout time.

   Same live/demo seam as deals: a Supabase `sellers` table when the service key
   is set, an in-memory map otherwise. Keyed by the seller's normalised email.
   This replaces the browser-only seller profile — the payout account now lives
   server-side, so shipping a deal resolves the seller's account here rather than
   trusting whatever the client sends.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";
import { normalizeContact } from "@/lib/deals/helpers";

export interface SellerPayout {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface SellerRecord {
  email: string;
  fullName?: string;
  phone?: string;
  idVerified: boolean;
  payout?: SellerPayout;
  updatedAt: string;
}

function live(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

// Demo store: one map across module reloads / route calls in a server instance.
const g = globalThis as unknown as { __trustflowSellers?: Map<string, SellerRecord> };
function mem(): Map<string, SellerRecord> {
  if (!g.__trustflowSellers) g.__trustflowSellers = new Map();
  return g.__trustflowSellers;
}

function fromRow(row: Record<string, unknown>): SellerRecord {
  return {
    email: String(row.email),
    fullName: (row.full_name as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    idVerified: Boolean(row.id_verified),
    payout: (row.payout as SellerPayout) ?? undefined,
    updatedAt: String(row.updated_at),
  };
}

export async function getSeller(email: string): Promise<SellerRecord | null> {
  const key = normalizeContact(email);
  if (!key) return null;
  if (!live()) return mem().get(key) ?? null;
  const { data, error } = await db().from("sellers").select("*").eq("email", key).maybeSingle();
  if (error) return null; // best-effort: never break the flow on a read
  return data ? fromRow(data) : null;
}

export async function upsertSeller(rec: SellerRecord): Promise<SellerRecord> {
  const record: SellerRecord = { ...rec, email: normalizeContact(rec.email), updatedAt: new Date().toISOString() };
  if (!record.email) throw new Error("A seller email is required.");
  if (!live()) {
    mem().set(record.email, record);
    return record;
  }
  const { data, error } = await db()
    .from("sellers")
    .upsert(
      { email: record.email, full_name: record.fullName ?? null, phone: record.phone ?? null, id_verified: record.idVerified, payout: record.payout ?? null, updated_at: record.updatedAt },
      { onConflict: "email" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}
