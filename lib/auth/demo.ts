/* ==========================================================================
   Demo-mode session store.

   When Supabase isn't configured, we keep a tiny "who's signed in" record in
   the browser so the login flow still works end to end on stage. This is NOT
   real auth — it's a stand-in that disappears the moment real Supabase keys
   are added. Never trust it for anything that matters.
   ========================================================================== */

import type { TrustUser } from "./types";

const KEY = "trustflow.demo-session";

export function setDemoSession(user: TrustUser): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    /* storage disabled — nothing we can do, the flow still proceeds */
  }
}

export function getDemoSession(): TrustUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrustUser) : null;
  } catch {
    return null;
  }
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Turn an email into a friendly display name ("ada.love@x.com" → "Ada Love"). */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || email
  );
}
