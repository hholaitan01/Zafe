/* ==========================================================================
   Self-check for the lifecycle transition matrix (audit P0 #3/#4) and funding
   verification (P0 #2). Pure logic only.
   Run: `npx tsx lib/deals/transitions.check.ts`.
   ========================================================================== */

export {}; // module scope (shares helper names with other check scripts)

delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

import type { Deal } from "./types";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const { canTransition, isTerminal } = await import("./transitions");
  const { verifyFunding } = await import("@/lib/payments/funding");

  // --- valid forward moves ---
  assert("created → funded", canTransition("created", "funded"));
  assert("funded → shipped", canTransition("funded", "shipped"));
  assert("shipped → completed", canTransition("shipped", "completed"));
  assert("funded → disputed", canTransition("funded", "disputed"));
  assert("disputed → under_review", canTransition("disputed", "under_review"));
  assert("under_review → resolved", canTransition("under_review", "resolved"));
  assert("same-state is an idempotent no-op", canTransition("funded", "funded"));

  // --- settled states are terminal for funding (P0 #4) ---
  assert("completed → funded rejected", !canTransition("completed", "funded"));
  assert("refunded → funded rejected", !canTransition("refunded", "funded"));
  assert("resolved → funded rejected", !canTransition("resolved", "funded"));
  assert("completed is terminal", isTerminal("completed") && isTerminal("refunded") && isTerminal("resolved"));
  assert("funded is not terminal", !isTerminal("funded"));

  // --- backward / illegal moves rejected ---
  assert("funded → created rejected (backward)", !canTransition("funded", "created"));
  assert("created → shipped rejected (skips funding)", !canTransition("created", "shipped"));
  assert("completed → shipped rejected", !canTransition("completed", "shipped"));

  // --- funding verification (P0 #2) ---
  const deal = { item: { title: "x", amount: 100000, currency: "NGN" } } as unknown as Deal;
  // collectionAmount(100000) = 100000 + buyer's fee half (1000) = 101000
  assert("exact expected amount funds", verifyFunding(deal, { amountNaira: 101000, currency: "NGN" }).ok);
  assert("overpayment funds", verifyFunding(deal, { amountNaira: 200000, currency: "NGN" }).ok);
  assert("underpayment rejected", !verifyFunding(deal, { amountNaira: 100999, currency: "NGN" }).ok);
  assert("wrong currency rejected", !verifyFunding(deal, { amountNaira: 101000, currency: "USD" }).ok);
  assert("missing currency rejected", !verifyFunding(deal, { amountNaira: 101000 }).ok);
  assert("missing amount rejected", !verifyFunding(deal, { currency: "NGN" }).ok);
  assert("currency is case-insensitive", verifyFunding(deal, { amountNaira: 101000, currency: "ngn" }).ok);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
