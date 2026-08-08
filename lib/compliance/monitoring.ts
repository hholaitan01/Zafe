/* ==========================================================================
   Transaction monitoring — the deterministic AML rules that flag a deal for a
   compliance officer's attention. Pure functions over a deal, so they can run at
   read time (the admin AML queue) without any extra storage.

   Thresholds track the Money Laundering (Prevention & Prohibition) Act 2022 /
   NFIU reporting duties. These are decision-support flags, not automatic
   reports — a human confirms and files. Amounts are in naira.
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";

// NFIU single-transaction reporting thresholds.
export const CTR_INDIVIDUAL = 5_000_000; // ₦5m — natural person
export const CTR_CORPORATE = 10_000_000; // ₦10m — legal entity
export const LARGE_TXN = 1_000_000; // internal "large transaction" review line

export type FlagSeverity = "info" | "review" | "report";

export interface AmlFlag {
  code: string;
  severity: FlagSeverity;
  message: string;
}

/** The AML flags for a single deal, most severe first. */
export function assessDeal(deal: Deal): AmlFlag[] {
  const flags: AmlFlag[] = [];
  const amount = deal.item?.amount ?? 0;

  if (amount >= CTR_INDIVIDUAL) {
    flags.push({
      code: "ctr-threshold",
      severity: "report",
      message: `Single transaction ₦${amount.toLocaleString("en-NG")} is at or above the ₦5m reporting threshold — a currency-transaction report to the NFIU may be due within 7 days.`,
    });
  } else if (amount >= LARGE_TXN) {
    flags.push({
      code: "large-transaction",
      severity: "review",
      message: `Large transaction (₦${amount.toLocaleString("en-NG")}) — review the parties and source of funds.`,
    });
  }

  if (deal.trust?.verdict === "risky") {
    flags.push({ code: "ai-risky", severity: "review", message: `AI Trust Score flagged this deal as risky${deal.trust.headline ? `: ${deal.trust.headline}` : "."}` });
  }

  if (deal.dispute?.settledDecision === "refund_buyer" || deal.dispute?.settledDecision === "split") {
    flags.push({ code: "dispute-lost", severity: "info", message: "Dispute settled against the seller — factor into the seller's risk profile." });
  }

  const order: Record<FlagSeverity, number> = { report: 0, review: 1, info: 2 };
  return flags.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** The single highest severity across a deal's flags, or null if none. */
export function topSeverity(deal: Deal): FlagSeverity | null {
  const f = assessDeal(deal);
  return f.length ? f[0].severity : null;
}
