/* ==========================================================================
   The user's editable name parts (First / Other / Last).

   Source of truth is the server (`/api/profile`, the `profiles` store), so edits
   follow the user across devices. We keep a localStorage cache for instant
   prefill and offline fallback. The signed-in identity still comes from auth
   (Google's full name); this stores the user's own split/corrected version.
   ========================================================================== */

import { apiFetch } from "./api";

export interface UserNames {
  firstName: string;
  otherNames: string;
  lastName: string;
}

interface ProfileRecord {
  email: string;
  firstName?: string;
  otherNames?: string;
  lastName?: string;
}

const KEY = "trustflow.user-names";

/** Split a full name into first / other / last as a sensible default. */
export function splitName(full: string): UserNames {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", otherNames: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], otherNames: "", lastName: "" };
  return { firstName: parts[0], lastName: parts[parts.length - 1], otherNames: parts.slice(1, -1).join(" ") };
}

function cache(n: UserNames | null): void {
  if (typeof window === "undefined") return;
  try {
    if (n) window.localStorage.setItem(KEY, JSON.stringify(n));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage disabled — nothing to do */
  }
}

/** Fast, synchronous read of the cached name parts (for prefill). */
export function getUserNames(): UserNames | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserNames) : null;
  } catch {
    return null;
  }
}

function toNames(r: ProfileRecord | null): UserNames | null {
  if (!r) return null;
  return { firstName: r.firstName ?? "", otherNames: r.otherNames ?? "", lastName: r.lastName ?? "" };
}

/** Save the name parts server-side when we can, and always keep a local cache. */
export async function saveUserNames(names: UserNames, email?: string): Promise<UserNames> {
  try {
    const r = await apiFetch<{ profile: ProfileRecord }>("/api/profile", {
      method: "POST",
      body: JSON.stringify({ email, ...names }),
    });
    const server = toNames(r.profile);
    if (server) {
      cache(server);
      return server;
    }
  } catch {
    /* server rejected (e.g. no email) or offline — keep the local cache */
  }
  cache(names);
  return names;
}

/** Load the name parts from the server; keep the local cache if the server has none. */
export async function loadUserNames(email?: string): Promise<UserNames | null> {
  try {
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    const r = await apiFetch<{ profile: ProfileRecord | null }>(`/api/profile${q}`);
    if (r.profile) {
      const n = toNames(r.profile);
      cache(n);
      return n;
    }
    return getUserNames();
  } catch {
    return getUserNames();
  }
}
