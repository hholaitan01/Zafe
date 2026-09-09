/* ==========================================================================
   Self-check for dual control on large settlements (audit #17). Pure logic +
   the in-memory approval store — no live keys, no network.
   Run: `npx tsx lib/payments/approvals.check.ts`.
   ========================================================================== */

export {}; // module scope, so top-level `failures`/`assert` don't collide with sibling checks

// Force the demo (in-memory) store: no Supabase → approvals stay local.
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
  const a = await import("./approvals");
  const {
    requiresDualApproval,
    dualApprovalThreshold,
    approvalKey,
    approvalFingerprint,
    recordApproval,
    approvalState,
    clearApproval,
    hasDualApproval,
    APPROVERS_REQUIRED,
    _resetApprovals,
  } = a;

  // --- threshold logic ---
  process.env.ZAFE_DUAL_APPROVAL_THRESHOLD_NAIRA = "1000000";
  assert("default-ish threshold reads back", dualApprovalThreshold() === 1_000_000);
  assert("below threshold → no dual approval", requiresDualApproval(999_999) === false);
  assert("at threshold → dual approval required", requiresDualApproval(1_000_000) === true);
  assert("above threshold → dual approval required", requiresDualApproval(5_000_000) === true);

  process.env.ZAFE_DUAL_APPROVAL_THRESHOLD_NAIRA = "0";
  assert("threshold 0 disables dual control", requiresDualApproval(9_999_999) === false);

  delete process.env.ZAFE_DUAL_APPROVAL_THRESHOLD_NAIRA;
  assert("unset threshold defaults to 1,000,000", dualApprovalThreshold() === 1_000_000);
  process.env.ZAFE_DUAL_APPROVAL_THRESHOLD_NAIRA = "1000000";

  // --- fingerprint pins the exact ruling ---
  assert("same ruling → same fingerprint", approvalFingerprint("split", 50) === approvalFingerprint("split", 50));
  assert("different split → different fingerprint", approvalFingerprint("split", 50) !== approvalFingerprint("split", 60));
  assert("different decision → different fingerprint", approvalFingerprint("split", 50) !== approvalFingerprint("refund_buyer", undefined));

  // --- approval accrual ---
  _resetApprovals();
  const key = approvalKey("deal-A");
  const fp = approvalFingerprint("split", 50);

  const s1 = await recordApproval(key, fp, "alice@zafe.ng");
  assert("first approval records one approver", s1.approvers.length === 1);
  assert("one approval is not yet dual-approved", hasDualApproval(s1, fp) === false);

  // Same admin approving again must NOT count twice.
  const s1again = await recordApproval(key, fp, "ALICE@zafe.ng");
  assert("same admin cannot self-approve twice", s1again.approvers.length === 1);
  assert("still not dual-approved after a repeat", hasDualApproval(s1again, fp) === false);

  // A second DISTINCT admin approving the same ruling clears dual control.
  const s2 = await recordApproval(key, fp, "bob@zafe.ng");
  assert("second distinct approver reaches the quorum", s2.approvers.length === APPROVERS_REQUIRED);
  assert("two distinct approvals → dual-approved", hasDualApproval(s2, fp) === true);

  // A different ruling is NOT approved by the accrued approvals.
  const otherFp = approvalFingerprint("refund_buyer", undefined);
  assert("accrued approvals do not authorise a different ruling", hasDualApproval(s2, otherFp) === false);

  // Recording against a changed fingerprint resets the approver set.
  const reset = await recordApproval(key, otherFp, "alice@zafe.ng");
  assert("a changed ruling resets the approvers", reset.approvers.length === 1 && reset.fingerprint === otherFp);
  assert("reset ruling is not dual-approved", hasDualApproval(reset, otherFp) === false);

  // --- clear ---
  await clearApproval(key);
  assert("clearing removes the approval scope", (await approvalState(key)) === null);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
