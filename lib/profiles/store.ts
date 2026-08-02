/* ==========================================================================
   User profiles — name parts (First / Other / Last), an optional username, and
   a profile photo. Persisted so they follow the user across devices.

   Same live/demo seam as deals and sellers: a Supabase `profiles` table when
   the service key is set, an in-memory map otherwise. Keyed by normalised email.
   Username is a second lookup key so people can be found by @username too.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";
import { normalizeContact } from "@/lib/deals/helpers";

export interface ProfileRecord {
  email: string;
  firstName?: string;
  otherNames?: string;
  lastName?: string;
  username?: string; // normalised (lower-case, no @)
  photo?: string; // small data: URL
  updatedAt: string;
}

/** Normalise a username: strip a leading @, lower-case, keep [a-z0-9_.]. */
export function normalizeUsername(u: string): string {
  return (u || "").trim().replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_.]/g, "");
}

function live(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

const g = globalThis as unknown as { __trustflowProfiles?: Map<string, ProfileRecord> };
function mem(): Map<string, ProfileRecord> {
  if (!g.__trustflowProfiles) g.__trustflowProfiles = new Map();
  return g.__trustflowProfiles;
}

function fromRow(row: Record<string, unknown>): ProfileRecord {
  return {
    email: String(row.email),
    firstName: (row.first_name as string) ?? undefined,
    otherNames: (row.other_names as string) ?? undefined,
    lastName: (row.last_name as string) ?? undefined,
    username: (row.username as string) ?? undefined,
    photo: (row.photo as string) ?? undefined,
    updatedAt: String(row.updated_at),
  };
}

export async function getProfile(email: string): Promise<ProfileRecord | null> {
  const key = normalizeContact(email);
  if (!key) return null;
  if (!live()) return mem().get(key) ?? null;
  const { data, error } = await db().from("profiles").select("*").eq("email", key).maybeSingle();
  if (error) return null;
  return data ? fromRow(data) : null;
}

/** Resolve a contact a user typed (email / phone / @username) to a canonical
    identity: a matched username becomes that user's email; email/phone pass
    through unchanged. Lets people find each other by @username too. */
export async function resolveContact(contact: string): Promise<string> {
  const c = (contact || "").trim();
  if (!c) return c;
  const looksLikeUsername = c.startsWith("@") || (!c.includes("@") && /[a-z]/i.test(c));
  if (looksLikeUsername) {
    const p = await getProfileByUsername(c);
    if (p?.email) return p.email;
  }
  return c; // an email, a phone, or an unknown handle — keep as-is
}

/** Resolve a username to the owning profile (for @username lookup). */
export async function getProfileByUsername(username: string): Promise<ProfileRecord | null> {
  const u = normalizeUsername(username);
  if (!u) return null;
  if (!live()) {
    for (const p of mem().values()) if (p.username === u) return p;
    return null;
  }
  const { data, error } = await db().from("profiles").select("*").eq("username", u).maybeSingle();
  if (error) return null;
  return data ? fromRow(data) : null;
}

export async function upsertProfile(rec: ProfileRecord): Promise<ProfileRecord> {
  const record: ProfileRecord = { ...rec, email: normalizeContact(rec.email), updatedAt: new Date().toISOString() };
  if (!record.email) throw new Error("A user email is required.");
  if (!live()) {
    mem().set(record.email, record);
    return record;
  }
  const { data, error } = await db()
    .from("profiles")
    .upsert(
      {
        email: record.email,
        first_name: record.firstName ?? null,
        other_names: record.otherNames ?? null,
        last_name: record.lastName ?? null,
        username: record.username ?? null,
        photo: record.photo ?? null,
        updated_at: record.updatedAt,
      },
      { onConflict: "email" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}
