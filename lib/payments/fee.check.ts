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
  const { computeFee, collectionAmount, sellerNet, disputeSellerFee, FEE_CAP_NAIRA } = await import("./fee");
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

  // --- non-dispute refund (a cancelled deal) keeps no fee: buyer made whole ---
  b = bal([fundEntry("d2", A, fa.buyerShare), refundEntry("d2", A, fa.buyerShare)]);
  assert("plain refund: escrow back to 0", (b[ACCOUNTS.escrow] ?? 0) === 0);
  assert("plain refund: revenue back to 0", (b[ACCOUNTS.revenue] ?? 0) === 0);
  assert("plain refund: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  // --- dispute fee math ---
  assert("dispute fee: 1% of the seller's split portion", disputeSellerFee(A / 2, A) === Math.round((A / 2) / 100));
  assert("dispute fee: seller winning = their whole half", disputeSellerFee(A, A) === fa.sellerShare);
  assert("dispute fee: buyer winning = 0", disputeSellerFee(0, A) === 0);

  // --- dispute: buyer wins a full refund, Zafe keeps the buyer's half ---
  b = bal([fundEntry("d3", A, fa.buyerShare), refundEntry("d3", A, 0)]); // fee NOT reversed
  assert("dispute refund: escrow keeps the buyer half", (b[ACCOUNTS.escrow] ?? 0) === fa.buyerShare);
  assert("dispute refund: revenue is the buyer half", (b[ACCOUNTS.revenue] ?? 0) === -fa.buyerShare);
  assert("dispute refund: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  // --- dispute: seller wins outright, Zafe keeps the whole fee ---
  b = bal([fundEntry("d4", A, fa.buyerShare), payoutEntry("d4", A, fa.sellerShare)]);
  assert("dispute release: escrow keeps the whole fee", (b[ACCOUNTS.escrow] ?? 0) === fa.total);
  assert("dispute release: revenue is the whole fee", (b[ACCOUNTS.revenue] ?? 0) === -fa.total);

  // --- dispute: 50/50 split, Zafe keeps buyer half + 1% of the seller's portion ---
  const buyerP = Math.round(A / 2);
  const remainder = A - buyerP;
  const dFee = disputeSellerFee(remainder, A);
  b = bal([
    fundEntry("d5", A, fa.buyerShare),
    refundEntry("d5", buyerP, 0), // buyer's principal only, fee kept
    payoutEntry("d5", remainder, dFee), // seller remainder minus 1%
  ]);
  assert("dispute split: escrow keeps buyer half + seller 1%", (b[ACCOUNTS.escrow] ?? 0) === fa.buyerShare + dFee);
  assert("dispute split: revenue is buyer half + seller 1%", (b[ACCOUNTS.revenue] ?? 0) === -(fa.buyerShare + dFee));
  assert("dispute split: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
