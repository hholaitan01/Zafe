/* ==========================================================================
   Redact server-only secrets from a deal before it leaves the API.

   The handover code is the buyer's release credential: entering it is what
   authorises the seller's payout. Both the buyer AND the seller are parties to
   the deal, so returning the code on any deal response would hand the seller the
   very secret it exists to withhold from them (they could then release their own
   payout). It is verified server-side (releaseWithCode reads the stored value),
   so it never needs to reach a client — the buyer receives it out of band. Strip
   it from every deal that goes out in a response.
   ========================================================================== */

import type { Deal } from "./types";

/** A deal safe to return in an API response (no handover code). */
export function publicDeal<T extends Deal | null | undefined>(deal: T): T {
  if (!deal || deal.handoverCode === undefined) return deal;
  return { ...deal, handoverCode: undefined } as T;
}

export function publicDeals(deals: Deal[]): Deal[] {
  return deals.map((d) => ({ ...d, handoverCode: undefined }));
}
