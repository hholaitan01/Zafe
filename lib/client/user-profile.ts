/* ==========================================================================
   The user's editable name parts (First / Other / Last), kept in the browser.

   The signed-in identity comes from auth (Google gives one full name); this lets
   the user split/correct it on the Profile screen. Local-only for now — a small
   convenience store, like the seller-profile cache.
   ========================================================================== */

export interface UserNames {
  firstName: string;
  otherNames: string;
  lastName: string;
}

const KEY = "trustflow.user-names";

/** Split a full name into first / other / last as a sensible default. */
export function splitName(full: string): UserNames {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", otherNames: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], otherNames: "", lastName: "" };
  return { firstName: parts[0], lastName: parts[parts.length - 1], otherNames: parts.slice(1, -1).join(" ") };
}

export function getUserNames(): UserNames | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserNames) : null;
  } catch {
    return null;
  }
}

export function saveUserNames(n: UserNames): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(n));
  } catch {
    /* storage disabled — nothing to do */
  }
}
