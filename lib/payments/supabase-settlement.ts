/* ==========================================================================
   Supabase-backed settlement store (durable, shared across instances).

   Backs the settlement-operation claim with the `settlement_operations` table
   (schema.sql) so the single-winner guarantee holds across restarts and when
   more than one instance serves the money path.

   The claim is a compare-and-swap:
     - A first claim is a single INSERT; the PRIMARY KEY on `key` is the lock, so
       concurrent first attempts race on the insert and exactly one wins.
     - Reclaiming a failed (or stale-pending) operation is a conditional UPDATE
       gated on the row's current `(state, updated_at)`. Two callers that both
       read "failed" both try the update; the first flips the row and the
       second matches zero rows, so again exactly one wins.

   Activates automatically when Supabase is configured (same keys as the deal
   and idempotency stores); runs server-only via the service-role key.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BeginResult, SettlementMeta, SettlementRecord, SettlementStore, SettlementState } from "./settlement";
import { STALE_PENDING_MS } from "./settlement";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const UNIQUE_VIOLATION = "23505";

export function supabaseSettlementConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

function fromRow(row: Record<string, unknown>): SettlementRecord {
  return {
    key: String(row.key),
    dealId: String(row.deal_id),
    kind: row.kind as SettlementRecord["kind"],
    state: row.state as SettlementState,
    ref: (row.ref as string) ?? undefined,
    error: (row.error as string) ?? undefined,
    attempts: Number(row.attempts ?? 0),
    updatedAt: String(row.updated_at),
  };
}

async function read(key: string): Promise<SettlementRecord | null> {
  const { data, error } = await db().from("settlement_operations").select("*").eq("key", key).maybeSingle();
  if (error) throw new Error(`settlement read failed: ${error.message}`);
  return data ? fromRow(data) : null;
}

export const supabaseSettlementStore: SettlementStore = {
  async begin(key: string, meta: SettlementMeta): Promise<BeginResult> {
    const nowIso = new Date().toISOString();
    // First attempt: a plain insert. The PK makes concurrent firsts race here.
    const { error } = await db().from("settlement_operations").insert({
      key,
      deal_id: meta.dealId,
      kind: meta.kind,
      state: "pending",
      attempts: 1,
      created_at: nowIso,
      updated_at: nowIso,
    });
    if (!error) return { proceed: true };
    if (error.code !== UNIQUE_VIOLATION) throw new Error(`settlement claim failed: ${error.message}`);

    // Row exists. Decide against its current state, retrying the compare-and-swap
    // a bounded number of times if we lose a race.
    for (let attempt = 0; attempt < 3; attempt++) {
      const rec = await read(key);
      if (!rec) return { proceed: false, reason: "in_flight" }; // deleted under us; back off
      if (rec.state === "succeeded") return { proceed: false, reason: "succeeded", ref: rec.ref };
      const stale = Date.now() - Date.parse(rec.updatedAt) >= STALE_PENDING_MS;
      if (rec.state === "pending" && !stale) return { proceed: false, reason: "in_flight" };

      // failed, or a stale pending → try to claim it via compare-and-swap on
      // (state, updated_at). Only one concurrent reclaimer can win.
      const { data, error: upErr } = await db()
        .from("settlement_operations")
        .update({ state: "pending", attempts: rec.attempts + 1, error: null, updated_at: new Date().toISOString() })
        .eq("key", key)
        .eq("state", rec.state)
        .eq("updated_at", rec.updatedAt)
        .select();
      if (upErr) throw new Error(`settlement reclaim failed: ${upErr.message}`);
      if (data && data.length === 1) return { proceed: true };
      // Lost the race; the row moved. Loop re-reads and re-decides.
    }
    return { proceed: false, reason: "in_flight" };
  },

  async complete(key: string, ref: string): Promise<void> {
    const { error } = await db()
      .from("settlement_operations")
      .update({ state: "succeeded", ref, error: null, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw new Error(`settlement complete failed: ${error.message}`);
  },

  async fail(key: string, err: string): Promise<void> {
    const { error } = await db()
      .from("settlement_operations")
      .update({ state: "failed", error: err.slice(0, 500), updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw new Error(`settlement fail failed: ${error.message}`);
  },

  async get(key: string): Promise<SettlementRecord | null> {
    return read(key);
  },
};
