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
import { fundEntry } from "@/lib/ledger/entries";
import { recordSafe } from "@/lib/ledger/store";
import { getSeller } from "@/lib/sellers/store";
import { dealBackend } from "./config";
import { demoStore } from "./demo-store";
import { autoReleaseTime, newHandoverCode, normalizeContact, statusLabel } from "./helpers";
import { supabaseStore } from "./supabase-store";
import type { CreateDealInput, Deal, DealDispute, DealStatus, DealTrust, PayoutAccount, TimelineEvent } from "./types";

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

/** A seller's own sales — deals where they are the seller (any of their contacts). */
export async function listDealsBySellerContacts(contacts: string[]): Promise<Deal[]> {
  const set = new Set(contacts.map(normalizeContact).filter(Boolean));
  if (!set.size) return [];
  await runAutoReleases();
  const all = await backend().list();
  return all
    .filter((d) => d.seller?.contact && set.has(normalizeContact(d.seller.contact)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Create a deal and store it, snapshotting a Trust Score verdict when we can.
 * The assessment blends three things: the AI read of the pasted chat (if any),
 * the seller's own Zafe history, and a hard fraud-watchlist override.
 */
export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const trust = await assessDeal(input);
  return backend().create(input, trust);
}

/** A seller's fraud signal + history, derived from past Zafe deals. */
async function sellerSignals(contact: string): Promise<{ completed: number; disputed: number; fraud: FraudFlag }> {
  const deals = await listDealsBySeller(contact);
  const completed = deals.filter((d) => d.status === "completed" || d.status === "resolved").length;
  const disputed = deals.filter((d) => d.status === "disputed" || d.dispute).length;
  const lost = deals.filter((d) => {
    const dec = d.dispute?.settledDecision; // only a *settled* dispute counts against them
    return dec === "refund_buyer" || dec === "split";
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
      headline: `⚠ This seller is on Zafe's fraud watchlist (${signals.fraud.reason}). We strongly advise against paying.`,
    };
  }

  // No chat, but the seller has a rocky history → a deterministic caution so
  // the payment screen still warns (rather than showing "no chat scanned").
  if (!base && signals && signals.disputed > 0) {
    return {
      score: 45,
      verdict: "caution",
      headline: `Heads up — this seller has ${signals.disputed} past dispute${signals.disputed === 1 ? "" : "s"} on Zafe.`,
    };
  }

  return base;
}

/** Simple status move (e.g. fund, refund) with a timeline entry. */
export async function setDealStatus(id: string, status: DealStatus, note?: string): Promise<Deal | null> {
  const deal = await backend().get(id);
  if (!deal) return null;
  const ev = event(status, note);
  const updated = await backend().patch(id, { status, timeline: [...deal.timeline, ev], updatedAt: ev.at });
  // Money landed in escrow: post it to the ledger (best-effort, idempotent by ref).
  if (status === "funded") await recordSafe(fundEntry(deal.id, deal.item.amount));
  return updated;
}

/**
 * Seller ships. We mint the buyer's secret handover code and start the
 * auto-release timer — the two anti-cheat mechanisms from the plan.
 */
export async function shipDeal(id: string, sellerPayout?: PayoutAccount): Promise<Deal | null> {
  const deal = await backend().get(id);
  if (!deal) return null;

  // Resolve the seller's payout account: an explicit one wins, else look it up
  // server-side from the seller's saved account (so we don't trust the client).
  let payout = sellerPayout;
  if (!payout && deal.seller?.contact) {
    const seller = await getSeller(deal.seller.contact);
    if (seller?.payout?.accountNumber) {
      payout = { accountNumber: seller.payout.accountNumber, accountName: seller.payout.accountName, verified: seller.idVerified };
    }
  }

  const ev = event("shipped", "Handover code sent to the buyer; auto-release timer started.");
  return backend().patch(id, {
    status: "shipped",
    handoverCode: newHandoverCode(),
    autoReleaseAt: autoReleaseTime(ev.at),
    ...(payout ? { sellerPayout: payout } : {}),
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
  const status: DealStatus = isPartial ? "resolved" : "refunded";
  const timeline = [...deal.timeline, event(status, isPartial ? "Partial refund — the buyer got back part of the amount." : "Refunded to the buyer.")];

  // Buyer is protected; pay the seller their remainder. If that fails, still
  // settle (buyer already refunded) but flag the remainder as pending.
  if (isPartial && deal.item.amount - refundAmt > 0) {
    const p = await payoutSeller(deal, deal.item.amount - refundAmt);
    if (!p.ok) timeline.push(event(status, "The seller's remainder payout is pending and will retry."));
  }

  const updated = await backend().patch(id, {
    status,
    payoutRef: refund.ref,
    partialRefundAmount: isPartial ? refundAmt : undefined,
    timeline,
    updatedAt: timeline[timeline.length - 1].at,
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

/** Human-readable summary of a decision, for the timeline. */
function decisionNote(decision: DisputeDecision, splitBuyerPercent = 50): string {
  return decision === "split"
    ? `split — ${splitBuyerPercent}% to the buyer, the rest to the seller`
    : decision === "refund_buyer"
      ? "full refund to the buyer"
      : "release the funds to the seller";
}

interface SettleMoney {
  ok: boolean;
  status?: DealStatus;
  payoutRef?: string;
  partialRefundAmount?: number;
  notes?: string[];
  error?: string;
}

/**
 * Move the money for a settled dispute decision (ALAT in live mode, simulated
 * in demo), the same guarded way releaseToSeller / refundDeal do. Returns the
 * status the deal should land in and the payout ref — but does NOT patch the
 * deal, so callers can attach their own dispute bookkeeping. The buyer's share
 * is always the protective move: if it fails, we abort rather than settle.
 */
async function settleByDecision(deal: Deal, decision: DisputeDecision, splitBuyerPercent = 50): Promise<SettleMoney> {
  if (decision === "refund_buyer") {
    const r = await refundBuyer(deal);
    if (!r.ok) return { ok: false, error: r.error ?? "Refund to the buyer failed." };
    return { ok: true, status: "refunded", payoutRef: r.ref };
  }
  if (decision === "split") {
    const buyerShare = Math.round((deal.item.amount * splitBuyerPercent) / 100);
    const r = await refundBuyer(deal, buyerShare);
    if (!r.ok) return { ok: false, error: r.error ?? "Refund to the buyer failed." };
    const notes: string[] = [];
    const remainder = deal.item.amount - buyerShare;
    if (remainder > 0) {
      const p = await payoutSeller(deal, remainder);
      if (!p.ok) notes.push("Buyer's share refunded; the seller's remainder payout is pending and will retry.");
    }
    return { ok: true, status: "resolved", payoutRef: r.ref, partialRefundAmount: buyerShare, notes };
  }
  const p = await payoutSeller(deal); // release_to_seller
  if (!p.ok) return { ok: false, error: p.error ?? "Payout to the seller failed." };
  return { ok: true, status: "completed", payoutRef: p.ref };
}

export interface DisputeInput {
  reason?: string;
  buyer: { claim: string; evidence?: string[] };
  seller: { claim: string; evidence?: string[] };
  /** A resolution already decided server-side (e.g. by the dispute mediator).
      When set, it is stored as the suggestion instead of running the one-shot
      judge. NEVER pass a client-supplied value here — only one computed on the
      server in the same request, or acceptDispute would move money on it. */
  resolution?: DisputeResult;
}

export interface DisputeOutcome {
  ok: boolean;
  deal?: Deal;
  resolution?: DisputeResult;
  error?: string;
}

/**
 * Open a dispute: hand both sides' evidence to the AI, which returns a SUGGESTED
 * resolution. Crucially, no money moves here — the deal is left "disputed" with
 * the suggestion attached, for both parties to accept (or escalate). A fresh
 * suggestion resets any prior acceptances.
 */
export async function openDispute(id: string, input: DisputeInput): Promise<DisputeOutcome> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  // Only a deal with money still in escrow can be disputed — never reopen a
  // settled deal (completed / refunded / resolved), which could move money twice.
  if (!["funded", "shipped", "disputed"].includes(deal.status)) {
    return { ok: false, error: "Only a funded or delivered deal can be disputed." };
  }

  const openedAt = new Date().toISOString();
  // Use the mediator's server-computed resolution when one was passed; otherwise
  // fall back to the one-shot judge (the original form-based flow).
  const resolution = input.resolution ?? await getDisputeDecision({
    item: deal.item,
    amount: deal.item.amount,
    buyer: input.buyer,
    seller: input.seller,
    chat: deal.chat,
  });
  const dispute: DealDispute = {
    openedAt: deal.dispute?.openedAt ?? openedAt,
    reason: input.reason ?? deal.dispute?.reason,
    buyer: input.buyer,
    seller: input.seller,
    resolution,
    buyerAccepted: false,
    sellerAccepted: false,
    escalated: false,
  };
  const ev = event("disputed", "Dispute opened — the AI suggested a resolution for both sides to review.");
  const updated = await backend().patch(id, { status: "disputed", dispute, timeline: [...deal.timeline, ev], updatedAt: ev.at });
  return { ok: true, deal: updated ?? undefined, resolution };
}

export interface AcceptOutcome {
  ok: boolean;
  deal?: Deal;
  settled?: boolean;
  error?: string;
}

/**
 * A party accepts the AI's suggested resolution. Only when BOTH sides accept is
 * the money actually moved (and the deal settled). If a transfer fails at that
 * point, the deal stays "disputed" (settlement pending) rather than closing with
 * money frozen. `party` is "both" in demo mode (one local session stands in for
 * both sides), so a demo accept settles immediately.
 */
export async function acceptDispute(id: string, party: "buyer" | "seller" | "both"): Promise<AcceptOutcome> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  if (deal.status !== "disputed" || !deal.dispute?.resolution) {
    return { ok: false, error: "There's no open AI suggestion to accept on this deal." };
  }
  const suggestion = deal.dispute.resolution;
  const dispute: DealDispute = { ...deal.dispute };
  if (party === "buyer" || party === "both") dispute.buyerAccepted = true;
  if (party === "seller" || party === "both") dispute.sellerAccepted = true;

  if (!(dispute.buyerAccepted && dispute.sellerAccepted)) {
    const ev = event("disputed", `${party === "seller" ? "Seller" : "Buyer"} accepted the AI's suggested resolution. Waiting on the other side.`);
    const updated = await backend().patch(id, { dispute, timeline: [...deal.timeline, ev], updatedAt: ev.at });
    return { ok: true, deal: updated ?? undefined, settled: false };
  }

  // Both accepted → apply the suggestion to the money.
  const decision = suggestion.decision;
  const money = await settleByDecision(deal, decision, suggestion.splitBuyerPercent);
  if (!money.ok) {
    const note = event("disputed", "Both sides accepted, but the transfer failed — settlement pending, will retry.");
    const updated = await backend().patch(id, { dispute, timeline: [...deal.timeline, note], updatedAt: note.at });
    return { ok: false, deal: updated ?? undefined, error: money.error };
  }
  dispute.settledDecision = decision;
  const status = money.status as DealStatus;
  const timeline = [...deal.timeline, event(status, `Both sides accepted the AI suggestion — ${decisionNote(decision, suggestion.splitBuyerPercent)}.`)];
  (money.notes ?? []).forEach((n) => timeline.push(event(status, n)));
  const updated = await backend().patch(id, { status, dispute, payoutRef: money.payoutRef, partialRefundAmount: money.partialRefundAmount, timeline, updatedAt: timeline[timeline.length - 1].at });
  return { ok: true, deal: updated ?? undefined, settled: true };
}

/**
 * A party escalates to a human reviewer. The deal moves to "under_review" and
 * the funds stay locked until a reviewer settles it — no money moves here.
 */
export async function escalateDispute(id: string, party: "buyer" | "seller"): Promise<DisputeOutcome> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  if (deal.status !== "disputed") return { ok: false, error: "This deal isn't in an open dispute." };
  const dispute: DealDispute = { ...(deal.dispute as DealDispute), escalated: true, escalatedBy: party };
  const ev = event("under_review", `${party === "seller" ? "Seller" : "Buyer"} escalated to a human reviewer. Funds stay locked until it's resolved.`);
  const updated = await backend().patch(id, { status: "under_review", dispute, timeline: [...deal.timeline, ev], updatedAt: ev.at });
  return { ok: true, deal: updated ?? undefined };
}

/** Deals waiting on a human reviewer — the admin queue. */
export async function listUnderReview(): Promise<Deal[]> {
  const all = await backend().list();
  return all.filter((d) => d.status === "under_review").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * A human reviewer settles an escalated dispute with a final decision. Moves the
 * money via the same guarded path and records who ruled and why.
 */
export async function adminResolveDispute(
  id: string,
  decision: DisputeDecision,
  opts: { splitBuyerPercent?: number; note?: string; reviewer?: string } = {},
): Promise<DisputeOutcome> {
  const deal = await backend().get(id);
  if (!deal) return { ok: false, error: "not_found" };
  if (deal.status !== "under_review" && deal.status !== "disputed") {
    return { ok: false, error: "This deal isn't awaiting review." };
  }
  const split = opts.splitBuyerPercent ?? deal.dispute?.resolution?.splitBuyerPercent ?? 50;
  const money = await settleByDecision(deal, decision, split);
  if (!money.ok) return { ok: false, deal, error: money.error };
  const dispute: DealDispute = {
    ...(deal.dispute as DealDispute),
    escalated: true,
    reviewedBy: opts.reviewer ?? "Zafe reviewer",
    reviewNote: opts.note,
    settledDecision: decision,
  };
  const status = money.status as DealStatus;
  const timeline = [...deal.timeline, event(status, `Human reviewer ruled: ${decisionNote(decision, split)}${opts.note ? ` — ${opts.note}` : ""}.`)];
  (money.notes ?? []).forEach((n) => timeline.push(event(status, n)));
  const updated = await backend().patch(id, { status, dispute, payoutRef: money.payoutRef, partialRefundAmount: money.partialRefundAmount, timeline, updatedAt: timeline[timeline.length - 1].at });
  return { ok: true, deal: updated ?? undefined, resolution: deal.dispute?.resolution };
}
