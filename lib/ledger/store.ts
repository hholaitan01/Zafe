/* ==========================================================================
   Ledger store — the same live/demo seam as the rest of the backend.

   - LIVE  — a real `ledger_entries` table when Supabase is configured (schema.sql).
   - DEMO  — an in-memory list, so the escrow flow and reconciliation work on
             stage with no database.

   Recording is idempotent on the entry `ref`: the table's PRIMARY KEY (live) or
   a Map key (demo) means the same money-move recorded twice is a no-op, so a
   retried webhook or payout never double-posts.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ACCOUNTS, isBalanced, type AccountId, type LedgerEntry, type NewLedgerEntry } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const UNIQUE_VIOLATION = "23505";

export function ledgerLive(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

// Demo backend: entries kept in insertion order, keyed by ref for idempotency.
const memory = new Map<string, LedgerEntry>();

export interface RecordResult {
  recorded: boolean; // false when this ref was already present (a no-op)
  entry: LedgerEntry;
}

/** Sum the legs of a set of entries into per-account balances. */
export function balancesOf(entries: LedgerEntry[]): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const e of entries) for (const leg of e.legs) bal[leg.account] = (bal[leg.account] ?? 0) + leg.amount;
  return bal;
}

/**
 * Record one entry. Rejects an unbalanced entry outright (a programming error).
 * Idempotent on `ref`. Throws only on an unexpected store failure; callers on
 * the money path use `recordSafe` so a ledger hiccup never blocks a transfer.
 */
export async function record(entry: NewLedgerEntry): Promise<RecordResult> {
  if (!isBalanced(entry.legs)) {
    throw new Error(`ledger: entry ${entry.ref} legs do not sum to zero`);
  }
  const full: LedgerEntry = { ...entry, createdAt: new Date().toISOString() };

  if (!ledgerLive()) {
    if (memory.has(entry.ref)) return { recorded: false, entry: memory.get(entry.ref)! };
    memory.set(entry.ref, full);
    return { recorded: true, entry: full };
  }

  const { error } = await db().from("ledger_entries").insert({
    ref: full.ref,
    deal_id: full.dealId,
    kind: full.kind,
    legs: full.legs,
    memo: full.memo ?? null,
    created_at: full.createdAt,
  });
  if (!error) return { recorded: true, entry: full };
  if (error.code === UNIQUE_VIOLATION) return { recorded: false, entry: full };
  throw new Error(`ledger insert failed: ${error.message}`);
}

/**
 * Record on the money path without ever throwing. The provider is the source of
 * truth for the transfer; a failed ledger write is logged and swallowed so it
 * cannot fail a payout or refund. A missed entry is recoverable — the deal row
 * still carries the amounts — and a retry re-posts under the same idempotent ref.
 */
export async function recordSafe(entry: NewLedgerEntry): Promise<void> {
  try {
    await record(entry);
  } catch (e) {
    console.warn(`ledger: failed to record ${entry.ref}: ${(e as Error).message}`);
  }
}

/** All entries for one deal, oldest first. */
export async function entriesForDeal(dealId: string): Promise<LedgerEntry[]> {
  if (!ledgerLive()) {
    return [...memory.values()].filter((e) => e.dealId === dealId);
  }
  const { data, error } = await db()
    .from("ledger_entries")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/**
 * The trial balance: every account's balance across all entries. Because each
 * entry sums to zero, a healthy ledger's balances themselves sum to zero. Used
 * for reconciliation and the self-check — not a hot path.
 */
export async function trialBalance(): Promise<{ balances: Record<string, number>; balanced: boolean }> {
  const entries = ledgerLive() ? await allEntries() : [...memory.values()];
  const balances = balancesOf(entries);
  const total = Object.values(balances).reduce((s, v) => s + v, 0);
  return { balances, balanced: total === 0 };
}

/** Escrow cash currently held (the balance of the escrow account). */
export async function escrowHeld(): Promise<number> {
  const { balances } = await trialBalance();
  return balances[ACCOUNTS.escrow] ?? 0;
}

async function allEntries(): Promise<LedgerEntry[]> {
  const { data, error } = await db().from("ledger_entries").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

function fromRow(row: Record<string, unknown>): LedgerEntry {
  return {
    ref: String(row.ref),
    dealId: String(row.deal_id),
    kind: row.kind as LedgerEntry["kind"],
    legs: (row.legs as { account: AccountId; amount: number }[]) ?? [],
    memo: (row.memo as string) ?? undefined,
    createdAt: String(row.created_at),
  };
}

/** Test-only: clear the in-memory demo ledger. */
export function _resetMemory(): void {
  memory.clear();
}
