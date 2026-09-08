/* ==========================================================================
   Reconciliation cross-check — does Zafe's own ledger agree with the deals?

   The trial balance (store.ts) proves the ledger is internally consistent: all
   accounts sum to zero. This is the other half — it walks the deals against the
   ledger and flags DRIFT: a settled deal with no matching money-move recorded,
   or a deal that shows a move it should not have (a sign money was released
   twice, or down the wrong path). These are the discrepancies an operator
   reconciles, alongside the settlement exception queue.

   Pure functions: the caller supplies the deals and the ledger entries, so this
   has no store or network dependency and is trivially testable.
   ========================================================================== */

import type { Deal, DealStatus } from "@/lib/deals/types";
import type { LedgerEntry, LedgerKind } from "./types";

export type DiscrepancyCode =
  | "missing_fund" // money-bearing deal with no fund entry
  | "missing_payout" // completed deal with no payout entry
  | "missing_refund" // refunded/resolved deal with no refund entry
  | "unexpected_payout" // a refunded deal that also shows a payout (double-settle)
  | "unexpected_refund"; // a completed deal that also shows a refund

export interface DealDiscrepancy {
  dealId: string;
  status: DealStatus;
  code: DiscrepancyCode;
  detail: string;
}

/** Statuses that mean money entered escrow, so a `fund` entry is expected. */
const FUNDED_STATES: ReadonlySet<DealStatus> = new Set<DealStatus>([
  "funded",
  "shipped",
  "completed",
  "disputed",
  "under_review",
  "refunded",
  "resolved",
]);

/** Which ledger kinds exist for each deal. */
function kindsByDeal(entries: LedgerEntry[]): Map<string, Set<LedgerKind>> {
  const map = new Map<string, Set<LedgerKind>>();
  for (const e of entries) {
    const set = map.get(e.dealId) ?? new Set<LedgerKind>();
    set.add(e.kind);
    map.set(e.dealId, set);
  }
  return map;
}

/**
 * Cross-check deals against the ledger. Conservative by design: it only flags
 * drift it is sure about, so the queue is a real to-do list, not noise.
 */
export function reconcileDeals(deals: Deal[], entries: LedgerEntry[]): DealDiscrepancy[] {
  const byDeal = kindsByDeal(entries);
  const out: DealDiscrepancy[] = [];

  for (const deal of deals) {
    const kinds = byDeal.get(deal.id) ?? new Set<LedgerKind>();
    const has = (k: LedgerKind) => kinds.has(k);

    if (FUNDED_STATES.has(deal.status) && !has("fund")) {
      out.push({ dealId: deal.id, status: deal.status, code: "missing_fund", detail: "Deal has moved past funding but no fund entry is recorded." });
    }

    if (deal.status === "completed") {
      if (!has("payout")) out.push({ dealId: deal.id, status: deal.status, code: "missing_payout", detail: "Deal is completed but no payout entry is recorded." });
      if (has("refund")) out.push({ dealId: deal.id, status: deal.status, code: "unexpected_refund", detail: "Completed deal also shows a refund entry." });
    }

    if (deal.status === "refunded") {
      if (!has("refund")) out.push({ dealId: deal.id, status: deal.status, code: "missing_refund", detail: "Deal is refunded but no refund entry is recorded." });
      if (has("payout")) out.push({ dealId: deal.id, status: deal.status, code: "unexpected_payout", detail: "Refunded deal also shows a payout entry." });
    }

    // A split ("resolved") always returns the buyer's share, so a refund entry
    // is expected; the seller remainder may be zero, so a payout is not required.
    if (deal.status === "resolved" && !has("refund")) {
      out.push({ dealId: deal.id, status: deal.status, code: "missing_refund", detail: "Deal is resolved (split) but no refund entry is recorded." });
    }
  }

  return out;
}
