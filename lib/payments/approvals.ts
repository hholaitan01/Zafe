/* ==========================================================================
   Dual control for large settlements (audit #17).

   A single admin should not be able to move a large sum on their own say-so.
   Above a configurable threshold, a discretionary money-move — an escalated
   dispute ruling — needs TWO distinct admins to approve the exact same decision
   before it executes. Below the threshold, one approval is enough and this
   module is a no-op.

   The approval is scoped to a settlement key ("dispute:<dealId>") AND a
   fingerprint of the exact action (the decision and its split). Approving one
   ruling never approves a different one on the same deal: a changed fingerprint
   resets the approver set, so A approving "split 50/50" and B approving "refund
   the buyer" never combine into two approvals for either.

   Same live/demo seam as the audit log: a Supabase table (`settlement_approvals`,
   schema.sql) when configured, an in-memory map otherwise.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** How many distinct admins must approve a large settlement before it executes. */
export const APPROVERS_REQUIRED = 2;

/** Naira at or above which a discretionary settlement needs dual approval.
    `ZAFE_DUAL_APPROVAL_THRESHOLD_NAIRA` overrides it; 0 disables dual control. */
export function dualApprovalThreshold(): number {
  const raw = process.env.ZAFE_DUAL_APPROVAL_THRESHOLD_NAIRA;
  if (raw === undefined || raw.trim() === "") return 1_000_000;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 1_000_000;
}

/** True when a settlement of this size needs a second approver. */
export function requiresDualApproval(amountNaira: number): boolean {
  const threshold = dualApprovalThreshold();
  return threshold > 0 && amountNaira >= threshold;
}

/** The approval scope key for a deal's discretionary settlement. */
export function approvalKey(dealId: string): string {
  return `dispute:${dealId}`;
}

/** A stable fingerprint of the exact ruling being approved. A different decision
    or split is a different fingerprint, so approvals never carry across rulings. */
export function approvalFingerprint(decision: string, splitBuyerPercent?: number): string {
  return `${decision}:${splitBuyerPercent ?? "-"}`;
}

export interface ApprovalState {
  key: string;
  fingerprint: string;
  approvers: string[]; // distinct approver emails, lowercased
  updatedAt: string;
}

/** True when this state carries the required distinct approvals for `fingerprint`. */
export function hasDualApproval(state: ApprovalState | null, fingerprint: string): boolean {
  if (!state || state.fingerprint !== fingerprint) return false;
  return state.approvers.length >= APPROVERS_REQUIRED;
}

export function approvalsLive(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

// Demo backend: approvals by key.
const memory = new Map<string, ApprovalState>();

/** Merge an approver into the state for (key, fingerprint), returning the result.
    A changed fingerprint resets the approver set; a repeat approver is a no-op
    (an admin can never count as two approvals). */
function mergeApprover(prev: ApprovalState | null, key: string, fingerprint: string, approver: string): ApprovalState {
  const email = approver.trim().toLowerCase();
  if (!prev || prev.fingerprint !== fingerprint) {
    return { key, fingerprint, approvers: [email], updatedAt: new Date().toISOString() };
  }
  const approvers = prev.approvers.includes(email) ? prev.approvers : [...prev.approvers, email];
  return { key, fingerprint, approvers, updatedAt: new Date().toISOString() };
}

function fromRow(row: Record<string, unknown>): ApprovalState {
  return {
    key: String(row.key),
    fingerprint: String(row.fingerprint),
    approvers: Array.isArray(row.approvers) ? (row.approvers as unknown[]).map((a) => String(a)) : [],
    updatedAt: String(row.updated_at),
  };
}

/** Read the current approval state for a settlement scope, or null. */
export async function approvalState(key: string): Promise<ApprovalState | null> {
  if (!approvalsLive()) return memory.get(key) ?? null;
  const { data, error } = await db().from("settlement_approvals").select("*").eq("key", key).maybeSingle();
  if (error) throw new Error(`approval read failed: ${error.message}`);
  return data ? fromRow(data) : null;
}

/** Record `approver`'s approval of `fingerprint` for `key`; returns the new state. */
export async function recordApproval(key: string, fingerprint: string, approver: string): Promise<ApprovalState> {
  const prev = await approvalState(key);
  const next = mergeApprover(prev, key, fingerprint, approver);
  if (!approvalsLive()) {
    memory.set(key, next);
    return next;
  }
  const { error } = await db().from("settlement_approvals").upsert({
    key: next.key,
    fingerprint: next.fingerprint,
    approvers: next.approvers,
    updated_at: next.updatedAt,
  });
  if (error) throw new Error(`approval write failed: ${error.message}`);
  return next;
}

/** Clear a settlement scope's approvals once it has executed (or been abandoned),
    so a later ruling on the same deal starts fresh. */
export async function clearApproval(key: string): Promise<void> {
  if (!approvalsLive()) {
    memory.delete(key);
    return;
  }
  const { error } = await db().from("settlement_approvals").delete().eq("key", key);
  if (error) throw new Error(`approval clear failed: ${error.message}`);
}

/** Test-only: clear the in-memory demo approvals. */
export function _resetApprovals(): void {
  memory.clear();
}
