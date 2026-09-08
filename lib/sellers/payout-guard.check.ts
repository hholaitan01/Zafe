/* ==========================================================================
   Self-check for the payout-account change guard: fingerprint/change detection,
   the post-change cooldown, and the one-time confirmation code.
   Run: `npx tsx lib/sellers/payout-guard.check.ts`.
   ========================================================================== */

// Force demo (in-memory) stores; set a known cooldown for the window tests.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.ZAFE_PAYOUT_COOLDOWN_HOURS = "12";

export {}; // module scope

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const guard = await import("./payout-guard");
  const otp = await import("./payout-otp");

  const acctA = { bankName: "Access Bank", accountNumber: "0123456789", accountName: "A B" };
  const acctB = { bankName: "GTBank", accountNumber: "9876543210", accountName: "A B" };
  const acctAspaced = { bankName: "access bank", accountNumber: "012 345 6789", accountName: "A B" };

  // --- fingerprint + change detection ---
  assert("same account, normalised, is not a change", !guard.payoutChanged(acctA, acctAspaced));
  assert("a different account is a change", guard.payoutChanged(acctA, acctB));
  assert("empty next is not a change", !guard.payoutChanged(acctA, { accountName: "x" }));
  assert("first set (empty -> account) fingerprints as a change", guard.payoutChanged(undefined, acctA));

  // --- cooldown window ---
  const nowIso = new Date().toISOString();
  const oldIso = new Date(Date.now() - 13 * 3_600_000).toISOString(); // older than 12h
  assert("a fresh change is within cooldown", guard.withinCooldown(nowIso));
  assert("cooldownUntil is in the future for a fresh change", (guard.cooldownUntil(nowIso) ?? "") > nowIso);
  assert("an old change is past cooldown", !guard.withinCooldown(oldIso));
  assert("never-changed account has no cooldown", guard.cooldownUntil(undefined) === null);

  // --- one-time confirmation code ---
  otp._resetPayoutOtps();
  const email = "seller@zafe.ng";
  const fpB = guard.payoutFingerprint(acctB);
  const code = await otp.createPayoutOtp(email, fpB);
  const wrong = code === "111111" ? "222222" : "111111"; // a code that isn't the issued one
  assert("issued code is 6 digits", /^\d{6}$/.test(code));
  assert("wrong code is rejected", !(await otp.verifyPayoutOtp(email, fpB, wrong)));
  assert("code for a different account is rejected", !(await otp.verifyPayoutOtp(email, guard.payoutFingerprint(acctA), code)));
  assert("correct code + account verifies", await otp.verifyPayoutOtp(email, fpB, code));
  assert("code is single-use (second try fails)", !(await otp.verifyPayoutOtp(email, fpB, code)));

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
