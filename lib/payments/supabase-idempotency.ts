/* ==========================================================================
   Supabase-backed idempotency store (durable, shared across instances).

   Backs the exactly-once guard with the `processed_events` table (schema.sql)
   instead of process memory, so the guarantee survives restarts and holds when
   more than one instance is serving webhooks. The claim is a single INSERT: the
   table's PRIMARY KEY on event_id is the lock, so concurrent re-deliveries race
   on that insert rather than on anything in application code.

   Activates automatically when Supabase is configured (same keys as the deal
   store); otherwise the in-memory store stays the default. Runs server-only via
   the service-role key, so it is never shipped to the browser.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IdempotencyStore } from "./idempotency";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** True when the durable store can run (Supabase URL + service-role key set). */
export function supabaseIdempotencyConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

// Postgres unique_violation. PostgREST surfaces it as this code, which is how we
// tell "already processed" apart from a real database error.
const UNIQUE_VIOLATION = "23505";

export const supabaseIdempotencyStore: IdempotencyStore = {
  async claim(key: string): Promise<boolean> {
    const { error } = await db().from("processed_events").insert({ event_id: key });
    if (!error) return true; // inserted for the first time: the caller acts.
    if (error.code === UNIQUE_VIOLATION) return false; // already recorded: skip.
    // Any other error (network, table missing, auth) is NOT a duplicate. Throw
    // so the webhook returns non-200 and the provider retries later, rather than
    // silently skipping a real event or acting on an unconfirmed one.
    throw new Error(`processed_events claim failed: ${error.message}`);
  },
};
