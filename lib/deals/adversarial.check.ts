/* ==========================================================================
   Adversarial money-safety checks (audit #21, extended #18). Drives the REAL
   deal store and ledger (demo/in-memory backend, no network) through the failure
   modes that matter for escrow: concurrent release, duplicate/replayed funding,
   secret exposure, wrong-amount/wrong-currency funding, replayed webhook events,
   and illegal/terminal status transitions. Asserts the money invariants hold —
   money moves at most once, the books stay balanced, a settled deal can never be
   re-funded, and the handover code never leaves the API.
   Run: `npx tsx lib/deals/adversarial.check.ts`.
   ========================================================================== */

export {}; // module scope (this file shares helper names with the other check scripts)

// Force the demo backend (no Supabase) so this check hits no network.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const store = await import("./store");
  const { entriesForDeal, reconciliation } = await import("@/lib/ledger/store");
  const { publicDeal } = await import("./redact");

  const mkDeal = async (amount: number) =>
    store.createDeal({ item: { title: "Test item", amount }, seller: { name: "Seller", contact: `s${Math.random().toString(36).slice(2)}@x.com` }, buyerEmail: `b${Math.random().toString(36).slice(2)}@x.com` });

  // --- Concurrent release must pay the seller at most once ---
  {
    const deal = await mkDeal(100000);
    await store.setDealStatus(deal.id, "funded");
    // Fire several releases at once; the check-then-act in releaseToSeller can
    // race, but the deterministic ledger ref must collapse them to one payout.
    const results = await Promise.all([1, 2, 3, 4].map(() => store.releaseToSeller(deal.id)));
    const payouts = (await entriesForDeal(deal.id)).filter((e) => e.kind === "payout");
    assert("concurrent release: exactly one payout ledger entry", payouts.length === 1);
    assert("concurrent release: at least one call succeeded", results.some((r) => r.ok));
  }

  // --- Duplicate / replayed funding must book escrow once ---
  {
    const deal = await mkDeal(80000);
    // A re-delivered funding event calls setDealStatus("funded") again.
    await store.setDealStatus(deal.id, "funded");
    await store.setDealStatus(deal.id, "funded");
    await store.setDealStatus(deal.id, "funded");
    const funds = (await entriesForDeal(deal.id)).filter((e) => e.kind === "fund");
    assert("replayed funding: exactly one fund ledger entry", funds.length === 1);
  }

  // --- The handover code never leaves the API ---
  {
    const deal = await mkDeal(50000);
    await store.setDealStatus(deal.id, "funded");
    const shipped = await store.shipDeal(deal.id);
    assert("ship: a handover code is minted server-side", !!shipped?.handoverCode);
    assert("redaction: publicDeal strips the handover code", publicDeal(shipped!).handoverCode === undefined);
  }

  // --- The payout account comes ONLY from the seller's server-side record ---
  // (audit P0): shipDeal takes no payout argument, so a client can't choose or
  // override where escrow funds land — the destination is resolved from the
  // seller's saved account alone.
  {
    const { upsertSeller } = await import("@/lib/sellers/store");
    const sellerContact = `srv${Math.random().toString(36).slice(2)}@x.com`;
    await upsertSeller({ email: sellerContact, idVerified: true, payout: { bankName: "GTBank", accountNumber: "0011223344", accountName: "Real Seller" }, updatedAt: new Date().toISOString() });
    const deal = await store.createDeal({ item: { title: "Server payout", amount: 50000 }, seller: { name: "Seller", contact: sellerContact }, buyerEmail: `b${Math.random().toString(36).slice(2)}@x.com` });
    await store.setDealStatus(deal.id, "funded");
    const shipped = await store.shipDeal(deal.id);
    assert("ship: payout resolved from the seller's saved account", shipped?.sellerPayout?.accountNumber === "0011223344");
    assert("ship: payout carries the server-side verified flag", shipped?.sellerPayout?.verified === true);
  }

  // --- A full lifecycle leaves the books balanced and buyer_funds at zero ---
  {
    const deal = await mkDeal(120000);
    await store.setDealStatus(deal.id, "funded");
    await store.releaseToSeller(deal.id);
    const bal = (await reconciliation()).balanced;
    const entries = await entriesForDeal(deal.id);
    const bf = entries.flatMap((e) => e.legs).filter((l) => l.account === "buyer_funds").reduce((s, l) => s + l.amount, 0);
    assert("completed deal: buyer_funds nets to zero", bf === 0);
    assert("ledger: trial balance holds after the flow", bal === true);
  }

  // --- A dispute split settles both sides and keeps the books balanced ---
  {
    const deal = await mkDeal(200000);
    await store.setDealStatus(deal.id, "funded");
    const res = await store.refundDeal(deal.id, 100000); // partial → split
    assert("split refund: settles ok", res.ok === true);
    const entries = await entriesForDeal(deal.id);
    const bf = entries.flatMap((e) => e.legs).filter((l) => l.account === "buyer_funds").reduce((s, l) => s + l.amount, 0);
    assert("split refund: buyer_funds nets to zero", bf === 0);
    assert("split refund: books still balanced", (await reconciliation()).balanced === true);
  }

  // --- A wrong amount or wrong currency must NOT fund (audit #18) ---
  {
    const { verifyFunding } = await import("@/lib/payments/funding");
    const { collectionAmount } = await import("@/lib/payments/fee");
    const deal = await mkDeal(100000);
    const need = collectionAmount(100000); // principal + buyer's fee half
    assert("funding: exact amount in NGN is accepted", verifyFunding(deal, { amountNaira: need, currency: "NGN" }).ok === true);
    assert("funding: overpayment is accepted", verifyFunding(deal, { amountNaira: need + 5000, currency: "NGN" }).ok === true);
    assert("funding: underpayment is rejected", verifyFunding(deal, { amountNaira: need - 1, currency: "NGN" }).ok === false);
    assert("funding: wrong currency is rejected", verifyFunding(deal, { amountNaira: need, currency: "USD" }).ok === false);
    assert("funding: missing currency is rejected", verifyFunding(deal, { amountNaira: need }).ok === false);
    assert("funding: missing amount is rejected", verifyFunding(deal, { currency: "NGN" }).ok === false);
  }

  // --- A replayed webhook event is claimed exactly once (audit #18) ---
  {
    const { claimOnce } = await import("@/lib/payments/idempotency");
    const evt = `paystack:replay-${Math.random().toString(36).slice(2)}`;
    const first = await claimOnce(evt);
    const second = await claimOnce(evt);
    const third = await claimOnce(evt);
    assert("webhook replay: first delivery claims the event", first === true);
    assert("webhook replay: re-deliveries are refused", second === false && third === false);
  }

  // --- Illegal and terminal transitions are refused; a settled deal never re-funds (audit #18) ---
  {
    const { canTransition, isTerminal } = await import("./transitions");
    assert("transition: created→funded allowed", canTransition("created", "funded") === true);
    assert("transition: created→completed (skipping funding) refused", canTransition("created", "completed") === false);
    assert("transition: completed is terminal", isTerminal("completed") === true);
    assert("transition: completed→funded refused (no re-fund after settle)", canTransition("completed", "funded") === false);
    assert("transition: refunded→funded refused", canTransition("refunded", "funded") === false);
    assert("transition: resolved→funded refused", canTransition("resolved", "funded") === false);

    // Against the REAL store: a replayed funding webhook after settlement can't re-fund.
    const deal = await mkDeal(90000);
    await store.setDealStatus(deal.id, "funded");
    await store.releaseToSeller(deal.id); // → completed
    await store.setDealStatus(deal.id, "funded"); // illegal (completed→funded): must no-op
    const after = await store.getDeal(deal.id);
    const funds = (await entriesForDeal(deal.id)).filter((e) => e.kind === "fund");
    assert("settled deal: illegal re-fund leaves status completed", after?.status === "completed");
    assert("settled deal: illegal re-fund posts no second fund entry", funds.length === 1);
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
