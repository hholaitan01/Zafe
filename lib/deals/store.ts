/* ==========================================================================
   The deal service the routes use.

   Picks the Supabase or demo store from config, and layers the deal-lifecycle
   logic on top of a generic patch(): create (with Trust Score), status moves,
   the handover code + auto-release timer, and the full dispute flow (open →
   AI judge → money moves). Keeping this logic here means both stores stay dumb.
   ========================================================================== */

import { getDisputeDecision } from "@/lib/ai/dispute";
import { getTrustScore } from "@/lib/ai/trust-score";
import type { DisputeDecision, DisputeResult } from "@/lib/ai/types";
import { isSeedFlagged, type FraudFlag } from "@/lib/fraud";
import { payoutSeller, refundBuyer } from "@/lib/payments";
import { dealBackend } from "./config";
import { demoStore } from "./demo-store";
import { autoReleaseTime, newHandoverCode, normalizeContact, statusLabel } from "./helpers";
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

/** Look a deal up by its human reference (the ALATPay orderId) — for the webhook. */
export async function getDealByReference(reference: string): Promise<Deal | null> {
  const all = await backend().list();
  return all.find((d) => d.reference === reference) ?? null;
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

/** Store the buyer's ALATPay collection account on the deal (funding, live mode). */
export async function attachCollectionAccount(
  id: string,
  acct: { accountNumber: string; expiresAt: string; alatTransactionId?: string },
): Promise<Deal | null> {
  const deal = await backend().get(id);
  if (!deal) return null;
  return backend().patch(id, {
    alatVirtualAccount: acct.accountNumber,
    alatAccountExpiresAt: acct.expiresAt,
    alatTransactionId: acct.alatTransactionId,
    updatedAt: new Date().toISOString(),
  });
}

/** Every deal (across all buyers) that names this seller — for seller standing. */
export async function listDealsBySeller(contact: string): Promise<Deal[]> {
  const norm = normalizeContact(contact);
  if (!norm) return [];
  const all = await backend().list();
  return all.filter((d) => d.seller?.contact && normalizeContact(d.seller.contact) === norm);
}

/**
 * Create a deal and store it, snapshotting a Trust Score verdict when we can.
 * The assessment blends three things: the AI read of the pasted chat (if any),
 * the seller's own TrustFlow history, and a hard fraud-watchlist override.
 */
export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const trust = await assessDeal(input);
  return backend().create(input, trust);
}

/** A seller's fraud signal + history, derived from past TrustFlow deals. */
async function sellerSignals(contact: string): Promise<{ completed: number; disputed: number; fraud: FraudFlag }> {
  const deals = await listDealsBySeller(contact);
  const completed = deals.filter((d) => d.status === "completed" || d.status === "resolved").length;
  const disputed = deals.filter((d) => d.status === "disputed" || d.dispute).length;
  const lost = deals.filter((d) => {
    const dec = d.dispute?.resolution?.decision;
    return dec === "refund_buyer" || dec === "split"; // resolved against the seller
  }).length;

  const seed = isSeedFlagged(contact);
  let fraud: FraudFlag = seed;
  if (!fraud.flagged && lost >= 1) fraud = { flagged: true, reason: `${lost} dispute${lost === 1 ? "" : "s"} resolved against them` };
  else if (!fraud.flagged && disputed >= 2) fraud = { flagged: true, reason: `${disputed} disputes on record` };

  return { completed, disputed, fraud };
}

