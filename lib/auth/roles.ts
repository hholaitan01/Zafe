/* ==========================================================================
   Admin roles + capabilities.

   The app had one flat "admin" (an email in ADMIN_EMAILS could do everything).
   A financial back office needs least privilege: someone who works the dispute
   queue should not, by that fact, be able to re-drive money or deactivate an
   account. This splits admin into three roles and gates each privileged action
   on a capability rather than on "is an admin".

   Roles are assigned by env allowlists (comma-separated emails), so there is no
   self-service admin management to secure — assignment lives in the deploy
   config. ADMIN_EMAILS stays supported and maps to the highest role, so every
   existing admin keeps the access they had. In demo mode (no auth configured)
   the single local sandbox is treated as superadmin, exactly as isAdmin was
   open before.

   Pure and env-only: no store, no network. Server-side (roleForCaller reads the
   session); the capability map itself is safe anywhere.
   ========================================================================== */

export type AdminRole = "reviewer" | "finance" | "superadmin";

export type Capability =
  | "dispute.review" // see the escalated-dispute queue
  | "dispute.resolve" // settle an escalated dispute (moves money)
  | "reconciliation.view" // see the ledger / reconciliation
  | "reconciliation.retry" // re-drive a stuck money-move (moves money)
  | "aml.review" // the AML screening queue
  | "audit.read" // read the admin audit log
  | "account.deactivate"; // deactivate a user account

/** What each role may do. Higher roles are supersets of lower ones. */
const REVIEWER_CAPS: Capability[] = ["dispute.review", "dispute.resolve", "reconciliation.view", "aml.review", "audit.read"];
const FINANCE_CAPS: Capability[] = [...REVIEWER_CAPS, "reconciliation.retry"];
const SUPERADMIN_CAPS: Capability[] = [...FINANCE_CAPS, "account.deactivate"];

const ROLE_CAPS: Record<AdminRole, ReadonlySet<Capability>> = {
  reviewer: new Set(REVIEWER_CAPS),
  finance: new Set(FINANCE_CAPS),
  superadmin: new Set(SUPERADMIN_CAPS),
};

/** Highest role first: an email in several lists gets the strongest. */
const ROLE_ORDER: AdminRole[] = ["superadmin", "finance", "reviewer"];

/** Which env var supplies each role's allowlist. ADMIN_EMAILS → superadmin (compat). */
const ROLE_ENV: Record<AdminRole, string[]> = {
  superadmin: ["ZAFE_SUPERADMIN_EMAILS", "ADMIN_EMAILS"],
  finance: ["ZAFE_FINANCE_EMAILS"],
  reviewer: ["ZAFE_REVIEWER_EMAILS"],
};

function allowlist(vars: string[]): Set<string> {
  const out = new Set<string>();
  for (const v of vars) {
    for (const e of (process.env[v] || "").split(",")) {
      const norm = e.trim().toLowerCase();
      if (norm) out.add(norm);
    }
  }
  return out;
}

/** True when this role grants this capability. */
export function roleHasCapability(role: AdminRole, cap: Capability): boolean {
  return ROLE_CAPS[role].has(cap);
}

/** Every capability a role holds (for the admin view / self-check). */
export function capabilitiesOf(role: AdminRole): Capability[] {
  return [...ROLE_CAPS[role]];
}

/**
 * The admin role for an email from the env allowlists, or null if none. Highest
 * role wins. Case-insensitive. This is the live-mode resolver; demo mode is
 * handled by roleForCaller (server.ts), which grants superadmin with no session.
 */
export function roleForEmail(email: string | null | undefined): AdminRole | null {
  const norm = email?.trim().toLowerCase();
  if (!norm) return null;
  for (const role of ROLE_ORDER) {
    if (allowlist(ROLE_ENV[role]).has(norm)) return role;
  }
  return null;
}
