/* ==========================================================================
   Idempotency — process a money event exactly once.

   Payment webhooks are re-delivered (the provider retries until it gets a 200),
   and payout/refund calls can be retried on a timeout. Without a guard, the
   same charge could fund a deal twice or the same release could pay a seller
   twice. This keeps a record of event ids we have already acted on and refuses
   the second attempt.

   The default store is in-memory, which is correct for a single instance and
   for demo/dev. In production behind multiple instances this MUST be backed by
   a shared, durable store (a `processed_events` table keyed by `event_id`, with
   a unique constraint) so the guarantee holds across instances and restarts —
   swap `setStore` for that adapter. The interface is deliberately tiny so the
   swap is a few lines.
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

let store: IdempotencyStore = new MemoryStore();

/** Swap in a durable, shared store in production (e.g. Supabase-backed). */
export function setStore(next: IdempotencyStore): void {
  store = next;
}

/**
 * Returns true the first time `key` is claimed, false on every repeat.
 * Callers act only when this returns true.
 */
export function claimOnce(key: string): Promise<boolean> {
  return store.claim(key);
}
