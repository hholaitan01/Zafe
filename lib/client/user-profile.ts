/* ==========================================================================
   The user's profile on the client: name parts (First / Other / Last), an
   optional @username, and a photo. Source of truth is the server
   (`/api/profile`, the `profiles` store); we keep a localStorage cache for
   instant prefill and offline fallback.

   `hasRecord` tells the UI whether the one-time name edit has been used: once a
   record exists, first/last names are locked and only a not-yet-set other name
   can still be added.
   ========================================================================== */

import { apiFetch } from "./api";

export interface UserProfile {
  firstName: string;
  otherNames: string;
  lastName: string;
  username: string;
  photo: string;
}

export interface LoadedProfile extends UserProfile {
  hasRecord: boolean; // a saved profile exists → names are locked
  otherLocked: boolean; // other-names already set
}

interface ProfileRow {
  email?: string;
  firstName?: string;
  otherNames?: string;
  lastName?: string;
  username?: string;
  photo?: string;
}

const KEY = "trustflow.user-profile";
const EMPTY: UserProfile = { firstName: "", otherNames: "", lastName: "", username: "", photo: "" };

/** Split a full name into first / other / last as a sensible default. */
export function splitName(full: string): { firstName: string; otherNames: string; lastName: string } {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", otherNames: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], otherNames: "", lastName: "" };
  return { firstName: parts[0], lastName: parts[parts.length - 1], otherNames: parts.slice(1, -1).join(" ") };
}

function fromRow(r: ProfileRow): UserProfile {
  return { firstName: r.firstName ?? "", otherNames: r.otherNames ?? "", lastName: r.lastName ?? "", username: r.username ?? "", photo: r.photo ?? "" };
}

function cache(p: UserProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (p) window.localStorage.setItem(KEY, JSON.stringify(p));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage disabled */
  }
}

export function getCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as UserProfile) } : null;
  } catch {
    return null;
  }
}

/** Save the profile server-side. Throws on a real error (e.g. username taken,
    no session email) so the caller can show it; caches the result on success. */
export async function saveUserProfile(input: Partial<UserProfile>, email?: string): Promise<UserProfile> {
  const r = await apiFetch<{ profile: ProfileRow | null }>("/api/profile", {
    method: "POST",
    body: JSON.stringify({ email, ...input }),
  });
  const p = r.profile ? fromRow(r.profile) : ({ ...(getCachedProfile() ?? EMPTY), ...input } as UserProfile);
  cache(p);
  return p;
}

/** Load the profile from the server; keep the local cache if the server has none. */
export async function loadUserProfile(email?: string): Promise<LoadedProfile> {
  try {
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    const r = await apiFetch<{ profile: ProfileRow | null }>(`/api/profile${q}`);
    if (r.profile) {
      const p = fromRow(r.profile);
      cache(p);
      return { ...p, hasRecord: true, otherLocked: !!p.otherNames };
    }
  } catch {
    /* offline — fall back to cache */
  }
  const cached = getCachedProfile();
  return { ...(cached ?? EMPTY), hasRecord: false, otherLocked: false };
}
