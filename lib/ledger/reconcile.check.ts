/* ==========================================================================
   Self-check for the reconciliation cross-check and the settlement exception
   queue. Pure logic only (no live keys, no network).
   Run: `npx tsx lib/ledger/reconcile.check.ts`.
   ========================================================================== */

// Force the demo (in-memory) stores so this check hits no network. Dynamic
// imports below run AFTER this, so the modules capture the cleared env.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

import type { Deal, DealStatus } from "@/lib/deals/types";
import type { LedgerEntry, LedgerKind } from "./types";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

function deal(id: string, status: DealStatus): Deal {
  return { id, status, item: { title: "x", amount: 1000 } } as unknown as Deal;
}
function entry(dealId: string, kind: LedgerKind): LedgerEntry {
  return { ref: `${kind}:${dealId}`, dealId, kind, legs: [], createdAt: "" };
}
function codes(list: { code: string }[]): string[] {
  return list.map((d) => d.code).sort();
}

async function main() {
  const { reconcileDeals } = await import("./reconcile");
  const settlement = await import("@/lib/payments/settlement");

  // --- clean lifecycles produce no discrepancies ---
  assert("completed with fund+payout is clean", reconcileDeals(
    [deal("c1", "completed")], [entry("c1", "fund"), entry("c1", "payout")],
  ).length === 0);
  assert("refunded with fund+refund is clean", reconcileDeals(
    [deal("r1", "refunded")], [entry("r1", "fund"), entry("r1", "refund")],
  ).length === 0);
  assert("resolved with fund+refund+payout is clean", reconcileDeals(
    [deal("s1", "resolved")], [entry("s1", "fund"), entry("s1", "refund"), entry("s1", "payout")],
  ).length === 0);
  assert("created with no entries is clean", reconcileDeals([deal("n1", "created")], []).length === 0);

  // --- missing money-moves are flagged ---
  assert("completed without payout → missing_payout", codes(reconcileDeals(
    [deal("c2", "completed")], [entry("c2", "fund")],
  )).includes("missing_payout"));
  assert("funded without fund entry → missing_fund", codes(reconcileDeals(
    [deal("f1", "funded")], [],
  )).includes("missing_fund"));
  assert("refunded without refund → missing_refund", codes(reconcileDeals(
    [deal("r2", "refunded")], [entry("r2", "fund")],
  )).includes("missing_refund"));
  assert("resolved without refund → missing_refund", codes(reconcileDeals(
    [deal("s2", "resolved")], [entry("s2", "fund")],
  )).includes("missing_refund"));

  // --- double-settle drift is flagged ---
  assert("refunded that also paid out → unexpected_payout", codes(reconcileDeals(
    [deal("r3", "refunded")], [entry("r3", "fund"), entry("r3", "refund"), entry("r3", "payout")],
  )).includes("unexpected_payout"));
  assert("completed that also refunded → unexpected_refund", codes(reconcileDeals(
    [deal("c3", "completed")], [entry("c3", "fund"), entry("c3", "payout"), entry("c3", "refund")],
  )).includes("unexpected_refund"));

  // --- settlement exception queue: failed shows, succeeded and fresh-pending don't ---
  settlement._resetSettlements();
  const kFail = settlement.settlementKey("payout", "x-fail");
  await settlement.beginSettlement(kFail, { dealId: "x-fail", kind: "payout" });
  await settlement.failSettlement(kFail, "provider down");

  const kDone = settlement.settlementKey("payout", "x-done");
  await settlement.beginSettlement(kDone, { dealId: "x-done", kind: "payout" });
  await settlement.completeSettlement(kDone, "ref-ok");

  const kFresh = settlement.settlementKey("refund", "x-fresh");
  await settlement.beginSettlement(kFresh, { dealId: "x-fresh", kind: "refund" }); // pending, not stale

  const exceptions = await settlement.listSettlementExceptions();
  const keys = exceptions.map((e) => e.key);
  assert("exception queue includes the failed move", keys.includes(kFail));
  assert("exception queue excludes the succeeded move", !keys.includes(kDone));
  assert("exception queue excludes a fresh pending move", !keys.includes(kFresh));

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
