/* ==========================================================================
   Seller standing — "who is this person you're about to pay?"

   When a buyer enters a seller's phone/email on the New Escrow screen, we look
   the seller up across every past TrustFlow deal and summarise how they've
   behaved: a first-timer is flagged as new (extra caution), a seller with clean
   completed deals reads as reliable, and any past dispute shows as a warning.

   Like the buyer reputation model, this is derived from real deal history — it
   accumulates as the seller trades — not a hardcoded badge.
   ========================================================================== */

import { listDealsBySeller } from "@/lib/deals/store";

export type StandingTone = "good" | "neutral" | "warn";

export interface SellerStanding {
  contact: string;
  known: boolean; // has any prior deal on TrustFlow
  priorDeals: number;
  completed: number;
  disputed: number;
  verified: boolean; // KYC-verified seller (BVN/NIN)
  tone: StandingTone;
  label: string; // short chip label, e.g. "Reliable seller"
  detail: string; // one explanatory line
}

export async function getSellerStanding(contact: string): Promise<SellerStanding> {
  const deals = await listDealsBySeller(contact);
  const priorDeals = deals.length;
  const completed = deals.filter((d) => d.status === "completed" || d.status === "resolved").length;
  const disputed = deals.filter((d) => d.status === "disputed" || d.dispute).length;
  const verified = deals.some((d) => d.seller?.verified === true);

  let tone: StandingTone;
  let label: string;
  let detail: string;

  if (priorDeals === 0) {
    tone = "neutral";
    label = "New seller";
    detail = "No TrustFlow history yet. Your escrow still protects you, but take extra care.";
  } else if (disputed > 0) {
    tone = "warn";
    label = "Caution";
    detail = `${disputed} past dispute${disputed === 1 ? "" : "s"} on record across ${priorDeals} deal${priorDeals === 1 ? "" : "s"}.`;
  } else if (completed > 0) {
    tone = "good";
    label = "Reliable seller";
    detail = `${completed} deal${completed === 1 ? "" : "s"} completed cleanly, no disputes.`;
  } else {
    tone = "neutral";
    label = "In progress";
    detail = `${priorDeals} deal${priorDeals === 1 ? "" : "s"} underway, none completed yet.`;
  }

  return { contact: contact.trim(), known: priorDeals > 0, priorDeals, completed, disputed, verified, tone, label, detail };
}
