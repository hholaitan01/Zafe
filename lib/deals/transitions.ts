/* ==========================================================================
   Deal lifecycle — the allowed status transitions (audit P0 #3/#4).

   A deal's status must only move along valid edges. Without this, a client (via
   PATCH) or a replayed webhook could push a deal backward, skip states, or —
   worst of all — fund a deal that has already settled, moving money against a
   completed/refunded/resolved deal. This is the single source of truth for what
   moves are legal; both the PATCH route and the status setter enforce it.

   The settled states (completed, refunded, resolved) are TERMINAL: no outgoing
   transition, so nothing can re-fund or re-open them. Re-asserting the same
   status is always allowed (an idempotent no-op, e.g. a re-delivered funding
   webhook), so callers can be naive without corrupting state.
   ========================================================================== */

import type { DealStatus } from "./types";

/** Allowed forward transitions per status. Terminal states have none. */
const ALLOWED: Record<DealStatus, readonly DealStatus[]> = {
  created: ["funded"],
  funded: ["shipped", "disputed", "completed", "refunded", "resolved"],
  shipped: ["completed", "disputed", "refunded", "resolved"],
  disputed: ["under_review", "completed", "refunded", "resolved"],
  under_review: ["completed", "refunded", "resolved"],
  completed: [], // terminal
  refunded: [], // terminal
  resolved: [], // terminal
};

/** True when a deal may move from `from` to `to`. Same-state is an idempotent no-op. */
export function canTransition(from: DealStatus, to: DealStatus): boolean {
  if (from === to) return true;
  return (ALLOWED[from] ?? []).includes(to);
}

/** True when a status is settled — money has finished moving and it cannot re-fund. */
export function isTerminal(status: DealStatus): boolean {
  return ALLOWED[status]?.length === 0 && (status === "completed" || status === "refunded" || status === "resolved");
}
