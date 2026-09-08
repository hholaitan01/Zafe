/* ==========================================================================
   Audit log store — the same live/demo seam as the rest of the backend.

   - LIVE — an `audit_log` table when Supabase is configured (schema.sql).
   - DEMO — an in-memory list, so the admin log works on stage with no database.

   Append-only: entries are never updated or deleted. Recording never throws —
   an audit write must not fail the admin action it records — but the action
   routes still await it so a healthy write lands before the response.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuditEntry, NewAuditEntry } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function auditLive(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

// Demo backend: entries in insertion order.
const memory: AuditEntry[] = [];

function newId(): string {
  // randomUUID is available in the Node/edge runtimes this runs in; fall back
  // to a timestamp+random id if not.
  try {
    return crypto.randomUUID();
  } catch {
    return `a_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Append one audit entry. Never throws: a failed audit write is logged and
 * swallowed so it cannot fail the admin action being recorded. Returns the
 * stored entry (with its id and timestamp) on success, or null if the write
 * was swallowed.
 */
export async function recordAudit(entry: NewAuditEntry): Promise<AuditEntry | null> {
  const full: AuditEntry = { ...entry, id: newId(), at: new Date().toISOString() };
  try {
    if (!auditLive()) {
      memory.push(full);
      return full;
    }
    const { error } = await db().from("audit_log").insert({
      id: full.id,
      at: full.at,
      actor_email: full.actorEmail,
      actor_role: full.actorRole ?? null,
      action: full.action,
      target: full.target ?? null,
      meta: full.meta ?? null,
    });
    if (error) throw new Error(error.message);
    return full;
  } catch (e) {
    console.warn(`audit: failed to record ${entry.action}: ${(e as Error).message}`);
    return null;
  }
}

/** The most recent entries, newest first. For the admin audit view. */
export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  if (!auditLive()) {
    return [...memory].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }
  const { data, error } = await db().from("audit_log").select("*").order("at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

function fromRow(row: Record<string, unknown>): AuditEntry {
  return {
    id: String(row.id),
    at: String(row.at),
    actorEmail: String(row.actor_email),
    actorRole: (row.actor_role as string) ?? undefined,
    action: row.action as AuditEntry["action"],
    target: (row.target as string) ?? undefined,
    meta: (row.meta as Record<string, unknown>) ?? undefined,
  };
}

/** Test-only: clear the in-memory demo log. */
export function _resetAudit(): void {
  memory.length = 0;
}
