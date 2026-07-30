/* ==========================================================================
   The deal service the routes use.

   Picks the Supabase or demo store from config, and layers the deal-lifecycle
   logic on top of a generic patch(): create (with Trust Score), status moves,
   the handover code + auto-release timer, and the full dispute flow (open →
   AI judge → money moves). Keeping this logic here means both stores stay dumb.
   ========================================================================== */

import { getDisputeDecision } from "@/lib/ai/dispute";
import { getTrustScore } from "@/lib/ai/trust-score";
import type { DisputeDecision } from "@/lib/ai/types";
import { dealBackend } from "./config";
import { demoStore } from "./demo-store";
import { autoReleaseTime, newHandoverCode, statusLabel } from "./helpers";
import { supabaseStore } from "./supabase-store";
import type { CreateDealInput, Deal, DealDispute, DealStatus, DealTrust, TimelineEvent } from "./types";

function backend() {
  return dealBackend() === "supabase" ? supabaseStore : demoStore;
}

function event(status: DealStatus, note?: string): TimelineEvent {
  return { at: new Date().toISOString(), status, label: statusLabel(status), note };
}

export function getDeal(id: string): Promise<Deal | null> {
  return backend().get(id);
}

/** List deals — but first release any that quietly ran past their timer. */
export async function listDeals(): Promise<Deal[]> {
  await runAutoReleases();
  return backend().list();
}

/** List one buyer's own deals (per-user scoping for the dashboard + reputation). */
export async function listDealsForUser(email: string): Promise<Deal[]> {
  await runAutoReleases();
  return backend().listByBuyer(email);
}

/**
 * Create a deal and store it. If the buyer pasted a chat, run the Trust Score
 * first (live or mock, per the AI layer) and save a snapshot on the deal.
 */
export async function createDeal(input: CreateDealInput): Promise<Deal> {
  let trust: DealTrust | undefined;
  if (input.chat && input.chat.trim()) {
    try {
      const result = await getTrustScore({ chat: input.chat, seller: input.seller, item: input.item });
      trust = { score: result.score, verdict: result.verdict, headline: result.headline };
    } catch {
      trust = undefined; // never block deal creation on the score
    }
  }
  return backend().create(input, trust);
}

/** Simple status move (e.g. fund, refund) with a timeline entry. */
export async function setDealStatus(id: string, status: DealStatus, note?: string): Promise<Deal | null> {
  const deal = await backend().get(id);
  if (!deal) return null;
  const ev = event(status, note);
  return backend().patch(id, { status, timeline: [...deal.timeline, ev], updatedAt: ev.at });
}

/**
 * Seller ships. We mint the buyer's secret handover code and start the
 * auto-release timer — the two anti-cheat mechanisms from the plan.
 */
export async function shipDeal(id: string): Promise<Deal | null> {
  const deal = await backend().get(id);
  if (!deal) return null;
  const ev = event("shipped", "Handover code sent to the buyer; auto-release timer started.");
  return backend().patch(id, {
    status: "shipped",
    handoverCode: newHandoverCode(),
    autoReleaseAt: autoReleaseTime(ev.at),
    timeline: [...deal.timeline, ev],
    updatedAt: ev.at,
  });
}

export interface ReleaseResult {
  ok: boolean;
  deal?: Deal;
  error?: string;
}

/**
 * Buyer confirms delivery with the secret handover code → seller is paid.
 * A wrong code can't release the money, and the buyer can't later claim it
 * never arrived once their own code released it.
 */
export async function releaseWithCode(id: string, code: string): Promise<ReleaseResult> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  if (deal.status !== "shipped") return { ok: false, error: "The deal isn't awaiting confirmation." };
  if (!deal.handoverCode || code.trim() !== deal.handoverCode) {
    return { ok: false, error: "That handover code doesn't match." };
  }
  const ev = event("completed", "Buyer confirmed with the handover code — seller paid.");
  const updated = await backend().patch(id, { status: "completed", timeline: [...deal.timeline, ev], updatedAt: ev.at });
  return { ok: true, deal: updated ?? undefined };
}

/**
 * Auto-release fairly: if the buyer neither confirms nor disputes before the
 * timer runs out, the money releases to the seller so it can't be frozen forever.
 * Returns the number of deals released.
 */
export async function runAutoReleases(): Promise<number> {
  const now = Date.now();
  const deals = await backend().list();
  let released = 0;
  for (const deal of deals) {
    if (deal.status === "shipped" && deal.autoReleaseAt && new Date(deal.autoReleaseAt).getTime() <= now) {
      const ev = event("completed", "Auto-released — the buyer didn't confirm or dispute in time.");
      await backend().patch(deal.id, { status: "completed", timeline: [...deal.timeline, ev], updatedAt: ev.at });
      released += 1;
    }
  }
  return released;
}

/** Map an AI dispute decision to the deal status the money move lands in. */
function statusForDecision(decision: DisputeDecision): DealStatus {
  switch (decision) {
    case "release_to_seller":
      return "completed";
    case "refund_buyer":
      return "refunded";
    default:
      return "resolved"; // split
  }
}

export interface DisputeInput {
  buyer: { claim: string; evidence?: string[] };
  seller: { claim: string; evidence?: string[] };
}

/**
 * The full dispute flow in one call: open the dispute, hand both sides'
 * evidence to the AI judge, apply its decision, and move the money.
 */
export async function openAndJudgeDispute(id: string, input: DisputeInput): Promise<Deal | null> {
  const deal = await backend().get(id);
  if (!deal) return null;

  const openedAt = new Date().toISOString();
  const resolution = await getDisputeDecision({
    item: deal.item,
    amount: deal.item.amount,
    buyer: input.buyer,
    seller: input.seller,
    chat: deal.chat,
  });

  const dispute: DealDispute = { openedAt, buyer: input.buyer, seller: input.seller, resolution };
  const status = statusForDecision(resolution.decision);

  const openEv = event("disputed", "Dispute opened — both sides submitted evidence.");
  const rulingNote =
    resolution.decision === "split"
      ? `AI judge: split — ${resolution.splitBuyerPercent}% to the buyer, the rest to the seller.`
      : resolution.decision === "refund_buyer"
        ? "AI judge: refund the buyer."
        : "AI judge: release the money to the seller.";
  const rulingEv = event(status, rulingNote);

  return backend().patch(id, {
    status,
    dispute,
    timeline: [...deal.timeline, openEv, rulingEv],
    updatedAt: rulingEv.at,
  });
}
