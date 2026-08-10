/* ==========================================================================
   Fraud watchlist — the anti-fraud signal adopted from Jerry's design
   (`isFlaggedPattern`), the one input neither the AI Trust Score nor the
   reputation model had.

   A seller is flagged two ways:
     1. Seed list — contacts reported for fraud (in production, a shared bank /
        platform fraud feed; here a small curated seed so the path is demoable).
     2. Derived from Zafe's own history — computed in the deal store from
        past deals with this seller (disputes resolved against them). That lives
        next to the deal data to avoid a circular import; this module owns the
        pure seed check.

   A flag is a HARD override on the per-deal Trust Score: even if the chat looks
   clean, a watchlisted seller is forced to "risky" so the buyer is warned (and
   must acknowledge the risk before paying).
   ========================================================================== */

import { normalizeContact } from "@/lib/deals/helpers";

export interface FraudFlag {
  flagged: boolean;
  reason?: string;
}

// Reported-fraud contacts (phone/email). Normalised on lookup, so formatting
// doesn't matter. Replace/extend from a real fraud feed in production.
const SEED_BLOCKLIST = new Map<string, string>([
  [normalizeContact("+234 000 000 0000"), "reported for non-delivery scams"],
  [normalizeContact("scammer@example.com"), "reported for fake-listing fraud"],
]);

/** Seed-list check only. History-derived flagging is combined in the deal store. */
export function isSeedFlagged(contact: string): FraudFlag {
  const reason = SEED_BLOCKLIST.get(normalizeContact(contact));
  return reason ? { flagged: true, reason } : { flagged: false };
}
