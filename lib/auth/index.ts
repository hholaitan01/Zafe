/* ==========================================================================
   The auth API the Login screen calls.

   One combined entry point for the "Welcome back — create an account or sign
   in" screen: signInOrUp() tries to sign the user in, and if they don't have
   an account yet, creates one. Plus Google OAuth, sign-out, and a session
   read. Every function works in LIVE mode (Supabase) and DEMO mode (local
   stand-in) so the flow is never blocked on backend keys.

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

/** Sign in with email + password; if there's no account yet, create one. */
export async function signInOrUp(email: string, password: string): Promise<AuthResult> {
  email = email.trim();
  if (!isValidEmail(email)) return { ok: false, mode: authConfigured() ? "live" : "demo", error: "Enter a valid email address." };
  if (password.length < 6) return { ok: false, mode: authConfigured() ? "live" : "demo", error: "Password must be at least 6 characters." };

  const supabase = getBrowserClient();

  // ---- DEMO mode: accept and remember locally. ----
  if (!supabase) {
    const user: TrustUser = { id: `demo-${email}`, email, name: nameFromEmail(email) };
    setDemoSession(user);
    return { ok: true, mode: "demo", user };
  }

  // ---- LIVE mode: try sign-in, fall back to sign-up for new users. ----
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (!signIn.error && signIn.data.user) {
    return { ok: true, mode: "live", user: toUser(signIn.data.user) };
  }

  const looksLikeNewUser = /invalid login credentials/i.test(signIn.error?.message ?? "");
  if (!looksLikeNewUser) {
    return { ok: false, mode: "live", error: friendly(signIn.error?.message) };
  }

  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) return { ok: false, mode: "live", error: friendly(signUp.error.message) };

  // Session present → signed in. No session → project requires email confirmation.
  if (signUp.data.session && signUp.data.user) {
    return { ok: true, mode: "live", user: toUser(signUp.data.user) };
  }
  return { ok: true, mode: "live", needsEmailConfirmation: true, user: signUp.data.user ? toUser(signUp.data.user) : undefined };
}

type OAuthProvider = "google" | "apple";

/** Start an OAuth flow. Returns a redirectUrl the caller should navigate to. */
async function signInWithProvider(provider: OAuthProvider, demoEmail: string): Promise<AuthResult> {
  const supabase = getBrowserClient();

  if (!supabase) {
    const user: TrustUser = { id: `demo-${provider}`, email: demoEmail, name: "Demo User" };
    setDemoSession(user);
    return { ok: true, mode: "demo", user };
  }

  const redirectTo = `${window.location.origin}/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) return { ok: false, mode: "live", error: friendly(error?.message) };
  return { ok: true, mode: "live", redirectUrl: data.url };
}

/** Primary sign-in: Continue with Google. */
export function signInWithGoogle(): Promise<AuthResult> {
  return signInWithProvider("google", "demo@trustflow.app");
}

/** Primary sign-in: Continue with Apple. */
export function signInWithApple(): Promise<AuthResult> {
  return signInWithProvider("apple", "demo@icloud.com");
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
