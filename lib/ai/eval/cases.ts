/* ==========================================================================
   Labelled test cases for Zafe's AI (H2O's Day-6 task: "test the AI for
   wrong answers, count the mistakes, know the number before a judge asks").

   Each case has a known-right answer. The runner (run.ts) feeds them through
   the real AI functions — live Claude when a key + credits are set, the
   offline heuristic otherwise — and counts how many it gets wrong.
   ========================================================================== */

import type { ScamCheckResult, TrustScoreResult, DisputeResult } from "../types";
import type { SellerProfile } from "../types";

/* ----------------------------- Scam detector ---------------------------- */
// Binary: is this text a scam? The cleanest accuracy metric.

export interface ScamCase {
  name: string;
  text: string;
  expectScam: boolean;
}

export const SCAM_CASES: ScamCase[] = [
  { name: "personal-account", text: "Pay into my personal account first, then I ship. My Zafe isn't working.", expectScam: true },
  { name: "advance-fee", text: "Send a small clearance fee to release your item, then I refund you.", expectScam: true },
  { name: "fake-proof", text: "I've already sent the money, just check again — it's pending on my side.", expectScam: true },
  { name: "off-platform", text: "Let's just do this on WhatsApp outside the app, it's cheaper that way.", expectScam: true },
  { name: "gift-card", text: "Buy me a steam gift card and share the code, I'll ship immediately.", expectScam: true },
  { name: "crypto-first", text: "Send the payment in USDT to my wallet before I can post it out.", expectScam: true },
  { name: "urgency-pressure", text: "URGENT! Last one left, someone else is paying now — send within 5 minutes or you lose it.", expectScam: true },
  { name: "clean-escrow", text: "Hi, is the iPhone still available? Happy to use Zafe escrow so we're both safe.", expectScam: false },
  { name: "clean-serial", text: "Sure, I'll ship once the money is in escrow. Here's the serial number and extra photos.", expectScam: false },
  { name: "clean-meetup", text: "Can we meet at the campus gate tomorrow afternoon to hand it over?", expectScam: false },
  { name: "clean-history", text: "I've been selling here for two years, happy to use buyer protection.", expectScam: false },
  { name: "clean-question", text: "Does it come with the original charger and box?", expectScam: false },
];

/* ------------------------------ Trust Score ----------------------------- */
// Graded on the verdict band, since the exact number is a spectrum.

export interface TrustCase {
  name: string;
  chat: string;
  seller: SellerProfile;
  // Accept any of these verdicts as correct.
  expect: TrustScoreResult["verdict"][];
}

export const TRUST_CASES: TrustCase[] = [
  {
    name: "clear-scam",
    chat: "Seller: pay into my personal account first, then I ship. Trust me, last one left, send now!",
    seller: { name: "QuickDeals01", verified: false, completedDeals: 0, disputes: 0, accountAgeDays: 2, rating: 0 },
    expect: ["risky"],
  },
  {
    name: "trusted-seller",
    chat: "Seller: happy to use Zafe escrow. Here's the serial number and extra photos.",
    seller: { name: "Ada Electronics", verified: true, completedDeals: 42, disputes: 0, accountAgeDays: 420, rating: 4.9 },
    expect: ["safe"],
  },
  {
    name: "mixed-history",
    chat: "Seller: yeah it's original, I'll send an unboxing video.",
    seller: { name: "KicksNaija", verified: true, completedDeals: 7, disputes: 2, accountAgeDays: 95, rating: 3.8 },
    expect: ["caution", "risky"],
  },
  {
    name: "new-but-clean",
    chat: "Seller: I'm new here but happy to use escrow and only get paid after you confirm.",
    seller: { name: "FreshStore", verified: true, completedDeals: 1, disputes: 0, accountAgeDays: 10, rating: 0 },
    expect: ["caution", "safe"],
  },
  {
    name: "verified-pressuring",
    chat: "Seller: just pay me directly, escrow takes too long. Send now before I sell to someone else.",
    seller: { name: "GadgetHub", verified: true, completedDeals: 15, disputes: 1, accountAgeDays: 200, rating: 4.2 },
    expect: ["caution", "risky"],
  },
];

/* ----------------------------- Dispute judge ---------------------------- */

export interface DisputeCase {
  name: string;
  buyer: { claim: string; evidence?: string[] };
  seller: { claim: string; evidence?: string[] };
  // Accept any of these decisions as correct.
  expect: DisputeResult["decision"][];
}

export const DISPUTE_CASES: DisputeCase[] = [
  {
    name: "empty-box",
    buyer: { claim: "The box arrived empty.", evidence: ["Unboxing video shows no console inside"] },
    seller: { claim: "I shipped it sealed.", evidence: [] },
    expect: ["refund_buyer"],
  },
  {
    name: "delivered-proven",
    buyer: { claim: "I changed my mind, I want a refund.", evidence: [] },
    seller: { claim: "Delivered as agreed.", evidence: ["Tracking shows delivered", "Signed handover photo"] },
    expect: ["release_to_seller"],
  },
  {
    name: "both-partial",
    buyer: { claim: "Item is scratched and not as described.", evidence: ["Photo of scratch"] },
    seller: { claim: "It was fine when I shipped it.", evidence: ["Unboxing video before sending"] },
    expect: ["split", "refund_buyer", "release_to_seller"],
  },
  {
    name: "neither-proof",
    buyer: { claim: "It never arrived.", evidence: [] },
    seller: { claim: "I sent it, I promise.", evidence: [] },
    expect: ["split", "refund_buyer"],
  },
];

// Re-export result types so run.ts can annotate without a second import path.
export type { ScamCheckResult, TrustScoreResult, DisputeResult };
