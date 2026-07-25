/* ==========================================================================
   Keeps the Supabase auth session fresh on every navigation (live mode).

   Supabase access tokens are short-lived; this refreshes them and writes the
   updated cookies back so server components and route handlers see a valid
   session. When auth isn't configured (demo mode) it's a no-op passthrough.
   ========================================================================== */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/auth/config";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (!authConfigured()) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touching getUser() triggers a token refresh when needed.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Run on pages, not on static assets or API routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
