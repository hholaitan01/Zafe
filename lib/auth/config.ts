/* ==========================================================================
   Auth configuration seam (H2O).

   TrustFlow uses Supabase for email/Google sign-in. Just like the AI layer,
   auth has two modes:

   - LIVE  — NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set,
             so real Supabase auth runs (email/password + Google OAuth).
   - DEMO  — no keys set, so a lightweight local "demo session" stands in, and
             the login flow still carries a user through to the dashboard on
             stage with no backend. Swap in the keys and it goes live, no code
             change.

   These are NEXT_PUBLIC_* vars so the browser client can read them.
   ========================================================================== */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when real Supabase auth is available. */
export function authConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
