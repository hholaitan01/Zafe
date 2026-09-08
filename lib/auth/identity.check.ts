/* ==========================================================================
   Self-check for the canonical-id dual-key transition (audit #17): the identity
   matcher, and the deal read that matches by id OR email and backfills the id.
   Run: `npx tsx lib/auth/identity.check.ts`.
   ========================================================================== */

// Force demo (in-memory) stores so this check hits no network.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

export {}; // module scope

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const { identityMatches } = await import("./identity");
  const store = await import("@/lib/deals/store");
  const seller = { name: "S", contact: "seller@example.com" };

  // --- pure matcher: id-first, email fallback ---
  assert("stable id match wins over a different email", identityMatches({ userId: "u1", email: "a@x.com" }, { id: "u1", email: "other@x.com" }));
  assert("email fallback when the record has no id", identityMatches({ email: "A@X.com" }, { email: "a@x.com" }));
  assert("email fallback is case-insensitive", identityMatches({ email: "Foo@Bar.com" }, { id: "u9", email: "foo@bar.com" }));
  assert("a different id is not a match", !identityMatches({ userId: "u1", email: "a@x.com" }, { id: "u2", email: "a@x.com" }));
  assert("no id + different email is not a match", !identityMatches({ email: "a@x.com" }, { email: "b@x.com" }));
  assert("empty record email is not a match", !identityMatches({}, { email: "a@x.com" }));

  // --- dual-key list: found by stable id despite a changed email ---
  const a = await store.createDeal({ item: { title: "A", amount: 1000 }, seller, buyerEmail: "buyerA@x.com", buyerId: "uid-A" });
  const byId = await store.listDealsForIdentity({ id: "uid-A", email: "nomatch@x.com" });
  assert("deal found by stable id despite a different email", byId.some((d) => d.id === a.id));

  // --- dual-key list: an email-only deal is found by email AND backfilled with the id ---
  const b = await store.createDeal({ item: { title: "B", amount: 1000 }, seller, buyerEmail: "buyerB@x.com" }); // no buyerId
  assert("email-only deal starts with no buyerId", b.buyerId === undefined);
  const byEmail = await store.listDealsForIdentity({ id: "uid-B", email: "buyerB@x.com" });
  assert("email-only deal is found by email", byEmail.some((d) => d.id === b.id));
  assert("email-only deal is backfilled with the id", byEmail.find((d) => d.id === b.id)?.buyerId === "uid-B");
  const afterBackfill = await store.listDealsForIdentity({ id: "uid-B", email: "changed@x.com" });
  assert("after backfill the deal is found by id even if the email changed", afterBackfill.some((d) => d.id === b.id));

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
