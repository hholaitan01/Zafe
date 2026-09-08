/* ==========================================================================
   Small shared helpers for the deal layer: id/reference generation, timeline
   labels, and the human-readable text for each status transition.
   ========================================================================== */

import type { DealStatus } from "./types";

// Unambiguous alphabet (no 0/O/1/I/L) for a readable but hard-to-guess reference.
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * A reference like "TF-7QH2K9MP" for the UI and receipts. Cryptographically
 * random over 8 symbols (~30^8 ≈ 6.5e11 space), so it can't be guessed or
 * enumerated — the old 4-char Math.random() value was both short and
 * predictable. Uniqueness is also enforced at the database (schema.sql).
 */
export function newReference(): string {
  const buf = new Uint8Array(8);
  globalThis.crypto.getRandomValues(buf);
  let s = "";
  for (const b of buf) s += REF_ALPHABET[b % REF_ALPHABET.length];
  return `TF-${s}`;
}

export function newId(): string {
  // crypto.randomUUID is available in Node 18+ and the Edge runtime.
  return globalThis.crypto?.randomUUID?.() ?? `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const STATUS_LABEL: Record<DealStatus, string> = {
  created: "Deal created",
  funded: "Money held in escrow",
  shipped: "Item shipped",
  completed: "Completed — seller paid",
  disputed: "Dispute opened",
  under_review: "Under human review",
  refunded: "Refunded to buyer",
  resolved: "Dispute resolved",
};

export function statusLabel(status: DealStatus): string {
  return STATUS_LABEL[status];
}

/** The order a normal deal moves through, for validating transitions. */
export const HAPPY_PATH: DealStatus[] = ["created", "funded", "shipped", "completed"];

/** A 6-digit handover code the buyer keeps secret until they've got the item.
    Uses the CSPRNG (not Math.random) so it can't be predicted; the release route
    also rate-limits attempts so the 1e6 space can't be brute-forced. */
export function newHandoverCode(): string {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return String(100000 + (buf[0]! % 900000));
}

/** How long after shipment the money auto-releases if the buyer never confirms. */
export const AUTO_RELEASE_DAYS = 3;

export function autoReleaseTime(fromISO = new Date().toISOString()): string {
  return new Date(new Date(fromISO).getTime() + AUTO_RELEASE_DAYS * 86_400_000).toISOString();
}

/** Normalise a phone/email so the same seller matches regardless of formatting
    ("+234 803 555 0142" == "+2348035550142", "A@X.com" == "a@x.com"). */
export function normalizeContact(contact: string): string {
  return contact.trim().toLowerCase().replace(/[\s\-()]/g, "");
}
