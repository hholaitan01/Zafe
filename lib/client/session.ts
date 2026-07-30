/* ==========================================================================
   Carries the "deal in progress" across screens.

   Deji's screens are separate routes with no params, so we stash the active
   deal id in sessionStorage when one is created/opened, and each downstream
   screen (Trust Score, Fund, Timeline, Code, Dispute) reads it back to load
   the real deal. Client-only.
   ========================================================================== */

const KEY = "trustflow.currentDeal";

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

/** Format kobo-free naira for display, e.g. 450000 → "₦450,000". */
export function naira(amount: number): string {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}
