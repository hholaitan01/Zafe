/* ==========================================================================
   Waitlist store — pre-launch email sign-ups.

   Same live/demo seam as the rest of Zafe: a Supabase `waitlist` table when the
   service key is set, an in-memory map otherwise. Keyed by normalised email, so
   a repeat sign-up is idempotent (a no-op, never an error).

   Server-only. This imports the service-role key and must never be pulled into
   a client bundle. Only the /api/waitlist route touches it.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";

export interface WaitlistEntry {
  email: string; // caller must pass a validated, lower-cased email
  name?: string;
  source?: string;
}

function live(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

const g = globalThis as unknown as { __zafeWaitlist?: Map<string, WaitlistEntry & { createdAt: string }> };
function mem(): Map<string, WaitlistEntry & { createdAt: string }> {
  if (!g.__zafeWaitlist) g.__zafeWaitlist = new Map();
  return g.__zafeWaitlist;
}

/** Add an email to the waitlist. Idempotent: a repeat email is a no-op. */
export async function addToWaitlist(entry: WaitlistEntry): Promise<{ ok: boolean }> {
  const email = (entry.email || "").trim().toLowerCase();
  if (!email) return { ok: false };
  const name = entry.name?.trim() || undefined;
  const source = entry.source?.trim() || undefined;

  if (!live()) {
    if (!mem().has(email)) mem().set(email, { email, name, source, createdAt: new Date().toISOString() });
    return { ok: true };
  }

  // ignoreDuplicates: a repeat email conflicts on the primary key and is skipped
  // silently, so we never surface whether an address was already registered.
  const { error } = await db()
    .from("waitlist")
    .upsert({ email, name: name ?? null, source: source ?? null }, { onConflict: "email", ignoreDuplicates: true });
  return { ok: !error };
}

/** How many people have joined. Used only for a rough on-page count. */
export async function waitlistCount(): Promise<number> {
  if (!live()) return mem().size;
  const { count, error } = await db().from("waitlist").select("*", { count: "exact", head: true });
  return error ? 0 : count ?? 0;
}

export interface WaitlistRow {
  email: string;
  name?: string;
  source?: string;
  createdAt: string;
}

/** All sign-ups, newest first. Admin-only: only ever called from the admin
    route, which gates on isAdmin() before invoking this. */
export async function listWaitlist(): Promise<WaitlistRow[]> {
  if (!live()) {
    return [...mem().values()]
      .map((v) => ({ email: v.email, name: v.name, source: v.source, createdAt: v.createdAt }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  const { data, error } = await db().from("waitlist").select("email,name,source,created_at").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    email: String(r.email),
    name: (r.name as string) ?? undefined,
    source: (r.source as string) ?? undefined,
    createdAt: String(r.created_at),
  }));
}
