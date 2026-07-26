/* ==========================================================================
   The deal store the routes use. Picks the Supabase or demo implementation
   from config, and — the bit that ties H2O's two pieces together — computes a
   Trust Score for the deal at creation time and stores it, so every deal
   carries its own AI risk read.
   ========================================================================== */

import { getTrustScore } from "@/lib/ai/trust-score";
import { dealBackend } from "./config";
import { demoStore } from "./demo-store";
import { supabaseStore } from "./supabase-store";
import type { CreateDealInput, Deal, DealStatus, DealTrust } from "./types";

function backend() {
  return dealBackend() === "supabase" ? supabaseStore : demoStore;
}

export function listDeals(): Promise<Deal[]> {
  return backend().list();
}

export function getDeal(id: string): Promise<Deal | null> {
  return backend().get(id);
}

export function setDealStatus(id: string, status: DealStatus, note?: string): Promise<Deal | null> {
  return backend().setStatus(id, status, note);
}

/**
 * Create a deal and store it. If the buyer pasted a chat, we run the Trust
 * Score first (live or mock, per the AI layer) and save a snapshot on the deal.
 */
export async function createDeal(input: CreateDealInput): Promise<Deal> {
  let trust: DealTrust | undefined;
  if (input.chat && input.chat.trim()) {
    try {
      const result = await getTrustScore({ chat: input.chat, seller: input.seller, item: input.item });
      trust = { score: result.score, verdict: result.verdict, headline: result.headline };
    } catch {
      // Never block deal creation on the score — it can be recomputed later.
      trust = undefined;
    }
  }
  return backend().create(input, trust);
}
