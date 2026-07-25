/* ==========================================================================
   Feature 1 — Trust Score.
   Reads a pasted chat + seller history, returns a 0–100 score with reasons.
   Live (Claude) when a key is set; deterministic heuristic otherwise, and a
   graceful fallback to that heuristic if a live call fails mid-demo.
   ========================================================================== */

import { AI_MODEL, aiEnabled, clampScore, runStructured } from "./client";
import { mockTrustScore } from "./mock";
import { TRUST_SCORE_SYSTEM } from "./prompts";
import type { TrustScoreRequest, TrustScoreResult } from "./types";

const SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["score", "verdict", "headline", "reasons", "redFlags", "recommendation"],
  properties: {
    score: { type: "integer", description: "0–100, higher is safer" },
    verdict: { type: "string", enum: ["safe", "caution", "risky"] },
    headline: { type: "string" },
    reasons: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "detail", "weight"],
        properties: {
          label: { type: "string" },
          detail: { type: "string" },
          weight: { type: "string", enum: ["positive", "negative", "neutral"] },
        },
      },
    },
    redFlags: { type: "array", items: { type: "string" } },
    recommendation: { type: "string" },
  },
};

function buildUser(req: TrustScoreRequest): string {
  const seller = req.seller ?? {};
  return [
    "Score this deal for the buyer.",
    "",
    "SELLER:",
    `- name: ${seller.name ?? "unknown"}`,
    `- identity verified (BVN/NIN): ${seller.verified ?? "unknown"}`,
    `- completed deals: ${seller.completedDeals ?? "unknown"}`,
    `- past disputes: ${seller.disputes ?? "unknown"}`,
    `- account age (days): ${seller.accountAgeDays ?? "unknown"}`,
    `- rating (0-5): ${seller.rating ?? "unknown"}`,
    "",
    req.item ? `ITEM: ${req.item.title ?? "unknown"} — ${req.item.currency ?? "NGN"} ${req.item.amount ?? "?"}` : "ITEM: unknown",
    "",
    "CHAT (buyer/seller messages):",
    req.chat?.trim() || "(no chat provided)",
  ].join("\n");
}

export async function getTrustScore(req: TrustScoreRequest): Promise<TrustScoreResult> {
  if (!aiEnabled()) return mockTrustScore(req);

  try {
    const raw = await runStructured<Omit<TrustScoreResult, "mode">>({
      system: TRUST_SCORE_SYSTEM,
      user: buildUser(req),
      schema: SCHEMA,
      effort: "low",
    });
    return { ...raw, score: clampScore(raw.score), mode: "live" };
  } catch (err) {
    console.error(`[trust-score] live call failed (${AI_MODEL}), using mock:`, err);
    return { ...mockTrustScore(req), mode: "mock-fallback" };
  }
}
