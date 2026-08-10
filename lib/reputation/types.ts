/* ==========================================================================
   The trader reputation model — a real, per-user standing computed from a
   trader's own escrow history.

   This is NOT the per-deal Trust Score (that scores a *counterparty* from a
   single chat). Reputation is *your* accumulated standing across every deal
   you've run on Zafe: settle deals cleanly and it rises; rack up disputes
   and it falls. It's deterministic and fully explainable — every point is
   attributed to a factor — so it can be shown to a counterparty and defended.
   ========================================================================== */

export type ReputationTier = "new" | "building" | "trusted" | "highly_trusted";

/** One line of the score breakdown. The factors sum to `score`. */
export interface ReputationFactor {
  key: string;
  label: string; // e.g. "Completed deals"
  detail: string; // e.g. "8 deals settled cleanly"
  points: number; // signed contribution to the score
}

/** The raw signals the engine reads off a trader's deals. */
export interface ReputationStats {
  total: number; // deals the trader has run
  completed: number; // settled cleanly (completed or resolved)
  disputed: number; // ever went to dispute
  disputesLost: number; // dispute judged against them
  disputesWon: number; // dispute judged in their favour
  volume: number; // total value transacted on settled deals (NGN)
  onTimeRate: number; // share of settled deals confirmed by the buyer (not auto-released)
  tenureDays: number; // days since their first deal
}

export interface Reputation {
  email: string;
  score: number; // 0–100
  tier: ReputationTier;
  tierLabel: string; // human label for the tier
  factors: ReputationFactor[]; // transparent breakdown (sums to score)
  stats: ReputationStats;
  summary?: string; // one-line natural-language standing (AI or heuristic)
  updatedAt: string; // ISO
}
