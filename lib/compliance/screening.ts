/* ==========================================================================
   Sanctions / PEP screening — same live/demo seam as the rest of the stack.

   AML law requires screening customers against terrorism / sanctions lists and
   identifying politically-exposed persons. This module gives the app one place
   to do that, and is deliberately FAIL-CLOSED: if a real screen can't be run, a
   party is returned as "not clear" and pushed to manual review rather than
   waved through.

     • DEMO (no provider keys): screen the name against a small built-in test
       list and the seed fraud watchlist, so the flow is exercisable end-to-end.
     • LIVE (SCREENING_PROVIDER + key set): a real sanctions/PEP feed must be
       wired here. Until it is, live returns "needs review" — never a silent
       pass. This is scaffolding for the compliance programme, not a substitute
       for a licensed screening provider.
   ========================================================================== */

import { isSeedFlagged } from "@/lib/fraud";

export type HitCategory = "sanctions" | "pep" | "watchlist";

export interface ScreeningHit {
  list: string;
  category: HitCategory;
  detail: string;
}

export interface ScreeningResult {
  /** True only when a screen actually ran and found nothing. */
  clear: boolean;
  /** True when no real screen could be run and the party needs manual review. */
  needsReview: boolean;
  hits: ScreeningHit[];
  mode: "live" | "demo";
}

// A tiny demo list so the seam is testable with zero keys. NOT a real list.
const DEMO_SANCTIONS = ["test sanction", "blocked person", "ofac test", "specimen terrorist"];
const DEMO_PEP = ["test pep", "sample politician"];

function norm(s?: string): string {
  return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function providerConfigured(): boolean {
  return Boolean(process.env.SCREENING_PROVIDER && process.env.SCREENING_API_KEY);
}

/** Screen a party against sanctions / PEP / watchlist sources. */
export async function screenParty(input: { name?: string; contact?: string; idNumber?: string }): Promise<ScreeningResult> {
  const name = norm(input.name);

  if (providerConfigured()) {
    // A real screening provider must be integrated here (name + DOB / ID against
    // a maintained sanctions + PEP feed). Until that exists, do NOT pass silently
    // in live mode — push to manual review.
    return {
      clear: false,
      needsReview: true,
      hits: [{ list: "provider", category: "sanctions", detail: "Live screening provider not yet integrated — manual review required." }],
      mode: "live",
    };
  }

  // Demo screen: built-in test lists + the seed fraud watchlist by contact.
  const hits: ScreeningHit[] = [];
  if (name && DEMO_SANCTIONS.some((n) => name.includes(n))) hits.push({ list: "demo-sanctions", category: "sanctions", detail: `Name matched the demo sanctions list ("${input.name}").` });
  if (name && DEMO_PEP.some((n) => name.includes(n))) hits.push({ list: "demo-pep", category: "pep", detail: `Name matched the demo PEP list ("${input.name}").` });
  if (input.contact) {
    const f = isSeedFlagged(input.contact);
    if (f.flagged) hits.push({ list: "fraud-watchlist", category: "watchlist", detail: f.reason || "On the TrustFlow fraud watchlist." });
  }
  return { clear: hits.length === 0, needsReview: false, hits, mode: "demo" };
}