/** Produce the deal's Trust Score snapshot (or none). */
async function assessDeal(input: CreateDealInput): Promise<DealTrust | undefined> {
  const contact = input.seller?.contact?.trim();
  const signals = contact ? await sellerSignals(contact) : null;

  // Feed the seller's real history into the AI's view of them.
  const seller = { ...input.seller };
  if (signals) {
    seller.completedDeals = signals.completed;
    seller.disputes = signals.disputed;
  }

  // AI read of the pasted chat, when there is one.
  let base: DealTrust | undefined;
  if (input.chat && input.chat.trim()) {
    try {
      const r = await getTrustScore({ chat: input.chat, seller, item: input.item });
      base = { score: r.score, verdict: r.verdict, headline: r.headline };
    } catch {
      base = undefined; // never block deal creation on the score
    }
  }

  // Hard override: a watchlisted seller is risky no matter how clean the chat.
  if (signals?.fraud.flagged) {
    return {
      score: Math.min(base?.score ?? 100, 12),
      verdict: "risky",
      headline: `⚠ This seller is on TrustFlow's fraud watchlist (${signals.fraud.reason}). We strongly advise against paying.`,
    };
  }

  // No chat, but the seller has a rocky history → a deterministic caution so
  // the payment screen still warns (rather than showing "no chat scanned").
  if (!base && signals && signals.disputed > 0) {
    return {
      score: 45,
      verdict: "caution",
      headline: `Heads up — this seller has ${signals.disputed} past dispute${signals.disputed === 1 ? "" : "s"} on TrustFlow.`,
    };
  }

  return base;
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
  // Money moves before we mark it done: pay the seller (ALAT in live mode,
  // simulated in demo). Don't complete the deal if the payout fails.
  const payout = await payoutSeller(deal);
  if (!payout.ok) return { ok: false, error: payout.error ?? "Payout to the seller failed." };
  const ev = event("completed", `Buyer confirmed with the handover code — seller paid${payout.mode === "mock" ? " (demo)" : ""}.`);
  const updated = await backend().patch(id, { status: "completed", payoutRef: payout.ref, timeline: [...deal.timeline, ev], updatedAt: ev.at });
  return { ok: true, deal: updated ?? undefined };
}

/**
 * Direct release to the seller (no handover code) — the REST payout entry and
 * any "confirm received" action. Pays out via the seam, then completes the deal.
 * Idempotent: a deal already paid out isn't paid twice.
 */
export async function releaseToSeller(id: string, via?: string): Promise<ReleaseResult> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  if (deal.payoutRef) return { ok: true, deal };
  if (deal.status !== "funded" && deal.status !== "shipped") {
    return { ok: false, error: "The deal isn't eligible for payout." };
  }
  const payout = await payoutSeller(deal);
  if (!payout.ok) return { ok: false, error: payout.error ?? "Payout to the seller failed." };
  const ev = event("completed", `Seller paid${payout.mode === "mock" ? " (demo)" : ""}${via ? ` · ${via}` : ""}.`);
  const updated = await backend().patch(id, { status: "completed", payoutRef: payout.ref, timeline: [...deal.timeline, ev], updatedAt: ev.at });
  return { ok: true, deal: updated ?? undefined };
}

/**
 * Refund the buyer (full or partial) and settle the deal. On a partial refund
 * the remainder goes to the seller and the deal is "resolved"; a full refund is
 * "refunded". Used by the REST refund entry and accepted dispute outcomes.
 */
export async function refundDeal(id: string, amount?: number): Promise<ReleaseResult> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  if (!["funded", "shipped", "disputed"].includes(deal.status)) {
    return { ok: false, error: "The deal isn't eligible for a refund." };
  }
  const refundAmt = amount ?? deal.item.amount;
  if (refundAmt > deal.item.amount) return { ok: false, error: "Refund exceeds the escrowed amount." };

  const refund = await refundBuyer(deal, refundAmt);
  if (!refund.ok) return { ok: false, error: refund.error ?? "Refund to the buyer failed." };

  const isPartial = refundAmt < deal.item.amount;
  if (isPartial && deal.item.amount - refundAmt > 0) await payoutSeller(deal, deal.item.amount - refundAmt);
  const status: DealStatus = isPartial ? "resolved" : "refunded";
  const ev = event(status, isPartial ? `Partial refund — the buyer got back part of the amount.` : "Refunded to the buyer.");
  const updated = await backend().patch(id, {
    status,
    payoutRef: refund.ref,
    partialRefundAmount: isPartial ? refundAmt : undefined,
    timeline: [...deal.timeline, ev],
    updatedAt: ev.at,
  });
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
      const payout = await payoutSeller(deal);
      if (!payout.ok) continue; // leave it shipped; the next sweep retries
      const ev = event("completed", `Auto-released — the buyer didn't confirm or dispute in time; seller paid${payout.mode === "mock" ? " (demo)" : ""}.`);
      await backend().patch(deal.id, { status: "completed", payoutRef: payout.ref, timeline: [...deal.timeline, ev], updatedAt: ev.at });
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

