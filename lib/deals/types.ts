/* ==========================================================================
   The deal (escrow) data model — H2O's Day-2 lane: "create a deal + save it.
   Amount, item, seller, and the pasted chat all get stored."

   A deal is the whole life of one escrow transaction, from created → funded →
   shipped → completed (or disputed → refunded). The Trust Score for the deal
   is computed and stored at creation so the Dashboard and Trust Score screens
   can read it straight off the deal.
   ========================================================================== */

import type { SellerProfile, TrustVerdict } from "@/lib/ai/types";

export type DealStatus =
  | "created" // deal made, money not yet paid in
  | "funded" // buyer paid into escrow
  | "shipped" // seller dispatched the item
  | "completed" // buyer confirmed, seller paid out
  | "disputed" // the two disagree
  | "refunded"; // money returned to the buyer

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

export interface Deal {
  id: string;
  /** Human-friendly reference shown in the UI, e.g. "TF-8A3K". */
  reference: string;
  item: { title: string; amount: number; currency: string };
  seller: SellerProfile & { id?: string };
  buyerEmail?: string;
  /** The pasted buyer/seller chat, kept for the Trust Score and any dispute. */
  chat?: string;
  status: DealStatus;
  trust?: DealTrust;
  timeline: TimelineEvent[];
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
