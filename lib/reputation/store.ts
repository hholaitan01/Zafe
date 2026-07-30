/* ==========================================================================
   The reputation service the API route uses.

   Reputation is derived — the deals table is the single source of truth — so we
   always recompute it fresh on read (never stale), then write a snapshot to the
   `reputations` table so a trader's standing can be read back cheaply and shown
   to a counterparty. Persistence is best-effort: if the table isn't there yet
   (schema.sql not run) or Supabase is offline, we still return the computed
   reputation. Same "never blocked on backend" philosophy as the rest of H2O's
   backend.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";
import { listDealsForUser } from "@/lib/deals/store";
import { scoreReputation } from "./engine";
import { reputationSummary } from "./insight";
import type { Reputation } from "./types";

let client: SupabaseClient | null = null;
function db(): SupabaseClient | null {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return null;
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

/** Compute (and persist a snapshot of) a trader's current reputation. */
export async function getReputation(email: string, name?: string): Promise<Reputation> {
  const deals = await listDealsForUser(email);
  const rep = scoreReputation(email, deals);
  rep.summary = await reputationSummary(rep);
  await persist(rep, name);
  return rep;
}

/** Best-effort snapshot write. Never throws — persistence is a nice-to-have. */
async function persist(rep: Reputation, name?: string): Promise<void> {
  const supabase = db();
  if (!supabase) return;
  try {
    await supabase.from("reputations").upsert(
      {
        email: rep.email,
        name: name ?? null,
        score: rep.score,
        tier: rep.tier,
        factors: rep.factors,
        stats: rep.stats,
        summary: rep.summary ?? null,
        updated_at: rep.updatedAt,
      },
      { onConflict: "email" },
    );
  } catch {
    /* table missing or offline — the computed reputation is still returned */
  }
}
