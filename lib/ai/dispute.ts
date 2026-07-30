/* ==========================================================================
   Feature 3 — Dispute judge.
   Weighs both sides' evidence and decides: pay the seller, refund the buyer,
   or split. Uses higher reasoning effort than the scoring endpoints.
   ========================================================================== */

import { AI_MODEL, aiEnabled, clampScore, runStructured } from "./client";
import { mockDispute } from "./mock";
import { DISPUTE_SYSTEM } from "./prompts";
import type { DisputeRequest, DisputeResult } from "./types";

const SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["decision", "splitBuyerPercent", "confidence", "rationale", "buyerPoints", "sellerPoints", "recommendedAction"],
  properties: {
    decision: { type: "string", enum: ["release_to_seller", "refund_buyer", "split"] },
    splitBuyerPercent: { type: "integer", description: "Buyer's share 0–100; only used when decision is split" },
    confidence: { type: "integer", description: "0–100" },
    rationale: { type: "string" },
    buyerPoints: { type: "array", items: { type: "string" } },
    sellerPoints: { type: "array", items: { type: "string" } },
    recommendedAction: { type: "string" },
  },
};

function buildUser(req: DisputeRequest): string {
  const amount = req.amount ?? req.item?.amount;
  return [
    "Decide this escrow dispute.",
    "",
    req.item ? `ITEM: ${req.item.title ?? "unknown"}` : "ITEM: unknown",
    `AMOUNT HELD: ${req.item?.currency ?? "NGN"} ${amount ?? "unknown"}`,
    "",
    "BUYER'S SIDE:",
    `- claim: ${req.buyer?.claim ?? "(none given)"}`,
    `- evidence: ${(req.buyer?.evidence ?? []).join("; ") || "(none)"}`,
    "",
    "SELLER'S SIDE:",
    `- claim: ${req.seller?.claim ?? "(none given)"}`,
    `- evidence: ${(req.seller?.evidence ?? []).join("; ") || "(none)"}`,
    "",
    req.chat ? `DEAL CHAT:\n${req.chat.trim()}` : "DEAL CHAT: (not provided)",
  ].join("\n");
}

export async function getDisputeDecision(req: DisputeRequest): Promise<DisputeResult> {
  if (!aiEnabled()) return mockDispute(req);

  try {
    const raw = await runStructured<Omit<DisputeResult, "mode">>({
      system: DISPUTE_SYSTEM,
      user: buildUser(req),
      schema: SCHEMA,
      effort: "high",
      maxTokens: 16000,
    });
    return {
      ...raw,
      splitBuyerPercent: clampScore(raw.splitBuyerPercent, 0),
      confidence: clampScore(raw.confidence),
      mode: "live",
    };
  } catch (err) {
    console.error(`[dispute] live call failed (${AI_MODEL}), using mock:`, err);
    return { ...mockDispute(req), mode: "mock-fallback" };
  }
}
