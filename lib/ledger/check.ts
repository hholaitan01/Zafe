/* ==========================================================================
   Self-check for the internal ledger. Pure logic only (no live keys, no
   network): the demo (in-memory) store, the entry builders, the double-entry
   invariant, idempotency, and full-lifecycle reconciliation.
   Run: `npx tsx lib/ledger/check.ts`.
   ========================================================================== */

// Force the demo (in-memory) store so this check hits no network.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`FAIL  ${name}`);
  }
}

async function main() {
  const { fundEntry, payoutEntry, refundEntry } = await import("./entries");
  const { record, recordSafe, entriesForDeal, balancesOf, trialBalance, escrowHeld, _resetMemory } = await import("./store");
  const { isBalanced, ACCOUNTS } = await import("./types");

  // --- builders produce balanced entries ---
  assert("fundEntry balances", isBalanced(fundEntry("d1", 50000).legs));
  assert("payoutEntry balances (no fee)", isBalanced(payoutEntry("d1", 50000).legs));
  assert("payoutEntry balances (with fee)", isBalanced(payoutEntry("d1", 50000, 1500).legs));
  assert("refundEntry balances", isBalanced(refundEntry("d1", 50000).legs));

  // --- record + idempotency ---
  _resetMemory();
  const first = await record(fundEntry("d1", 50000));
  assert("record: first is recorded", first.recorded === true);
  const again = await record(fundEntry("d1", 50000));
  assert("record: same ref is a no-op", again.recorded === false);
  assert("record: one entry stored for the deal", (await entriesForDeal("d1")).length === 1);

  // --- unbalanced entry is rejected ---
  let threw = false;
  try {
    await record({ ref: "bad:1", dealId: "d1", kind: "fund", legs: [{ account: ACCOUNTS.escrow, amount: 100 }] });
  } catch {
    threw = true;
  }
  assert("record: unbalanced entry throws", threw === true);

  // --- lifecycle: fund then full payout reconciles to zero ---
  _resetMemory();
  await record(fundEntry("d2", 40000));
  await record(payoutEntry("d2", 40000));
  let b = balancesOf(await entriesForDeal("d2"));
  assert("fund+payout: escrow back to 0", (b[ACCOUNTS.escrow] ?? 0) === 0);
  assert("fund+payout: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  // --- lifecycle: fund then refund reconciles to zero ---
  _resetMemory();
  await record(fundEntry("d3", 40000));
  await record(refundEntry("d3", 40000));
  b = balancesOf(await entriesForDeal("d3"));
  assert("fund+refund: escrow back to 0", (b[ACCOUNTS.escrow] ?? 0) === 0);

  // --- lifecycle with a fee: the fee stays as escrow cash and as revenue ---
  _resetMemory();
  await record(fundEntry("d4", 40000));
  await record(payoutEntry("d4", 40000, 1500));
  b = balancesOf(await entriesForDeal("d4"));
  assert("fee: escrow holds the retained fee", (b[ACCOUNTS.escrow] ?? 0) === 1500);
  assert("fee: revenue credited the fee", (b[ACCOUNTS.revenue] ?? 0) === -1500);
  assert("fee: buyer_funds back to 0", (b[ACCOUNTS.buyerFunds] ?? 0) === 0);

  // --- trial balance across everything sums to zero, escrowHeld reads it ---
  const { balanced } = await trialBalance();
  assert("trial balance: all accounts sum to zero", balanced === true);
  assert("escrowHeld: equals the retained fee", (await escrowHeld()) === 1500);

  // --- recordSafe never throws, even on a bad entry ---
  let safeThrew = false;
  try {
    await recordSafe({ ref: "bad:2", dealId: "d5", kind: "fund", legs: [{ account: ACCOUNTS.escrow, amount: 1 }] });
  } catch {
    safeThrew = true;
  }
  assert("recordSafe: swallows errors (money path never blocked)", safeThrew === false);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
