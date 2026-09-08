/* ==========================================================================
   Self-check for the settlement-operation model. Pure logic only (no live keys,
   no network): the in-memory claim store, its retry/short-circuit semantics, and
   the payout/refund integration that never moves money twice.
   Run: `npx tsx lib/payments/settlement.check.ts`.
   ========================================================================== */

// Force the demo (in-memory) stores so this check hits no network. Dynamic
// imports below run AFTER this, so the modules capture the cleared env.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.PAYMENTS_PROVIDER;
delete process.env.PAYSTACK_SECRET_KEY;
delete process.env.FLUTTERWAVE_SECRET_KEY;

import type { Deal } from "@/lib/deals/types";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}`);
  }
}

/** A minimal deal good enough for the mock money path (id + amount are all it reads). */
function deal(id: string, amount = 100000): Deal {
  return { id, item: { title: "Test item", amount } } as unknown as Deal;
}

async function main() {
  const settlement = await import("./settlement");
  const { beginSettlement, completeSettlement, failSettlement, getSettlement, settlementKey, reconcileAction, _resetSettlements } = settlement;
  const { payoutSeller, refundBuyer } = await import("./index");
  const ledger = await import("@/lib/ledger/store");

  // --- claim primitive: first wins, second is in-flight ---
  _resetSettlements();
  const k = settlementKey("payout", "s1");
  const c1 = await beginSettlement(k, { dealId: "s1", kind: "payout" });
  assert("first claim proceeds", c1.proceed === true);
  const c2 = await beginSettlement(k, { dealId: "s1", kind: "payout" });
  assert("second concurrent claim is in-flight", c2.proceed === false && c2.reason === "in_flight");

  // --- a failed attempt is retryable ---
  await failSettlement(k, "provider timeout");
  const failedRec = await getSettlement(k);
  assert("failed attempt is recorded as failed", failedRec?.state === "failed");
  const attemptsBefore = failedRec?.attempts ?? 0; // capture the number, not the live ref
  const c3 = await beginSettlement(k, { dealId: "s1", kind: "payout" });
  assert("retry after failure proceeds", c3.proceed === true);
  assert("attempts increments on reclaim", ((await getSettlement(k))?.attempts ?? 0) > attemptsBefore);
  // A reclaim flags what it took over, so the money path knows to reconcile
  // with the provider before re-sending.
  assert("reclaim of a failed op reports reclaimedFrom=failed", c3.proceed === true && c3.reclaimedFrom === "failed");

  // --- a FRESH first claim carries no reclaimedFrom (nothing to reconcile) ---
  const fresh = await beginSettlement(settlementKey("payout", "s1-fresh"), { dealId: "s1-fresh", kind: "payout" });
  assert("fresh claim has no reclaimedFrom", fresh.proceed === true && fresh.reclaimedFrom === undefined);

  // --- reconcile action mapping: never re-transfer on an ambiguous status ---
  assert("provider succeeded → settled (do not re-send)", reconcileAction("succeeded") === "settled");
  assert("provider failed → retry (safe to send)", reconcileAction("failed") === "retry");
  assert("provider pending → hold", reconcileAction("pending") === "hold");
  assert("provider unknown → hold (never re-send on ambiguity)", reconcileAction("unknown") === "hold");

  // --- a succeeded attempt short-circuits with its ref, never re-transfers ---
  await completeSettlement(k, "ref-123");
  const c4 = await beginSettlement(k, { dealId: "s1", kind: "payout" });
  assert("claim after success short-circuits", c4.proceed === false && c4.reason === "succeeded");
  assert("short-circuit carries the recorded ref", c4.proceed === false && c4.reason === "succeeded" && c4.ref === "ref-123");

  // --- payout and refund on one deal are separately keyed ---
  _resetSettlements();
  const pk = settlementKey("payout", "s2");
  const rk = settlementKey("refund", "s2");
  assert("payout/refund keys differ for one deal", pk !== rk);
  const pc = await beginSettlement(pk, { dealId: "s2", kind: "payout" });
  const rc = await beginSettlement(rk, { dealId: "s2", kind: "refund" });
  assert("both payout and refund can be claimed on one deal", pc.proceed === true && rc.proceed === true);

  // --- integration: a repeated payout moves money once ---
  _resetSettlements();
  ledger._resetMemory();
  const d1 = deal("pay-1");
  const first = await payoutSeller(d1);
  assert("first payout succeeds", first.ok === true);
  const repeat = await payoutSeller(d1);
  assert("repeat payout still returns ok (short-circuit)", repeat.ok === true);
  assert("repeat payout does not post a second ledger entry", (await ledger.entriesForDeal("pay-1")).length === 1);

  // --- integration: concurrent payouts fire exactly one transfer ---
  _resetSettlements();
  ledger._resetMemory();
  const d2 = deal("pay-2");
  const results = await Promise.all([payoutSeller(d2), payoutSeller(d2), payoutSeller(d2), payoutSeller(d2), payoutSeller(d2)]);
  const okCount = results.filter((r) => r.ok).length;
  assert("concurrent payouts: exactly one proceeds", okCount === 1);
  assert("concurrent payouts: exactly one ledger entry", (await ledger.entriesForDeal("pay-2")).length === 1);

  // --- integration: a repeated refund moves money once ---
  _resetSettlements();
  ledger._resetMemory();
  const d3 = deal("ref-1");
  const r1 = await refundBuyer(d3);
  const r2 = await refundBuyer(d3);
  assert("first refund succeeds", r1.ok === true);
  assert("repeat refund short-circuits ok", r2.ok === true);
  assert("repeat refund does not post a second ledger entry", (await ledger.entriesForDeal("ref-1")).length === 1);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
