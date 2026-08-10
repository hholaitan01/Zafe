/* ==========================================================================
   AI accuracy runner. Feeds the labelled cases (cases.ts) through the real AI
   functions and reports how many it gets wrong — per feature and overall.

   Run it:  npm run eval:ai
   - No ANTHROPIC_API_KEY  → scores the offline heuristic (a deterministic baseline)
   - Key + credits set     → scores real Claude

   Exits non-zero if anything fails, so it can double as a CI check later.
   ========================================================================== */

import { aiEnabled } from "../client";
import { getDisputeDecision } from "../dispute";
import { getScamCheck } from "../scam-check";
import { getTrustScore } from "../trust-score";
import { DISPUTE_CASES, SCAM_CASES, TRUST_CASES } from "./cases";

interface Line {
  name: string;
  pass: boolean;
  got: string;
  want: string;
}

function tally(lines: Line[]): { pass: number; total: number } {
  return { pass: lines.filter((l) => l.pass).length, total: lines.length };
}

function printSection(title: string, lines: Line[]): number {
  const { pass, total } = tally(lines);
  console.log(`\n${title}  —  ${pass}/${total} correct`);
  for (const l of lines) {
    const mark = l.pass ? "  ok " : "  XX ";
    const detail = l.pass ? "" : `   (got ${l.got}, expected ${l.want})`;
    console.log(`${mark}${l.name}${detail}`);
  }
  return total - pass; // mistakes
}

async function run(): Promise<void> {
  console.log(`Zafe accuracy — mode: ${aiEnabled() ? "LIVE (Claude)" : "MOCK (offline heuristic)"}`);

  // ---- Scam detector (binary) ----
  const scamLines: Line[] = [];
  for (const c of SCAM_CASES) {
    const r = await getScamCheck({ text: c.text });
    scamLines.push({ name: c.name, pass: r.isScam === c.expectScam, got: String(r.isScam), want: String(c.expectScam) });
  }

  // ---- Trust Score (verdict band) ----
  const trustLines: Line[] = [];
  for (const c of TRUST_CASES) {
    const r = await getTrustScore({ chat: c.chat, seller: c.seller });
    trustLines.push({ name: c.name, pass: c.expect.includes(r.verdict), got: `${r.verdict}(${r.score})`, want: c.expect.join("|") });
  }

  // ---- Dispute judge (decision) ----
  const disputeLines: Line[] = [];
  for (const c of DISPUTE_CASES) {
    const r = await getDisputeDecision({ buyer: c.buyer, seller: c.seller });
    disputeLines.push({ name: c.name, pass: c.expect.includes(r.decision), got: r.decision, want: c.expect.join("|") });
  }

  const mistakes =
    printSection("Scam detector", scamLines) +
    printSection("Trust Score", trustLines) +
    printSection("Dispute judge", disputeLines);

  const total = scamLines.length + trustLines.length + disputeLines.length;
  const correct = total - mistakes;
  const pct = ((correct / total) * 100).toFixed(0);
  console.log(`\n================================`);
  console.log(`Overall: ${correct}/${total} correct (${pct}%) — ${mistakes} mistake${mistakes === 1 ? "" : "s"}`);
  console.log(`================================\n`);

  process.exit(mistakes === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("eval failed:", err);
  process.exit(2);
});
