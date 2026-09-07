/* ==========================================================================
   Builders for the escrow money-moves. Each returns a balanced entry (legs sum
   to zero) with a deterministic `ref`, so recording the same move twice is a
   no-op. Amounts are whole Naira.

   Fees are split (see lib/payments/fee.ts): the buyer's half is booked as
   revenue at funding, the seller's half at payout, and both are reversed on a
   refund. Each builder takes the principal plus the fee slice for that leg, so
   the accounts net out across a lifecycle: `buyer_funds` back to zero once a
   deal settles, `escrow` holding only the fee Zafe kept, `revenue` the fee.
   The fee arguments default to 0, so a fee-free move (or a dispute split, where
   no fee is kept) is just the two principal legs.
   ========================================================================== */

import { ACCOUNTS, type NewLedgerEntry } from "./types";

/**
 * Buyer's money lands in escrow. The buyer pays `principal + buyerFee`; we owe
 * the principal back out, and the buyer's fee half is booked as revenue.
 */
export function fundEntry(dealId: string, principal: number, buyerFee = 0): NewLedgerEntry {
  return {
    ref: `fund:${dealId}`,
    dealId,
    kind: "fund",
    legs: [
      { account: ACCOUNTS.escrow, amount: principal + buyerFee },
      { account: ACCOUNTS.buyerFunds, amount: -principal },
      { account: ACCOUNTS.revenue, amount: -buyerFee },
    ],
    memo: `Escrow funded: ₦${principal.toLocaleString("en-NG")}${buyerFee ? ` (+ ₦${buyerFee.toLocaleString("en-NG")} fee)` : ""}`,
  };
}

/**
 * Release the principal to the seller, minus the seller's fee half. Cash out of
 * escrow is `principal - sellerFee`; the principal liability clears; the
 * seller's fee half is booked as revenue.
 */
export function payoutEntry(dealId: string, principal: number, sellerFee = 0): NewLedgerEntry {
  const cashOut = principal - sellerFee;
  return {
    ref: `payout:${dealId}`,
    dealId,
    kind: "payout",
    legs: [
      { account: ACCOUNTS.escrow, amount: -cashOut },
      { account: ACCOUNTS.buyerFunds, amount: principal },
      { account: ACCOUNTS.revenue, amount: -sellerFee },
    ],
    memo: sellerFee > 0
      ? `Payout to seller: ₦${cashOut.toLocaleString("en-NG")} (fee ₦${sellerFee.toLocaleString("en-NG")})`
      : `Payout to seller: ₦${cashOut.toLocaleString("en-NG")}`,
  };
}

/**
 * Return money to the buyer. Cash out of escrow is `principal + buyerFeeReversed`
 * (the principal refunded plus any of the buyer's fee we are giving back); the
 * principal liability clears, and the reversed fee un-books that revenue. Zafe
 * keeps no fee on a refund.
 */
export function refundEntry(dealId: string, principal: number, buyerFeeReversed = 0): NewLedgerEntry {
  const cashOut = principal + buyerFeeReversed;
  return {
    ref: `refund:${dealId}`,
    dealId,
    kind: "refund",
    legs: [
      { account: ACCOUNTS.escrow, amount: -cashOut },
      { account: ACCOUNTS.buyerFunds, amount: principal },
      { account: ACCOUNTS.revenue, amount: buyerFeeReversed },
    ],
    memo: `Refund to buyer: ₦${cashOut.toLocaleString("en-NG")}`,
  };
}
