/* ==========================================================================
   Self-check for admin roles + the audit log. Pure logic only (no live keys,
   no network): the capability matrix, env-based role resolution with
   precedence, and the append-only audit log.
   Run: `npx tsx lib/auth/roles.check.ts`.
   ========================================================================== */

// Force demo (in-memory) stores; set role allowlists for the resolver tests.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.ZAFE_REVIEWER_EMAILS = "rev@zafe.ng";
process.env.ZAFE_FINANCE_EMAILS = "fin@zafe.ng, dual@zafe.ng";
process.env.ZAFE_SUPERADMIN_EMAILS = "boss@zafe.ng";
process.env.ADMIN_EMAILS = "legacy@zafe.ng, dual@zafe.ng"; // legacy → superadmin, and wins precedence

export {}; // make this a module (its own scope), not a global script

let failures = 0;
function assert(name: string, cond: boolean) {
  if (cond) console.log(`  ok  ${name}`);
  else { failures++; console.error(`FAIL  ${name}`); }
}

async function main() {
  const { roleHasCapability, roleForEmail, capabilitiesOf } = await import("./roles");
  const audit = await import("@/lib/audit/log");

  // --- capability matrix: least privilege holds ---
  assert("reviewer can resolve disputes", roleHasCapability("reviewer", "dispute.resolve"));
  assert("reviewer cannot re-drive money", !roleHasCapability("reviewer", "reconciliation.retry"));
  assert("reviewer cannot deactivate accounts", !roleHasCapability("reviewer", "account.deactivate"));
  assert("finance can re-drive money", roleHasCapability("finance", "reconciliation.retry"));
  assert("finance cannot deactivate accounts", !roleHasCapability("finance", "account.deactivate"));
  assert("superadmin can deactivate accounts", roleHasCapability("superadmin", "account.deactivate"));
  assert("superadmin is a superset of finance", capabilitiesOf("finance").every((c) => roleHasCapability("superadmin", c)));

  // --- env-based role resolution + precedence ---
  assert("reviewer email resolves to reviewer", roleForEmail("rev@zafe.ng") === "reviewer");
  assert("finance email resolves to finance", roleForEmail("fin@zafe.ng") === "finance");
  assert("superadmin email resolves to superadmin", roleForEmail("boss@zafe.ng") === "superadmin");
  assert("legacy ADMIN_EMAILS maps to superadmin", roleForEmail("legacy@zafe.ng") === "superadmin");
  assert("email is case-insensitive", roleForEmail("REV@ZAFE.NG") === "reviewer");
  assert("highest role wins when listed twice", roleForEmail("dual@zafe.ng") === "superadmin"); // finance + ADMIN_EMAILS(super)
  assert("unknown email has no role", roleForEmail("nobody@zafe.ng") === null);
  assert("blank email has no role", roleForEmail("") === null);

  // --- audit log: append-only, newest first, never throws ---
  audit._resetAudit();
  const e1 = await audit.recordAudit({ actorEmail: "boss@zafe.ng", actorRole: "superadmin", action: "dispute.resolve", target: "deal-1", meta: { decision: "split", splitBuyerPercent: 60 } });
  assert("recordAudit stamps an id", !!e1?.id);
  assert("recordAudit stamps a timestamp", !!e1?.at);
  await new Promise((r) => setTimeout(r, 2)); // ensure a later timestamp
  await audit.recordAudit({ actorEmail: "fin@zafe.ng", actorRole: "finance", action: "settlement.retry", target: "payout:deal-2" });
  const list = await audit.listAudit(10);
  assert("audit log holds both entries", list.length === 2);
  assert("audit log is newest first", list[0].action === "settlement.retry");
  assert("audit entry carries actor + role", list[0].actorEmail === "fin@zafe.ng" && list[0].actorRole === "finance");

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
