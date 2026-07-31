/* ==========================================================================
   GET /auth/callback
   Where Google (and any OAuth provider) sends the user back after sign-in.
   Exchanges the one-time code for a Supabase session cookie, then forwards to
   the dashboard. In demo mode there are no keys, so it just redirects on.
   ========================================================================== */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/auth/config";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (authConfigured() && code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
