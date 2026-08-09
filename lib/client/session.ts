/* ==========================================================================
   Carries the "deal in progress" across screens.

   Deji's screens are separate routes with no params, so we stash the active
   deal id in sessionStorage when one is created/opened, and each downstream
   screen (Trust Score, Fund, Timeline, Code, Dispute) reads it back to load
   the real deal. Client-only.
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";

const KEY = "trustflow.currentDeal";
const CACHE_KEY = "trustflow.dealCache";
const CACHE_MAX = 40; // deals are small (no blobs); keep the most-recent handful

export function setCurrentDealId(id: string): void {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* storage unavailable — the screen will just show its empty state */
  }
}

export function getCurrentDealId(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/* ---- opportunistic rendering cache -------------------------------------
   The list screens already hold full Deal objects. Stash them so the deal
   detail (Timeline) can render instantly from what we already know, then
   reconcile with a fresh fetch — no skeleton flash on every open. */

export function cacheDeals(deals: Deal[]): void {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    const map: Record<string, Deal> = raw ? JSON.parse(raw) : {};
    for (const d of deals) if (d?.id) map[d.id] = d;
    // Cap the cache to the most-recently-updated deals so it can't grow forever.
    const kept = Object.values(map)
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))
      .slice(0, CACHE_MAX);
    const capped: Record<string, Deal> = {};
    for (const d of kept) capped[d.id] = d;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(capped));
  } catch {
    /* storage unavailable — callers just fall back to fetching */
  }
}

export function cacheDeal(deal: Deal | null | undefined): void {
  if (deal?.id) cacheDeals([deal]);
}

export function getCachedDeal(id: string | null): Deal | null {
  if (!id) return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const map: Record<string, Deal> = JSON.parse(raw);
    return map[id] ?? null;
  } catch {
    return null;
  }
}

/** Format kobo-free naira for display, e.g. 450000 → "₦450,000". */
export function naira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
