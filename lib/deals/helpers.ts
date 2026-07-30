/* ==========================================================================
   Small shared helpers for the deal layer: id/reference generation, timeline
   labels, and the human-readable text for each status transition.
   ========================================================================== */

import type { DealStatus } from "./types";

/** A short, readable reference like "TF-8A3K" for the UI and receipts. */
export function newReference(): string {
  const s = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `TF-${s.slice(0, 4).padEnd(4, "0")}`;
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
  refunded: "Refunded to buyer",
  resolved: "Dispute resolved",
};

export function statusLabel(status: DealStatus): string {
  return STATUS_LABEL[status];
}

/** The order a normal deal moves through, for validating transitions. */
export const HAPPY_PATH: DealStatus[] = ["created", "funded", "shipped", "completed"];

/** A 6-digit handover code the buyer keeps secret until they've got the item. */
export function newHandoverCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** How long after shipment the money auto-releases if the buyer never confirms. */
export const AUTO_RELEASE_DAYS = 3;

export function autoReleaseTime(fromISO = new Date().toISOString()): string {
  return new Date(new Date(fromISO).getTime() + AUTO_RELEASE_DAYS * 86_400_000).toISOString();
}