export interface DisputeOutcome {
  ok: boolean;
  deal?: Deal;
  resolution?: DisputeResult;
  error?: string;
}

/**
 * The full dispute flow in one call: open the dispute, hand both sides'
 * evidence to the AI judge, apply its decision, and move the money.
 *
 * Crucially, the ruling is only *settled* (deal marked refunded/resolved/
 * completed) if the money actually moved. If a live transfer fails, we record
 * the dispute as opened + judged but leave the deal "disputed" (settlement
 * pending) and return ok:false — a dispute is never closed with money frozen.
 */
export async function openAndJudgeDispute(id: string, input: DisputeInput): Promise<DisputeOutcome> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };

  const openedAt = new Date().toISOString();
  const resolution = await getDisputeDecision({
    item: deal.item,
    amount: deal.item.amount,
    buyer: input.buyer,
    seller: input.seller,
    chat: deal.chat,
  });
  const dispute: DealDispute = { openedAt, buyer: input.buyer, seller: input.seller, resolution };
  const openEv = event("disputed", "Dispute opened — both sides submitted evidence.");

  // Transfer failed → record the dispute but DON'T settle it. Leaves the deal
  // "disputed" so it can be retried, and never marks it paid without money.
  const abort = async (error?: string): Promise<DisputeOutcome> => {
    const note = event("disputed", "AI ruling made, but the transfer failed — settlement pending, will retry.");
    const updated = await backend().patch(id, { status: "disputed", dispute, timeline: [...deal.timeline, openEv, note], updatedAt: note.at });
    return { ok: false, deal: updated ?? undefined, resolution, error: error ?? "The dispute payout could not be processed." };
  };

  // Apply the ruling to the money (ALAT in live mode, simulated in demo),
  // checking every transfer result the way releaseToSeller / refundDeal do.
  let payoutRef: string | undefined;
  let partialRefundAmount: number | undefined;
  let extraNote: string | undefined;
  if (resolution.decision === "refund_buyer") {
    const r = await refundBuyer(deal);
    if (!r.ok) return abort(r.error);
    payoutRef = r.ref;
  } else if (resolution.decision === "split") {
    const buyerShare = Math.round((deal.item.amount * resolution.splitBuyerPercent) / 100);
    const r = await refundBuyer(deal, buyerShare);
    if (!r.ok) return abort(r.error); // buyer's share is the protective move — abort if it fails
    payoutRef = r.ref;
    partialRefundAmount = buyerShare;
    const remainder = deal.item.amount - buyerShare;
    if (remainder > 0) {
      const p = await payoutSeller(deal, remainder);
      // Buyer is already protected; if the seller's remainder fails, settle but flag it.
      if (!p.ok) extraNote = "Buyer's share refunded; the seller's remainder payout is pending and will retry.";
    }
  } else {
    const p = await payoutSeller(deal);
    if (!p.ok) return abort(p.error);
    payoutRef = p.ref;
  }

  const status = statusForDecision(resolution.decision);
  const rulingNote =
    resolution.decision === "split"
      ? `AI judge: split — ${resolution.splitBuyerPercent}% to the buyer, the rest to the seller.`
      : resolution.decision === "refund_buyer"
        ? "AI judge: refund the buyer."
        : "AI judge: release the money to the seller.";
  const timeline = [...deal.timeline, openEv, event(status, rulingNote)];
  if (extraNote) timeline.push(event(status, extraNote));
  const updatedAt = timeline[timeline.length - 1].at;

  const updated = await backend().patch(id, { status, dispute, payoutRef, partialRefundAmount, timeline, updatedAt });
  return { ok: true, deal: updated ?? undefined, resolution };
}
