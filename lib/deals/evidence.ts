/* ==========================================================================
   Dispute evidence files — upload to Supabase Storage, view via short-lived
   signed URLs.

   Evidence on a deal is a `string[]` (see DealDispute). A typed note or a pasted
   link is stored as-is; an UPLOADED file is stored as a marker string:
       zafe-file:<display name>|<storage path>
   so the same array carries both, the AI still reads a human label, and the
   object itself stays private in a bucket, reachable only through the
   access-checked view route (`GET /api/deals/:id/evidence?path=`).

   Setup (one-time): create a PRIVATE Storage bucket named `dispute-evidence`
   (or set EVIDENCE_BUCKET) in the same Supabase project. No public policy is
   needed — the server reads it with the service-role key and hands out signed
   URLs. With no Supabase configured, uploads are simply unavailable and the
   evidence list falls back to notes and links.
   ========================================================================== */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_ROLE_KEY, SUPABASE_URL } from "./config";

const BUCKET = process.env.EVIDENCE_BUCKET || "dispute-evidence";
export const EVIDENCE_MARKER = "zafe-file:";
const SIGNED_TTL_SECONDS = 60 * 60; // a view link is good for an hour
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

/** True when uploads can run (Supabase configured). */
export function evidenceConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  return client;
}

/** Strip any path and unsafe characters from a user-supplied file name. */
function safeName(name: string): string {
  const base = (name || "file").split(/[\\/]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "file";
}

export interface UploadResult {
  ok: boolean;
  /** The evidence-array marker to store, on success. */
  token?: string;
  error?: string;
}

/** Upload one evidence file for a deal; returns the marker to add to evidence. */
export async function uploadEvidence(dealId: string, file: File): Promise<UploadResult> {
  if (!evidenceConfigured()) return { ok: false, error: "not_configured" };
  if (!ALLOWED_TYPES.has(file.type)) return { ok: false, error: "Unsupported file type. Use a PNG, JPG, WEBP, GIF, or PDF." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That file is larger than 8MB." };

  const name = safeName(file.name);
  const path = `${dealId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await db().storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, token: `${EVIDENCE_MARKER}${name}|${path}` };
}

/** Parse an uploaded-file marker into its display name and storage path. */
export function parseFileToken(entry: string): { name: string; path: string } | null {
  if (!entry.startsWith(EVIDENCE_MARKER)) return null;
  const rest = entry.slice(EVIDENCE_MARKER.length);
  const bar = rest.indexOf("|");
  if (bar < 0) return null;
  const name = rest.slice(0, bar);
  const path = rest.slice(bar + 1);
  return name && path ? { name, path } : null;
}

/** A short-lived signed URL for a stored object, scoped to (and only to) a deal. */
export async function signedEvidenceUrl(dealId: string, path: string): Promise<string | null> {
  if (!evidenceConfigured() || !path) return null;
  // Traversal guard: the object must live under this deal's own prefix.
  if (!path.startsWith(`${dealId}/`) || path.includes("..")) return null;
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
