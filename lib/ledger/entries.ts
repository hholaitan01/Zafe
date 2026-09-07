/* ==========================================================================
   Builders for the escrow money-moves. Each returns a balanced entry (legs sum
   to zero) with a deterministic `ref`, so recording the same move twice is a
   no-op. Amounts are whole Naira.

   Convention (see types.ts): a leg's amount is added to the account's balance.
   Across a full lifecycle, `buyer_funds` returns to zero once the deal settles,
   `escrow` returns to zero (or holds the retained fee), and `revenue` carries
   the fees earned.
   ========================================================================== */

import { ACCOUNTS, type NewLedgerEntry } from "./types";

/** Buyer's money lands in escrow: escrow holds it, and we owe it back out. */
export function fundEntry(dealId: string, amount: number): NewLedgerEntry {
  return {
    ref: `fund:${dealId}`,
    dealId,
    kind: "fund",
    legs: [
      { account: ACCOUNTS.escrow, amount: amount },
      { account: ACCOUNTS.buyerFunds, amount: -amount },
    ],
    memo: `Escrow funded: ₦${amount.toLocaleString("en-NG")}`,
  };
}

/**
 * Settle a slice of escrow to the seller. `gross` is the portion of held funds
 * being settled; `fee` (default 0, until a fee model exists) is Zafe's cut kept
 * as revenue, so the seller receives `gross - fee` in cash out of escrow.
 */
export function payoutEntry(dealId: string, gross: number, fee = 0): NewLedgerEntry {
  const cashOut = gross - fee;
  return {
    ref: `payout:${dealId}`,
    dealId,
    kind: "payout",
    legs: [
      { account: ACCOUNTS.escrow, amount: -cashOut },
      { account: ACCOUNTS.buyerFunds, amount: gross },
      { account: ACCOUNTS.revenue, amount: -fee },
    ],
    memo: fee > 0
      ? `Payout to seller: ₦${cashOut.toLocaleString("en-NG")} (fee ₦${fee.toLocaleString("en-NG")})`
      : `Payout to seller: ₦${cashOut.toLocaleString("en-NG")}`,
  };
}

/** Return money to the buyer: cash leaves escrow, the liability clears. */
export function refundEntry(dealId: string, amount: number): NewLedgerEntry {
  return {
    ref: `refund:${dealId}`,
    dealId,
    kind: "refund",
    legs: [
      { account: ACCOUNTS.escrow, amount: -amount },
      { account: ACCOUNTS.buyerFunds, amount: amount },
    ],
    memo: `Refund to buyer: ₦${amount.toLocaleString("en-NG")}`,
  };
}
