/* ==========================================================================
   The reputation scoring engine — a pure, deterministic function from a
   trader's deals to their standing. No AI, no randomness: the same history
   always yields the same score, and every point is attributed to a factor so
   the number can be explained and defended.

   Design of the model (weights chosen to be legible, not magic):

     Starting standing ............ +60   every trader starts here
     Completed deals .............. +6 each, capped +30
     Value transacted ............. +3 per ₦250k settled, capped +12
     On-time confirmations ........ up to +6 (buyers confirming, not auto-release)
     Tenure ....................... +1 per month, capped +6
     Dispute rate ................. up to −40 (share of deals that went to dispute)
     Disputes lost ................ −8 each, capped −24 (judged against them)

   The factors sum to the final score, which is clamped to 0–100. A trader with
   no history sits at the 60 baseline but is tiered "new" until they transact.
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";
import type { Reputation, ReputationFactor, ReputationStats, ReputationTier } from "./types";

const BASE = 60;

/** Read the raw signals off a trader's deals. `now` lets callers compute the
    stats as of a past moment (for the real score history), defaulting to today. */
export function computeStats(deals: Deal[], now: number = Date.now()): ReputationStats {
  let completed = 0;
  let disputed = 0;
  let disputesLost = 0;
  let disputesWon = 0;
  let volume = 0;
  let confirmedByBuyer = 0;
  let earliest = Number.POSITIVE_INFINITY;

  for (const d of deals) {
    const created = new Date(d.createdAt).getTime();
    if (Number.isFinite(created)) earliest = Math.min(earliest, created);

    const settled = d.status === "completed" || d.status === "resolved";
    if (settled) {
      completed += 1;
      volume += d.item?.amount ?? 0;
      // "On time" = the buyer actively confirmed with their handover code,
      // rather than the money auto-releasing after they went silent.
      const auto = d.timeline?.some((e) => e.status === "completed" && /auto-released/i.test(e.note ?? ""));
      if (!auto) confirmedByBuyer += 1;
    }

    // A deal that ever went to dispute (current status, or a recorded dispute).
    if (d.status === "disputed" || d.dispute) {
      disputed += 1;
      const decision = d.dispute?.resolution?.decision;
      if (decision === "release_to_seller") disputesLost += 1; // buyer's claim rejected
      else if (decision === "refund_buyer" || decision === "split") disputesWon += 1;
    }
  }

  const total = deals.length;
  const tenureDays = earliest === Number.POSITIVE_INFINITY ? 0 : Math.max(0, Math.floor((now - earliest) / 86_400_000));
  const onTimeRate = completed > 0 ? confirmedByBuyer / completed : 0;

  return { total, completed, disputed, disputesLost, disputesWon, volume, onTimeRate, tenureDays };
}

function tierFor(score: number, total: number): { tier: ReputationTier; label: string } {
  if (total === 0) return { tier: "new", label: "New trader. Build your history" };
  if (score >= 85) return { tier: "highly_trusted", label: "Highly trusted trader" };
  if (score >= 70) return { tier: "trusted", label: "Trusted trader" };
  if (score >= 55) return { tier: "building", label: "Building trust" };
  return { tier: "new", label: "New trader" };
}

/** Score a trader from their deals. Deterministic and fully attributable. Pass
    `now` to score the trader as of a past moment (used to plot the real Trust
    Score history). */
export function scoreReputation(email: string, deals: Deal[], now: number = Date.now()): Reputation {
  const stats = computeStats(deals, now);
  const factors: ReputationFactor[] = [{ key: "base", label: "Starting standing", detail: "Every trader starts at 60", points: BASE }];

  const completedPts = Math.min(30, stats.completed * 6);
  if (stats.completed > 0) {
    factors.push({
      key: "completed",
      label: "Completed deals",
      detail: `${stats.completed} deal${stats.completed === 1 ? "" : "s"} settled cleanly`,
      points: completedPts,
    });
  }

  const volumePts = Math.min(12, Math.floor(stats.volume / 250_000) * 3);
  if (volumePts > 0) {
    factors.push({ key: "volume", label: "Value transacted", detail: `${formatNaira(stats.volume)} settled through escrow`, points: volumePts });
  }

  const onTimePts = stats.completed > 0 ? Math.round(stats.onTimeRate * 6) : 0;
  if (onTimePts > 0) {
    factors.push({ key: "on_time", label: "On-time confirmations", detail: `${Math.round(stats.onTimeRate * 100)}% confirmed without auto-release`, points: onTimePts });
  }

  const tenurePts = Math.min(6, Math.floor(stats.tenureDays / 30));
  if (tenurePts > 0) {
    factors.push({ key: "tenure", label: "Account tenure", detail: `${stats.tenureDays} days trading on TrustFlow`, points: tenurePts });
  }

  if (stats.total > 0 && stats.disputed > 0) {
    const rate = stats.disputed / stats.total;
    const disputePenalty = -Math.round(rate * 40);
    factors.push({
      key: "dispute_rate",
      label: "Dispute rate",
      detail: `${stats.disputed} of ${stats.total} deals went to dispute`,
      points: disputePenalty,
    });
  }

  const lostPenalty = -Math.min(24, stats.disputesLost * 8);
  if (lostPenalty < 0) {
    factors.push({ key: "disputes_lost", label: "Disputes lost", detail: `${stats.disputesLost} ruled against you`, points: lostPenalty });
  }

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.max(0, Math.min(100, raw));
  const { tier, label } = tierFor(score, stats.total);

  return { email, score, tier, tierLabel: label, factors, stats, updatedAt: new Date().toISOString() };
}

function formatNaira(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}
