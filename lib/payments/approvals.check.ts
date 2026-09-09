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

  // Per-fingerprint isolation: approving a DIFFERENT ruling starts that ruling at
  // one approver and does not inherit the other ruling's quorum.
  const other1 = await recordApproval(key, otherFp, "alice@zafe.ng");
  assert("a different ruling starts fresh at one approver", other1.approvers.length === 1 && other1.fingerprint === otherFp);
  assert("the different ruling is not dual-approved off one approval", hasDualApproval(other1, otherFp) === false);
  // The original ruling still stands with its own two approvers, untouched.
  assert("the original ruling keeps its quorum", hasDualApproval(await approvalState(key, fp), fp) === true);

  // --- concurrency (recheck v3): two distinct admins approving at the same
  //     instant must BOTH survive — no lost update — and reach quorum exactly once ---
  _resetApprovals();
  const ckey = approvalKey("deal-concurrent");
  const cfp = approvalFingerprint("split", 40);
  const [ra, rb] = await Promise.all([
    recordApproval(ckey, cfp, "carol@zafe.ng"),
    recordApproval(ckey, cfp, "dave@zafe.ng"),
  ]);
  const finalState = await approvalState(ckey, cfp);
  assert("concurrent approvals: both approvers survive", finalState?.approvers.length === APPROVERS_REQUIRED);
  assert("concurrent approvals: both distinct emails are present", !!finalState && finalState.approvers.includes("carol@zafe.ng") && finalState.approvers.includes("dave@zafe.ng"));
  assert("concurrent approvals: quorum is reached", hasDualApproval(finalState, cfp) === true);
  assert("concurrent approvals: neither call lost the other", ra.approvers.length >= 1 && rb.approvers.length >= 1);

  // --- clear ---
  await clearApproval(key);
  assert("clearing removes the approval scope", (await approvalState(key, fp)) === null);

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
