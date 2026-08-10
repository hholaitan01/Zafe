/* ==========================================================================
   Believable demo deals (the Day-6 "fill it with demo data" task, brought
   forward so the screens never look empty). A few finished, one live, one in
   dispute — and one risky brand-new deal so the scary Trust Score has a home.

   The two headline demo sellers land where the plan wants: a clearly-safe
   seller at 87 and a clearly-dodgy one at 23.
   ========================================================================== */

import type { Deal } from "./types";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const daysAhead = (d: number) => new Date(now + d * 86_400_000).toISOString();

export function seedDeals(): Deal[] {
  return [
    {
      id: "seed-completed-iphone",
      reference: "TF-7QH2",
      item: { title: "iPhone 13 (128GB, Blue)", amount: 240000, currency: "NGN" },
      seller: { id: "seller-ada", name: "Ada Electronics", verified: true, completedDeals: 42, disputes: 0, accountAgeDays: 420, rating: 4.9 },
      buyerEmail: "demo@zafe.ng",
      status: "completed",
      trust: { score: 87, verdict: "safe", headline: "Looks safe. Verified seller with a strong track record." },
      timeline: [
        { at: daysAgo(6), status: "created", label: "Deal created" },
        { at: daysAgo(6), status: "funded", label: "Money held in escrow" },
        { at: daysAgo(5), status: "shipped", label: "Item shipped" },
        { at: daysAgo(4), status: "completed", label: "Completed. Seller paid" },
      ],
      createdAt: daysAgo(6),
      updatedAt: daysAgo(4),
    },
    {
      id: "seed-funded-ps5",
      reference: "TF-3M8P",
      item: { title: "PlayStation 5 (Slim, Disc)", amount: 585000, currency: "NGN" },
      seller: { id: "seller-gamehub", name: "GameHub NG", verified: true, completedDeals: 18, disputes: 1, accountAgeDays: 210, rating: 4.6 },
      buyerEmail: "demo@zafe.ng",
      status: "funded",
      trust: { score: 78, verdict: "safe", headline: "Safe to proceed. Established seller, one old dispute." },
      timeline: [
        { at: hoursAgo(20), status: "created", label: "Deal created" },
        { at: hoursAgo(18), status: "funded", label: "Money held in escrow", note: "Waiting for the seller to ship." },
      ],
      createdAt: hoursAgo(20),
      updatedAt: hoursAgo(18),
    },
    {
      id: "seed-shipped-airpods",
      reference: "TF-6VT1",
      item: { title: "AirPods Pro (2nd gen)", amount: 145000, currency: "NGN" },
      seller: { id: "seller-soundhub", name: "SoundHub", verified: true, completedDeals: 23, disputes: 0, accountAgeDays: 300, rating: 4.7 },
      buyerEmail: "demo@zafe.ng",
      status: "shipped",
      trust: { score: 82, verdict: "safe", headline: "Safe. Trusted seller, item on the way." },
      handoverCode: "729145",
      autoReleaseAt: daysAhead(2),
      timeline: [
        { at: daysAgo(1), status: "created", label: "Deal created" },
        { at: daysAgo(1), status: "funded", label: "Money held in escrow" },
        { at: hoursAgo(6), status: "shipped", label: "Item shipped", note: "Handover code sent to the buyer; auto-release in ~2 days." },
      ],
      createdAt: daysAgo(1),
      updatedAt: hoursAgo(6),
    },
    {
      id: "seed-disputed-sneakers",
      reference: "TF-9KD5",
      item: { title: "Air Jordan 1 (UK 9)", amount: 95000, currency: "NGN" },
      seller: { id: "seller-kicks", name: "KicksNaija", verified: true, completedDeals: 7, disputes: 2, accountAgeDays: 95, rating: 3.8 },
      buyerEmail: "demo@zafe.ng",
      chat: "Buyer: are these the original pair? Seller: 100% original, I'll send an unboxing. Buyer: ok proceeding.",
      status: "disputed",
      trust: { score: 54, verdict: "caution", headline: "Be careful. Mixed history and a couple of past disputes." },
      handoverCode: "418302",
      dispute: {
        openedAt: daysAgo(1),
        buyer: { claim: "The pair looks fake — the stitching is off and there was no box.", evidence: ["Close-up photos of the stitching"] },
        seller: { claim: "They're 100% original, I recorded an unboxing before sending.", evidence: ["Unboxing video"] },
      },
      timeline: [
        { at: daysAgo(3), status: "created", label: "Deal created" },
        { at: daysAgo(3), status: "funded", label: "Money held in escrow" },
        { at: daysAgo(2), status: "shipped", label: "Item shipped" },
        { at: daysAgo(1), status: "disputed", label: "Dispute opened", note: "Buyer says the pair looks fake." },
      ],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(1),
    },
    {
      id: "seed-risky-iphone15",
      reference: "TF-2XR7",
      item: { title: "iPhone 15 Pro Max (256GB)", amount: 300000, currency: "NGN" },
      seller: { id: "seller-quickdeals", name: "QuickDeals01", verified: false, completedDeals: 0, disputes: 0, accountAgeDays: 2, rating: 0 },
      buyerEmail: "demo@zafe.ng",
      chat: "Seller: pay into my personal account first, then I ship. Trust me, last one left, someone else will buy! Send now.",
      status: "created",
      trust: { score: 23, verdict: "risky", headline: "High risk. Unverified, brand new, and pushing you off escrow." },
      timeline: [{ at: hoursAgo(2), status: "created", label: "Deal created", note: "Scam warning shown to the buyer." }],
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
    },
  ];
}
