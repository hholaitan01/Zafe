/* ==========================================================================
   Waitlist store — pre-launch sign-ups with a referral queue.

   Same live/demo seam as the rest of Zafe: a Supabase `waitlist` table when the
   service key is set, an in-memory map otherwise. Keyed by normalised email, so
   a repeat sign-up is idempotent.

   Each sign-up gets a unique referral `code`. Sharing your code and getting
   people to join with it moves you up the line: the queue is ranked by referral
   count first, then by who joined earliest. "Place in line" is that rank.

   Server-only. Imports the service-role key; never pull into a client bundle.
   ========================================================================== */

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";

export interface WaitlistEntry {
  email: string; // caller must pass a validated, lower-cased email
  name?: string;
  source?: string;
  ref?: string; // the referrer's code, if they arrived via a share link
}

interface WaitlistRec {
  email: string;
  name?: string;
  source?: string;
  code: string;
  referredBy?: string;
  createdAt: string;
}

export interface Standing {
  code: string;
  position: number; // 1 = front of the line
  total: number;
  referrals: number;
}

function live(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

const g = globalThis as unknown as { __zafeWaitlist?: Map<string, WaitlistRec> };
function mem(): Map<string, WaitlistRec> {
  if (!g.__zafeWaitlist) g.__zafeWaitlist = new Map();
  return g.__zafeWaitlist;
}

/** A short, URL-safe referral code (8 hex chars). */
function genCode(): string {
  return randomBytes(4).toString("hex");
}

function rowToRec(r: Record<string, unknown>): WaitlistRec {
  return {
    email: String(r.email),
    name: (r.name as string) ?? undefined,
    source: (r.source as string) ?? undefined,
    code: String(r.code ?? ""),
    referredBy: (r.referred_by as string) ?? undefined,
    createdAt: String(r.created_at),
  };
}

async function allRows(): Promise<WaitlistRec[]> {
  if (!live()) return [...mem().values()];
  const { data, error } = await db().from("waitlist").select("email,name,source,code,referred_by,created_at");
  if (error || !data) return [];
  return data.map(rowToRec);
}

/**
 * Add an email to the waitlist. Idempotent: a repeat email returns its existing
 * code and does not re-refer. Returns the sign-up's referral code.
 */
export async function addToWaitlist(entry: WaitlistEntry): Promise<{ ok: boolean; code?: string }> {
  const email = (entry.email || "").trim().toLowerCase();
  if (!email) return { ok: false };
  const name = entry.name?.trim() || undefined;
  const source = entry.source?.trim() || undefined;
  const ref = entry.ref?.trim() || undefined;

  if (!live()) {
    const existing = mem().get(email);
    if (existing) return { ok: true, code: existing.code };
    // A referrer code counts only if it belongs to someone already on the list.
    const validRef = ref && [...mem().values()].some((r) => r.code === ref) ? ref : undefined;
    const code = genCode();
    mem().set(email, { email, name, source, code, referredBy: validRef, createdAt: new Date().toISOString() });
    return { ok: true, code };
  }

  // Already on the list? Return the existing code, don't re-refer.
  {
    const { data } = await db().from("waitlist").select("code").eq("email", email).maybeSingle();
    if (data?.code) return { ok: true, code: String(data.code) };
  }

  // Validate the referrer code against a real sign-up.
  let validRef: string | undefined;
  if (ref) {
    const { data } = await db().from("waitlist").select("email").eq("code", ref).maybeSingle();
    if (data) validRef = ref;
  }

  // Insert with a unique code; retry a couple of times on the (very unlikely)
  // code collision. An email race falls back to reading the existing code.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = genCode();
    const { error } = await db()
      .from("waitlist")
      .insert({ email, name: name ?? null, source: source ?? null, code, referred_by: validRef ?? null });
    if (!error) return { ok: true, code };
    // Email already present (unique pk): return its code.
    const dup = await db().from("waitlist").select("code").eq("email", email).maybeSingle();
    if (dup.data?.code) return { ok: true, code: String(dup.data.code) };
    // Otherwise it was a code collision: loop and try a new code.
  }
  return { ok: false };
}

/** Rank the whole queue and return this email's standing (or null if absent). */
export async function getStanding(email: string): Promise<Standing | null> {
  const key = (email || "").trim().toLowerCase();
  if (!key) return null;
  const rows = await allRows();
  if (!rows.length) return null;

  const referrals = new Map<string, number>();
  for (const r of rows) if (r.referredBy) referrals.set(r.referredBy, (referrals.get(r.referredBy) ?? 0) + 1);

  rows.sort((a, b) => {
    const ra = referrals.get(a.code) ?? 0;
    const rb = referrals.get(b.code) ?? 0;
    if (rb !== ra) return rb - ra; // more referrals first
    return a.createdAt.localeCompare(b.createdAt); // then earliest joined
  });

  const idx = rows.findIndex((r) => r.email === key);
  if (idx < 0) return null;
  const me = rows[idx];
  return { code: me.code, position: idx + 1, total: rows.length, referrals: referrals.get(me.code) ?? 0 };
}

/** How many people have joined. Public social proof on the join page. */
export async function waitlistCount(): Promise<number> {
  if (!live()) return mem().size;
  const { count, error } = await db().from("waitlist").select("*", { count: "exact", head: true });
  return error ? 0 : count ?? 0;
}

export interface WaitlistRow {
  email: string;
  name?: string;
  source?: string;
  referrals: number;
  createdAt: string;
}

/** All sign-ups, newest first, with each one's referral count. Admin-only:
    only ever called from the admin route, which gates on isAdmin(). */
export async function listWaitlist(): Promise<WaitlistRow[]> {
  const rows = await allRows();
  const referrals = new Map<string, number>();
  for (const r of rows) if (r.referredBy) referrals.set(r.referredBy, (referrals.get(r.referredBy) ?? 0) + 1);
  return rows
    .map((r) => ({ email: r.email, name: r.name, source: r.source, referrals: referrals.get(r.code) ?? 0, createdAt: r.createdAt }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
