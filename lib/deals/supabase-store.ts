/* ==========================================================================
   Supabase-backed deal store (live mode).

   Uses the server-only service-role key, so it runs only inside API routes —
   never shipped to the browser. Table schema is in schema.sql. Same interface
   as the demo store, so the routes don't care which one is active.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "./config";
import { newReference, statusLabel } from "./helpers";
import type { CreateDealInput, Deal, DealDispute, DealStatus, DealTrust, TimelineEvent } from "./types";

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

/** Map a DB row (snake_case + jsonb columns) to our Deal shape. */
function fromRow(row: Record<string, unknown>): Deal {
  return {
    id: String(row.id),
    reference: String(row.reference),
    item: row.item as Deal["item"],
    seller: row.seller as Deal["seller"],
    buyerEmail: (row.buyer_email as string) ?? undefined,
    chat: (row.chat as string) ?? undefined,
    status: row.status as DealStatus,
    trust: (row.trust as DealTrust) ?? undefined,
    handoverCode: (row.handover_code as string) ?? undefined,
    autoReleaseAt: (row.auto_release_at as string) ?? undefined,
    dispute: (row.dispute as DealDispute) ?? undefined,
    timeline: (row.timeline as TimelineEvent[]) ?? [],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Map our camelCase Deal fields to the table's snake_case columns for a patch. */
function toRow(fields: Partial<Deal>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (fields.status !== undefined) row.status = fields.status;
  if (fields.trust !== undefined) row.trust = fields.trust;
  if (fields.handoverCode !== undefined) row.handover_code = fields.handoverCode;
  if (fields.autoReleaseAt !== undefined) row.auto_release_at = fields.autoReleaseAt;
  if (fields.dispute !== undefined) row.dispute = fields.dispute;
  if (fields.timeline !== undefined) row.timeline = fields.timeline;
  if (fields.updatedAt !== undefined) row.updated_at = fields.updatedAt;
  return row;
}

export const supabaseStore = {
  async list(): Promise<Deal[]> {
    const { data, error } = await db().from("deals").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(fromRow);
  },

  async get(id: string): Promise<Deal | null> {
    const { data, error } = await db().from("deals").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  },

  async create(input: CreateDealInput, trust?: DealTrust): Promise<Deal> {
    const at = new Date().toISOString();
    const timeline: TimelineEvent[] = [{ at, status: "created", label: statusLabel("created") }];
    const { data, error } = await db()
      .from("deals")
      .insert({
        reference: newReference(),
        item: { title: input.item.title, amount: input.item.amount, currency: input.item.currency ?? "NGN" },
        seller: input.seller,
        buyer_email: input.buyerEmail ?? null,
        chat: input.chat ?? null,
        status: "created",
        trust: trust ?? null,
        timeline,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return fromRow(data);
  },

  async patch(id: string, fields: Partial<Deal>): Promise<Deal | null> {
    const { data, error } = await db().from("deals").update(toRow(fields)).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  },
};
