/* ==========================================================================
   Idempotency — process a money event exactly once.

   Payment webhooks are re-delivered (the provider retries until it gets a 200),
   and payout/refund calls can be retried on a timeout. Without a guard, the
   same charge could fund a deal twice or the same release could pay a seller
   twice. This keeps a record of event ids we have already acted on and refuses
   the second attempt.

   The store is chosen by config, like the rest of the backend. When Supabase is
   set, the durable `processed_events` store (supabase-idempotency.ts) is used
   automatically, so the guarantee holds across instances and restarts. With no
   Supabase, the in-memory store is the fallback, which is correct for a single
   instance and for demo/dev. `setStore` still lets a caller inject any adapter
   (e.g. a test double). The interface is deliberately tiny.
   ========================================================================== */

export interface IdempotencyStore {
  /** True the first time this key is seen (and records it); false if already seen. */
  claim(key: string): Promise<boolean>;
}

class MemoryStore implements IdempotencyStore {
  private seen = new Map<string, number>();
  private ttlMs: number;
  constructor(ttlMs = 7 * 24 * 60 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }
  async claim(key: string): Promise<boolean> {
    const now = Date.now();
    // Opportunistic cleanup so the map does not grow unbounded.
    if (this.seen.size > 5000) {
      for (const [k, t] of this.seen) if (now - t > this.ttlMs) this.seen.delete(k);
    }
    if (this.seen.has(key)) return false;
    this.seen.set(key, now);
    return true;
  }
}

let store: IdempotencyStore | null = null;
let resolving: Promise<IdempotencyStore> | null = null;

/**
 * Pick the store once: the durable Supabase store when it is configured,
 * otherwise the in-memory fallback. Resolved lazily (and memoised) so the
 * Supabase module — and its client — load only when actually used, and never
 * in the browser bundle.
 */
function resolveStore(): Promise<IdempotencyStore> {
  if (store) return Promise.resolve(store);
  if (!resolving) {
    resolving = (async () => {
      const mod = await import("./supabase-idempotency");
      store = mod.supabaseIdempotencyConfigured() ? mod.supabaseIdempotencyStore : new MemoryStore();
      return store;
    })();
  }
  return resolving;
}

/** Override the store with any adapter (e.g. a durable store or a test double). */
export function setStore(next: IdempotencyStore): void {
  store = next;
  resolving = Promise.resolve(next);
}

/**
 * Returns true the first time `key` is claimed, false on every repeat.
 * Callers act only when this returns true.
 */
export async function claimOnce(key: string): Promise<boolean> {
  return (await resolveStore()).claim(key);
}
