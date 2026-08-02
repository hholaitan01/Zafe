/* ==========================================================================
   A one-line, human-readable summary of a trader's standing.

   Same seam as the rest of the AI layer: if ANTHROPIC_API_KEY is set we ask
   Claude to phrase it; otherwise (or on any error) we fall back to a
   deterministic heuristic sentence, so the dashboard always has copy and never
   blocks on a key or the network. The *number* is never the model's job — the
   engine owns the score; Claude only narrates it.
   ========================================================================== */

import { aiEnabled, runStructured } from "@/lib/ai/client";
import type { Reputation } from "./types";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string", description: "One warm, factual sentence (max ~18 words) summarising the trader's standing." },
  },
  required: ["summary"],
} as const;

export async function reputationSummary(rep: Reputation): Promise<string> {
  if (aiEnabled()) {
    try {
      const { stats, score, tierLabel } = rep;
      const user = [
        `Score: ${score}/100 (${tierLabel}).`,
        `Deals: ${stats.total}, completed cleanly: ${stats.completed}, disputes: ${stats.disputed} (lost ${stats.disputesLost}).`,
        `Value transacted: ₦${Math.round(stats.volume).toLocaleString("en-NG")}. On-time rate: ${Math.round(stats.onTimeRate * 100)}%. Tenure: ${stats.tenureDays} days.`,
      ].join(" ");
      const out = await runStructured<{ summary: string }>({
        system:
          "You write a single encouraging, factual sentence summarising a peer-to-peer trader's reputation on an escrow app. No emojis, no hype, no numbers the data doesn't support. Speak to the trader in second person.",
        user,
        schema: SCHEMA,
        effort: "low",
        maxTokens: 300,
      });
      const s = out.summary?.trim();
      if (s) return s;
    } catch {
      /* fall through to the heuristic */
    }
  }
  return heuristicSummary(rep);
}

/** Offline phrasing — used with no key, or if the model call fails. */
export function heuristicSummary(rep: Reputation): string {
  const { stats, tier } = rep;
  if (stats.total === 0) return "Run your first escrow deal to start building your reputation.";
  if (tier === "highly_trusted") return `Excellent standing. ${stats.completed} clean deals and a spotless recent record.`;
  if (tier === "trusted") return `Solid track record: ${stats.completed} deals settled cleanly. Keep it up to reach the top tier.`;
  if (stats.disputed > 0) return `${stats.completed} clean deal${stats.completed === 1 ? "" : "s"} so far; resolving disputes fairly will lift your score.`;
  return "You're building trust. Every safe deal you complete raises your score.";
}
