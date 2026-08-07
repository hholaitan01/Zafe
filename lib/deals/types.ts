/* ==========================================================================
   The deal (escrow) data model — H2O's Day-2 lane: "create a deal + save it.
   Amount, item, seller, and the pasted chat all get stored."

   A deal is the whole life of one escrow transaction, from created → funded →
   shipped → completed (or disputed → refunded). The Trust Score for the deal
   is computed and stored at creation so the Dashboard and Trust Score screens
   can read it straight off the deal.
   ========================================================================== */

import type { DisputeDecision, DisputeResult, SellerProfile, TrustVerdict } from "@/lib/ai/types";

export type DealStatus =
  | "created" // deal made, money not yet paid in
  | "funded" // buyer paid into escrow
  | "shipped" // seller dispatched the item
  | "completed" // buyer confirmed, seller paid out
  | "disputed" // the two disagree; AI has suggested, awaiting both sides
  | "under_review" // escalated to a human reviewer; funds stay locked
  | "refunded" // money returned to the buyer
  | "resolved"; // dispute settled (e.g. a split)

export interface TimelineEvent {
  at: string; // ISO timestamp
  status: DealStatus;
  label: string;
  note?: string;
}

/** A compact Trust Score snapshot stored on the deal. */
export interface DealTrust {
  score: number;
  verdict: TrustVerdict;
  headline: string;
}

/**
 * A dispute raised on a deal. The AI proposes a `resolution` (a SUGGESTION, not
 * a verdict): both parties can accept it, and only when both do is the money
 * moved. If either party escalates, the deal goes to `under_review` and a human
 * reviewer settles it — recorded in `reviewedBy` / `reviewNote`.
 */
export interface DealDispute {
  openedAt: string;
  reason?: string;
  buyer: { claim: string; evidence?: string[] };
  seller: { claim: string; evidence?: string[] };
  /** The AI's suggested resolution. Applied only once both sides accept it. */
  resolution?: DisputeResult;
  buyerAccepted?: boolean;
  sellerAccepted?: boolean;
  escalated?: boolean;
  escalatedBy?: "buyer" | "seller";
  /** Set when a human reviewer settles an escalated dispute. */
  reviewedBy?: string;
  reviewNote?: string;
  /** The decision that actually moved the money (accepted suggestion or admin ruling). */
  settledDecision?: DisputeDecision;
}

/** A bank account for a payout or refund (ALAT Wallet). */
export interface PayoutAccount {
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  /** BVN/NIN verified — required before a seller can be paid. */
  verified?: boolean;
}

export interface Deal {
  id: string;
  /** Human-friendly reference shown in the UI, e.g. "TF-8A3K". Also the ALATPay orderId. */
  reference: string;
  item: { title: string; amount: number; currency: string };
  seller: SellerProfile & { id?: string };
  buyerEmail?: string;
  /** The pasted buyer/seller chat, kept for the Trust Score and any dispute. */
  chat?: string;
  status: DealStatus;
  trust?: DealTrust;
  /** The buyer's secret handover code — the seller is only paid once it's used. */
  handoverCode?: string;
  /** After delivery, money auto-releases at this time if the buyer goes silent. */
  autoReleaseAt?: string;
  dispute?: DealDispute;
  timeline: TimelineEvent[];

  /* ---- ALAT payments (Jerry's rails) --------------------------------- */
  /** The buyer's one-time ALATPay collection account. */
  alatVirtualAccount?: string;
  alatAccountExpiresAt?: string;
  /** ALATPay's own transaction id, for status re-queries. */
  alatTransactionId?: string;
  /** ALAT Wallet reference for the payout/refund that moved the money. */
  payoutRef?: string;
  /** Buyer's share paid back on a split ruling. */
  partialRefundAmount?: number;
  /** Where the seller is paid; where the buyer is refunded. */
  sellerPayout?: PayoutAccount;
  buyerPayout?: PayoutAccount;

  createdAt: string;
  updatedAt: string;
}

/** What the front end sends to create a deal. */
export interface CreateDealInput {
  item: { title: string; amount: number; currency?: string };
  seller: SellerProfile & { id?: string };
  chat?: string;
  buyerEmail?: string;
}

export type DealBackend = "supabase" | "demo";
