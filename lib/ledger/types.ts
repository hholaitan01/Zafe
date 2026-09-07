/* ==========================================================================
   Internal ledger — the double-entry record of every money move.

   The payment provider (ALAT / Paystack / Flutterwave) is the source of truth
   for whether cash actually moved. This ledger is Zafe's own independent record
   of it, so balances reconcile without asking the provider: what is held in
   escrow, what was paid out, what was refunded, and what Zafe earned.

   The model is deliberately tiny: every entry is a set of signed legs whose
   amounts SUM TO ZERO. A leg's `amount` (in whole Naira) is added to that
   account's running balance, so a positive leg is cash or an asset going up and
   a negative leg is it going down (or a liability we owe). Because every entry
   nets to zero, the sum of ALL account balances is always zero — that identity
   is what makes the books provable (see the trial balance in the store).
   ========================================================================== */

/** The chart of accounts. Kept small and fixed; per-deal tracing is the
    `dealId` on the entry, not a per-deal account. */
export const ACCOUNTS = {
  /** Cash Zafe is holding in the provider pool. Up on funding, down on payout/refund. */
  escrow: "escrow",
  /** What Zafe owes back out of held funds (a liability, so it carries a
      negative balance while money is held, and returns to zero once settled). */
  buyerFunds: "buyer_funds",
  /** Fees Zafe has earned (a credit balance, carried negative in this convention). */
  revenue: "revenue",
} as const;

export type AccountId = (typeof ACCOUNTS)[keyof typeof ACCOUNTS];

/** One side of an entry. `amount` is signed and added to the account's balance. */
export interface LedgerLeg {
  account: AccountId;
  amount: number; // whole Naira, signed; the legs of an entry sum to zero
}

export type LedgerKind = "fund" | "payout" | "refund";

export interface LedgerEntry {
  /** Deterministic per money-move (e.g. "fund:<dealId>"), so a retry is a no-op. */
  ref: string;
  dealId: string;
  kind: LedgerKind;
  legs: LedgerLeg[];
  memo?: string;
  createdAt: string; // ISO timestamp
}

/** An entry ready to record — everything but the timestamp the store stamps. */
export type NewLedgerEntry = Omit<LedgerEntry, "createdAt">;

/** True when the legs balance (sum to zero). The core double-entry invariant. */
export function isBalanced(legs: LedgerLeg[]): boolean {
  return legs.reduce((sum, l) => sum + l.amount, 0) === 0;
}
