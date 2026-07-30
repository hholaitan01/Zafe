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

/** Read the current user, or null if signed out. */
export async function getCurrentUser(): Promise<TrustUser | null> {
  const supabase = getBrowserClient();
  if (!supabase) return getDemoSession();
  const { data } = await supabase.auth.getUser();
  return data.user ? toUser(data.user) : null;
}

/** Sign out of both modes. */
export async function signOut(): Promise<void> {
  const supabase = getBrowserClient();
  if (supabase) await supabase.auth.signOut();
  clearDemoSession();
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
