/* ==========================================================================
   The auth API the Login screen calls.

   TrustFlow is passwordless — there are no passwords to phish, leak, or brute
   force. Two ways in:
     • Continue with Google (OAuth), and
     • a one-time email login link (Supabase magic link): type your email,
       we send a link, tapping it signs you in.

   Plus sign-out and a session read. Every function works in LIVE mode
   (Supabase) and DEMO mode (local stand-in) so the flow is never blocked on
   backend keys.

   Client-side only — these touch the browser Supabase client and localStorage.
   ========================================================================== */

import { getBrowserClient } from "./browser";
import { authConfigured } from "./config";
import { clearDemoSession, getDemoSession, nameFromEmail, setDemoSession } from "./demo";
import type { AuthResult, TrustUser } from "./types";

export type { AuthResult, TrustUser } from "./types";
export { authConfigured } from "./config";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Passwordless sign-in: email the user a one-time login link. Tapping it lands
 * on /auth/callback, which exchanges the code for a session — the same callback
 * OAuth uses. No account? The link creates one on first use.
 */
export async function sendMagicLink(email: string): Promise<AuthResult> {
  email = email.trim();
  if (!isValidEmail(email)) return { ok: false, mode: authConfigured() ? "live" : "demo", error: "Enter a valid email address." };

  const supabase = getBrowserClient();

  // ---- DEMO mode: there's no mail server, so sign in directly so the stage
  //      demo still works end to end with no backend. ----
  if (!supabase) {
    const user: TrustUser = { id: `demo-${email}`, email, name: nameFromEmail(email) };
    setDemoSession(user);
    return { ok: true, mode: "demo", user };
  }

  // ---- LIVE mode: send the magic link. ----
  const emailRedirectTo = `${window.location.origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
  if (error) return { ok: false, mode: "live", error: friendly(error.message) };
  return { ok: true, mode: "live", magicLinkSent: true };
}

/** Primary sign-in: Continue with Google (OAuth). Returns a redirectUrl to navigate to. */
export async function signInWithGoogle(): Promise<AuthResult> {
  const supabase = getBrowserClient();

  if (!supabase) {
    const user: TrustUser = { id: "demo-google", email: "demo@trustflow.app", name: "Demo User" };
    setDemoSession(user);
    return { ok: true, mode: "demo", user };
  }

  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return { ok: false, mode: "live", error: friendly(error?.message) };
  return { ok: true, mode: "live", redirectUrl: data.url };
}

/** Read the current user, or null if signed out. The display name prefers the
    name the user set in their Profile (which the greeting and avatar read) over
    the email-prefix fallback baked into the auth record. */
export async function getCurrentUser(): Promise<TrustUser | null> {
  const supabase = getBrowserClient();
  if (!supabase) return withProfileName(getDemoSession());
  const { data } = await supabase.auth.getUser();
  return data.user ? withProfileName(toUser(data.user)) : null;
}

/** Persist the user's chosen display name onto the auth record so it follows
    them across devices (Profile saves the name parts to the profiles table; this
    keeps the auth record's name in sync so every screen's greeting matches).
    Best-effort — never throws, so a failed sync can't block saving a profile. */
export async function syncDisplayName(fullName: string): Promise<void> {
  const name = (fullName || "").trim();
  if (!name) return;
  const supabase = getBrowserClient();
  try {
    if (supabase) await supabase.auth.updateUser({ data: { full_name: name } });
    else {
      const demo = getDemoSession();
      if (demo) setDemoSession({ ...demo, name });
    }
  } catch {
    /* the profiles table is the source of truth; the local cache still fixes the UI */
  }
}

/** Override an auth record's name with the Profile name cached in this browser
    (written by lib/client/user-profile). Read directly to avoid coupling auth to
    the client layer. */
function withProfileName(user: TrustUser | null): TrustUser | null {
  if (!user) return user;
  const cached = cachedProfileName();
  return cached ? { ...user, name: cached } : user;
}

function cachedProfileName(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem("trustflow.user-profile");
    if (!raw) return undefined;
    const p = JSON.parse(raw) as { firstName?: string; otherNames?: string; lastName?: string };
    const full = [p.firstName, p.otherNames, p.lastName].map((s) => (s || "").trim()).filter(Boolean).join(" ");
    return full || undefined;
  } catch {
    return undefined;
  }
}

/** Sign out of both modes. */
export async function signOut(): Promise<void> {
  // 1. Revoke the Supabase session first (server round-trip + clears its
  //    sb-* auth cookies and token storage). Needs the token, so do it before
  //    we wipe local storage.
  const supabase = getBrowserClient();
  try {
    if (supabase) await supabase.auth.signOut();
  } catch {
    /* proceed with the local wipe regardless */
  }
  clearDemoSession();

  // 2. Leave no trace of the previous user on this device (it may be shared):
  //    every cached deal, profile, and session flag goes.
  if (typeof window !== "undefined") {
    try {
      window.localStorage.clear();
    } catch {
      /* storage may be unavailable (private mode) */
    }
    try {
      window.sessionStorage.clear();
    } catch {
      /* ignore */
    }
    clearClientCookies();
  }
}

/** Expire every JS-readable cookie (auth/session cookies included). HttpOnly
    cookies can't be touched from JS — those are cleared by the Supabase
    signOut() call above and the middleware. */
function clearClientCookies(): void {
  if (typeof document === "undefined") return;
  const host = location.hostname;
  const baseDomain = host.split(".").slice(-2).join(".");
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0].trim();
    if (!name) continue;
    const expire = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = expire;
    document.cookie = `${expire}; domain=${host}`;
    document.cookie = `${expire}; domain=.${baseDomain}`;
  }
}

/* ------------------------------- helpers -------------------------------- */

function toUser(u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): TrustUser {
  const email = u.email ?? "";
  const metaName = typeof u.user_metadata?.full_name === "string" ? u.user_metadata.full_name : undefined;
  return { id: u.id, email, name: metaName ?? (email ? nameFromEmail(email) : undefined) };
}

function friendly(message?: string): string {
  if (!message) return "Something went wrong. Please try again.";
  if (/user already registered/i.test(message)) return "That email is already registered — check your password.";
  if (/rate limit/i.test(message)) return "Too many attempts. Please wait a moment and try again.";
  return message;
}
