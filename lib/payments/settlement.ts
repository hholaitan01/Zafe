/* ==========================================================================
   Settlement operations — model a money-move (payout or refund) as a durable,
   single-winner operation, not a fire-and-forget call.

   Two layers already guard the money path: the provider de-duplicates on a
   deterministic reference, and the ledger de-duplicates on a deterministic
   `ref`. Neither stops the APPLICATION from starting the same transfer twice.
   Two concurrent releases of one deal both read "shipped", both pass their
   check, and both call the payout. On a provider with a deterministic reference
   that is caught downstream; on one without (or a mock retry after a crash) it
   is a double payout. This module closes that window.

   The claim key IS the ledger ref: "payout:<dealId>" / "refund:<dealId>" — one
   payout and one refund per deal. `begin` atomically decides who proceeds:
     - proceed        — this caller owns the attempt; perform the transfer.
     - succeeded      — a prior attempt already moved this money; short-circuit
                        with its ref and DO NOT transfer again.
     - in_flight      — another attempt holds a fresh claim; back off.
   `complete`/`fail` close the attempt. A failed attempt is retryable; a claim
   left "pending" past the stale window (a crashed process) is reclaimable, so a
   single crash can never freeze a deal's money forever.

   Durable via Supabase (`settlement_operations`, schema.sql) when configured,
   in-memory otherwise — the same seam, and the same lazy resolution, as the
   idempotency store. `setSettlementStore` injects a test double.
   ========================================================================== */

export type SettlementState = "pending" | "succeeded" | "failed";
export type SettlementKind = "payout" | "refund";

export interface SettlementRecord {
  key: string;
  dealId: string;
  kind: SettlementKind;
  state: SettlementState;
  ref?: string;
  error?: string;
  attempts: number;
  updatedAt: string; // ISO
}

/** The verdict `begin` returns to a caller about to move money. */
export type BeginResult =
  | { proceed: true }
  | { proceed: false; reason: "succeeded"; ref?: string }
  | { proceed: false; reason: "in_flight" };

export interface SettlementMeta {
  dealId: string;
  kind: SettlementKind;
}

export interface SettlementStore {
  begin(key: string, meta: SettlementMeta): Promise<BeginResult>;
  complete(key: string, ref: string): Promise<void>;
  fail(key: string, error: string): Promise<void>;
  get(key: string): Promise<SettlementRecord | null>;
}

/** A "pending" claim older than this is treated as abandoned (crashed mid-move)
    and may be reclaimed, so one crash cannot block a deal's money forever. */
export const STALE_PENDING_MS = 5 * 60 * 1000;

/** The ledger ref doubles as the settlement claim key: one per deal per kind. */
export function settlementKey(kind: SettlementKind, dealId: string): string {
  return `${kind}:${dealId}`;
}

/**
 * In-memory store. JS is single-threaded and no `await` sits between the read
 * and the write below, so the claim decision is atomic within one instance —
 * correct for demo/dev and a single server. Cross-instance durability needs the
 * Supabase store.
 */
class MemorySettlementStore implements SettlementStore {
  private ops = new Map<string, SettlementRecord>();

  async begin(key: string, meta: SettlementMeta): Promise<BeginResult> {
    const now = Date.now();
    const rec = this.ops.get(key);
    if (!rec) {
      this.ops.set(key, { key, dealId: meta.dealId, kind: meta.kind, state: "pending", attempts: 1, updatedAt: new Date(now).toISOString() });
      return { proceed: true };
    }
    if (rec.state === "succeeded") return { proceed: false, reason: "succeeded", ref: rec.ref };
    if (rec.state === "pending" && now - Date.parse(rec.updatedAt) < STALE_PENDING_MS) {
      return { proceed: false, reason: "in_flight" };
    }
    // failed, or a stale pending: this caller takes over the attempt.
    rec.state = "pending";
    rec.attempts += 1;
    rec.updatedAt = new Date(now).toISOString();
    rec.error = undefined;
    return { proceed: true };
  }

  async complete(key: string, ref: string): Promise<void> {
    const rec = this.ops.get(key);
    if (rec) {
      rec.state = "succeeded";
      rec.ref = ref;
      rec.error = undefined;
      rec.updatedAt = new Date().toISOString();
    }
  }

  async fail(key: string, error: string): Promise<void> {
    const rec = this.ops.get(key);
    if (rec) {
      rec.state = "failed";
      rec.error = error;
      rec.updatedAt = new Date().toISOString();
    }
  }

  async get(key: string): Promise<SettlementRecord | null> {
    return this.ops.get(key) ?? null;
  }

  _reset(): void {
    this.ops.clear();
  }
}

let store: SettlementStore | null = null;
let resolving: Promise<SettlementStore> | null = null;

/**
 * Pick the store once: the durable Supabase store when configured, else the
 * in-memory fallback. Resolved lazily and memoised so the Supabase module (and
 * its client) load only when used, and never in the browser bundle.
 */
function resolveStore(): Promise<SettlementStore> {
  if (store) return Promise.resolve(store);
  if (!resolving) {
    resolving = (async () => {
      const mod = await import("./supabase-settlement");
      store = mod.supabaseSettlementConfigured() ? mod.supabaseSettlementStore : new MemorySettlementStore();
      return store;
    })();
  }
  return resolving;
}

/** Override the store with any adapter (durable store or test double). */
export function setSettlementStore(next: SettlementStore): void {
  store = next;
  resolving = Promise.resolve(next);
}

/** Test-only: clear the in-memory store if that is the active one. */
export function _resetSettlements(): void {
  if (store instanceof MemorySettlementStore) store._reset();
}

/** Atomically decide whether this caller should perform the money-move. */
export async function beginSettlement(key: string, meta: SettlementMeta): Promise<BeginResult> {
  return (await resolveStore()).begin(key, meta);
}

/** Record that the money-move succeeded, with the provider/ledger ref. */
export async function completeSettlement(key: string, ref: string): Promise<void> {
  return (await resolveStore()).complete(key, ref);
}

/** Record that the money-move failed, leaving the claim retryable. */
export async function failSettlement(key: string, error: string): Promise<void> {
  return (await resolveStore()).fail(key, error);
}

/** Read the current state of a settlement operation (admin/verification). */
export async function getSettlement(key: string): Promise<SettlementRecord | null> {
  return (await resolveStore()).get(key);
}
