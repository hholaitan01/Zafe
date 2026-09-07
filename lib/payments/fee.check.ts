/* ==========================================================================
   Self-check for the escrow fee model. Pure logic only (no keys, no network):
   the fee math, and full-lifecycle conservation through the ledger entries
   (funding charges the buyer's half, payout the seller's half, refunds and
   splits keep no fee). Run: `npx tsx lib/payments/fee.check.ts`.
   ========================================================================== */

import type { LedgerEntry, NewLedgerEntry } from "@/lib/ledger/types";

// Pin the policy so the check is independent of any env in the shell.
process.env.NEXT_PUBLIC_ZAFE_FEE_BPS = "200"; // 2%
process.env.NEXT_PUBLIC_ZAFE_FEE_CAP_NAIRA = "10000";

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const { computeFee, collectionAmount, sellerNet, FEE_CAP_NAIRA } = await import("./fee");
  const { fundEntry, payoutEntry, refundEntry } = await import("@/lib/ledger/entries");
  const { balancesOf } = await import("@/lib/ledger/store");
  const { ACCOUNTS } = await import("@/lib/ledger/types");

  // Sum a set of new entries into per-account balances (stamp a timestamp so the
  // shapes match; balancesOf only reads legs).
  const bal = (entries: NewLedgerEntry[]) =>
    balancesOf(entries.map((e) => ({ ...e, createdAt: "" }) as LedgerEntry));

  // --- fee math ---
  const f = computeFee(100000); // 2% = 2000, under cap
  assert("2% under cap", f.total === 2000);
  assert("split halves sum to total", f.buyerShare + f.sellerShare === f.total);
  assert("buyer half floored", f.buyerShare === 1000 && f.sellerShare === 1000);

  const odd = computeFee(150); // 2% = 3, odd split
  assert("odd fee splits 1/2", odd.buyerShare === 1 && odd.sellerShare === 2 && odd.total === 3);

  const capped = computeFee(2_000_000); // 2% = 40000, capped at 10000
  assert("cap binds on large deals", capped.total === FEE_CAP_NAIRA);

  assert("collectionAmount = amount + buyer half", collectionAmount(100000) === 100000 + 1000);
  assert("sellerNet = amount − seller half", sellerNet(100000) === 100000 - 1000);

  // --- lifecycle: complete deal keeps the whole fee ---
  const A = 100000;
  const fa = computeFee(A);
  let b = bal([fundEntry("d1", A, fa.buyerShare), payoutEntry("d1", A, fa.sellerShare)]);
  assert("complete: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);
  assert("complete: escrow holds the fee", (b[ACCOUNTS.escrow] ?? 0) === fa.total);
  assert("complete: revenue is the fee", (b[ACCOUNTS.revenue] ?? 0) === -fa.total);

  // --- lifecycle: full refund keeps no fee ---
  b = bal([fundEntry("d2", A, fa.buyerShare), refundEntry("d2", A, fa.buyerShare)]);
  assert("full refund: escrow back to 0", (b[ACCOUNTS.escrow] ?? 0) === 0);
  assert("full refund: revenue back to 0", (b[ACCOUNTS.revenue] ?? 0) === 0);
  assert("full refund: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  // --- lifecycle: 50/50 split keeps no fee ---
  const buyerP = Math.round(A / 2);
  b = bal([
    fundEntry("d3", A, fa.buyerShare),
    refundEntry("d3", buyerP, fa.buyerShare), // buyer gets their share + full fee back
    payoutEntry("d3", A - buyerP, 0), // seller gets the remainder, no fee
  ]);
  assert("split: escrow back to 0", (b[ACCOUNTS.escrow] ?? 0) === 0);
  assert("split: revenue back to 0 (no fee kept)", (b[ACCOUNTS.revenue] ?? 0) === 0);
  assert("split: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
