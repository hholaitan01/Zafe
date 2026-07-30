/* ==========================================================================
   Supabase browser client (for client components).
   Only created when auth is configured; returns null in demo mode so callers
   can take the demo path instead of crashing on missing keys.
   ========================================================================== */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  if (!authConfigured()) return null;
  if (!client) client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
