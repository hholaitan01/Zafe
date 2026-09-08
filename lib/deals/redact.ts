/* ==========================================================================
   Redact server-only / sensitive fields from a deal before it leaves the API.

   Two classes of field never belong in a deal response:
   - The handover code — the buyer's release credential. Returning it on any deal
     response would hand the seller (also a party to the deal) the very secret it
     exists to withhold, letting them release their own payout. It is verified
     server-side (releaseWithCode reads the stored value); the buyer receives it
     out of band.
   - Payout / bank accounts (sellerPayout, buyerPayout) — the destination bank
     details for the seller's payout and the buyer's refund (audit #6). A trader
     manages their OWN account through the seller/settings flow; it should never
     be echoed back inside a deal, where the counterparty could read it.

   This is the public projection returned to a party to the deal. Money-move
   flows read the real fields from the store directly, so nothing here depends on
   these being present in the response.
   ========================================================================== */

import type { Deal, PayoutAccount } from "./types";

/** A display-only hint like "GTBank ****3344" — enough to recognise the payout
    destination on a receipt, without exposing the full account number. */
function maskPayout(p?: PayoutAccount): string | undefined {
  const acct = p?.accountNumber;
  if (!acct) return undefined;
  const bank = p.bankCode || "Bank";
  return `${bank} ****${acct.slice(-4)}`;
}

/** Strip the handover code and full bank accounts; attach a masked payout hint. */
function redact<T extends Deal>(deal: T): T {
  return {
    ...deal,
    handoverCode: undefined,
    sellerPayoutMask: deal.sellerPayoutMask ?? maskPayout(deal.sellerPayout),
    sellerPayout: undefined,
    buyerPayout: undefined,
  };
}

/** A deal safe to return in an API response (no handover code, no bank details). */
export function publicDeal<T extends Deal | null | undefined>(deal: T): T {
  if (!deal) return deal;
  return redact(deal as Deal) as T;
}

export function publicDeals(deals: Deal[]): Deal[] {
  return deals.map(redact);
}
