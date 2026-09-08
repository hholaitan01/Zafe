/* ==========================================================================
   Admin audit log — an append-only record of every privileged action.

   Who did what, to which deal/account, and when. A financial back office needs
   this for accountability and for after-the-fact review: every money-move a
   human triggers (a dispute resolution, a settlement re-drive) and every
   account action lands here, keyed to the actor's email and role.
   ========================================================================== */

/** The privileged actions worth recording. Extend as new admin powers are added. */
export type AuditAction =
  | "dispute.resolve" // a reviewer settled an escalated dispute (moved money)
  | "settlement.retry" // a stuck payout/refund was re-driven from reconciliation
  | "account.deactivate"; // an account was deactivated

export interface AuditEntry {
  id: string; // unique per entry
  at: string; // ISO timestamp
  actorEmail: string; // who did it
  actorRole?: string; // their admin role at the time
  action: AuditAction;
  target?: string; // the deal id, settlement key, or user id acted on
  meta?: Record<string, unknown>; // action-specific detail (decision, amount, outcome)
}

/** An entry ready to record — everything but the id and timestamp the store stamps. */
export type NewAuditEntry = Omit<AuditEntry, "id" | "at">;
