/* ==========================================================================
   Funding verification (audit P0 #2).

   A signature-checked "successful collection" webhook is not enough to fund the
   full escrow: we must also confirm the buyer actually paid the RIGHT money —
   the expected currency, and at least the amount the deal requires (principal +
   the buyer's fee half). Otherwise an underpayment (or a wrong-currency charge)
   could release the full escrow amount to the seller.

   Pure function so it is trivially testable and shared by every provider webhook.
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";
import { collectionAmount } from "./fee";

export interface CollectedPayment {
  amountNaira?: number; // what the provider reports was collected, in whole Naira
  currency?: string; // the provider's currency code
}

export interface FundingCheck {
  ok: boolean;
  reason?: string;
  expectedNaira?: number;
}

/**
 * Whether a collection may fund this deal: the currency must match and the
 * collected amount must be at least the required collection amount. Fails closed
 * on missing/unparseable values.
 */
export function verifyFunding(deal: Deal, collected: CollectedPayment): FundingCheck {
  const expectedNaira = collectionAmount(deal.item.amount);
  const want = (deal.item.currency ?? "NGN").toUpperCase();
  const got = (collected.currency ?? "").toUpperCase();
  if (!got || got !== want) {
    return { ok: false, reason: `currency mismatch (got ${got || "none"}, expected ${want})`, expectedNaira };
  }
  const amount = typeof collected.amountNaira === "number" ? collected.amountNaira : NaN;
  if (!(amount >= expectedNaira)) {
    return { ok: false, reason: `amount too low (got ${Number.isFinite(amount) ? amount : "none"}, need ${expectedNaira})`, expectedNaira };
  }
  return { ok: true, expectedNaira };
}
