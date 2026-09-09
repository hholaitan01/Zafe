/* ==========================================================================
   Dual control for large settlements (audit #17), concurrency-safe (recheck v3).

   A single admin should not be able to move a large sum on their own say-so.
   Above a configurable threshold, a discretionary money-move — an escalated
   dispute ruling — needs TWO distinct admins to approve the exact same decision
   before it executes. Below the threshold this module is a no-op.

   Each approval is ONE durable row keyed by (settlement key, decision
   fingerprint, approver). Recording an approval is a single idempotent insert,
   never a read-modify-write of a shared array, so two admins approving at the
   same instant can never lose each other's approval (the v3 recheck flagged the
   old array-upsert as a lost-update race). Quorum is a distinct-approver count
   for the CURRENT fingerprint, so a stale or changed ruling can never carry its
   approvals onto a different decision.

   Same live/demo seam as the audit log: a Supabase table
   (`settlement_approvals`, schema.sql) when configured, an in-memory map
   otherwise.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const UNIQUE_VIOLATION = "23505";

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
  approvers: string[]; // distinct approver emails for this fingerprint, lowercased
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

// Demo backend: key -> fingerprint -> set of approver emails. A Set add is a
// single synchronous op, so concurrent approvals never lose each other here
// either (JS is single-threaded within an instance).
const memory = new Map<string, Map<string, Set<string>>>();

function state(key: string, fingerprint: string, approvers: string[]): ApprovalState {
  return { key, fingerprint, approvers, updatedAt: new Date().toISOString() };
}

/**
 * Record `approver`'s approval of `fingerprint` for `key`, and return the
 * distinct approvers now standing for that fingerprint. Idempotent: the same
 * admin approving twice still counts once.
 */
export async function recordApproval(key: string, fingerprint: string, approver: string): Promise<ApprovalState> {
  const email = approver.trim().toLowerCase();
  if (!approvalsLive()) {
    let byFp = memory.get(key);
    if (!byFp) memory.set(key, (byFp = new Map()));
    let set = byFp.get(fingerprint);
    if (!set) byFp.set(fingerprint, (set = new Set()));
    set.add(email);
    return state(key, fingerprint, [...set]);
  }
  // One row per (key, fingerprint, approver): a single insert, so two admins
  // racing insert two different rows and neither can clobber the other. A repeat
  // by the same admin hits the primary key and is ignored.
  const { error } = await db()
    .from("settlement_approvals")
    .insert({ key, fingerprint, approver: email });
  if (error && error.code !== UNIQUE_VIOLATION) throw new Error(`approval write failed: ${error.message}`);
  return readState(key, fingerprint);
}

async function readState(key: string, fingerprint: string): Promise<ApprovalState> {
  const { data, error } = await db()
    .from("settlement_approvals")
    .select("approver")
    .eq("key", key)
    .eq("fingerprint", fingerprint);
  if (error) throw new Error(`approval read failed: ${error.message}`);
  const approvers = [...new Set((data ?? []).map((r) => String((r as { approver: unknown }).approver)))];
  return state(key, fingerprint, approvers);
}

/** Read the current approval state for a (key, fingerprint), or null if none. */
export async function approvalState(key: string, fingerprint: string): Promise<ApprovalState | null> {
  if (!approvalsLive()) {
    const set = memory.get(key)?.get(fingerprint);
    return set && set.size ? state(key, fingerprint, [...set]) : null;
  }
  const s = await readState(key, fingerprint);
  return s.approvers.length ? s : null;
}

/** Clear a settlement scope's approvals once it has executed (or been abandoned),
    so a later ruling on the same deal starts fresh. Removes every fingerprint. */
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
