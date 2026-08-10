/* ==========================================================================
   Server-side "who's signed in?" (live mode).

   Reads the Supabase auth session from the request cookies inside a route
   handler or server component, so the server can scope data to the real user
   without trusting a client-supplied identity. Returns null in demo mode (no
   keys) or when there's no session — callers then fall back to a passed email.

   Server-only: imports next/headers. Never import this from a client component.
   ========================================================================== */

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SERVICE_ROLE_KEY } from "@/lib/deals/config";
import { authConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { nameFromEmail } from "./demo";
import type { TrustUser } from "./types";

export async function getServerUser(): Promise<TrustUser | null> {
  if (!authConfigured()) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Read-only here; the middleware handles token refresh on navigation.
      setAll: () => {},
    },
  });

  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;

  const email = u.email ?? "";
  const metaName = typeof u.user_metadata?.full_name === "string" ? u.user_metadata.full_name : undefined;
  return { id: u.id, email, name: metaName ?? (email ? nameFromEmail(email) : undefined) };
}

/**
 * The caller's TRUSTED identity for a route handler.
 *
 *  - live mode: the Supabase session user only. Client-supplied emails are
 *    ignored, so an attacker can't impersonate anyone by passing ?email= or
 *    { email } in the body. Returns null when there is no session (→ 401).
 *  - demo mode: there is no server session, so the client's local demo identity
 *    is trusted via `demoFallback` (single-user sandbox, no cross-tenant data).
 *
 * Every route that previously did `getServerUser()?.email || body.email` should
 * use this instead — that fallback was NOT gated to demo mode, which let an
 * unauthenticated live request act as any email.
 */
export async function requireCaller(demoFallback?: { email?: string; name?: string }): Promise<TrustUser | null> {
  if (!authConfigured()) {
    const email = demoFallback?.email?.trim();
    return email ? { id: `demo-${email}`, email, name: demoFallback?.name?.trim() } : null;
  }
  return getServerUser();
}

/**
 * Whether the caller may act as a TrustFlow reviewer (the dispute review queue).
 *  - demo mode: allowed (single local sandbox, so the queue is explorable).
 *  - live mode: the session email must be in ADMIN_EMAILS (comma-separated).
 * Fails closed: no session or no allowlist in live mode → not an admin.
 */
export async function isAdmin(): Promise<boolean> {
  if (!authConfigured()) return true;
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length) return false;
  const user = await getServerUser();
  return !!user?.email && allow.includes(user.email.trim().toLowerCase());
}

/**
 * Deactivate a Supabase auth user by id — bans them so they can no longer sign
 * in, WITHOUT deleting the account. This is how account closure works for a
 * regulated fintech: KYC and transaction data must be retained (CBN/AML require
 * ~5 years), so we block access and keep the record rather than erasing it. The
 * eventual purge (after the retention window) uses deleteAuthUser. Service-role
 * admin API — call only after confirming the caller is that user.
 */
export async function deactivateAuthUser(userId: string): Promise<boolean> {
  if (!authConfigured() || !SERVICE_ROLE_KEY || !userId) return false;
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    // A very long ban ( > 100 years ) effectively disables sign-in for good.
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Permanently delete a Supabase auth user by id. Used by the retention purge
 * once the legal hold period has passed — NOT on account closure (which
 * deactivates + retains via deactivateAuthUser). Service-role admin API.
 */
export async function deleteAuthUser(userId: string): Promise<boolean> {
  if (!authConfigured() || !SERVICE_ROLE_KEY || !userId) return false;
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await admin.auth.admin.deleteUser(userId);
    return !error;
  } catch {
    return false;
  }
}
