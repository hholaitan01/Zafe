/* ==========================================================================
   GET /api/reputation
   The signed-in trader's own reputation (score, tier, factor breakdown, stats,
   and a one-line AI standing summary), computed from their escrow history.

   Identity comes from the Supabase session cookie in live mode. In demo mode
   there's no server session, so the client passes ?email= (and optional ?name=)
   from its local demo session — the dashboard already knows who it signed in.
   ========================================================================== */

import { getServerUser } from "@/lib/auth/server";
import { authConfigured } from "@/lib/auth/config";
import { scoreReputation } from "@/lib/reputation/engine";
import { getReputation } from "@/lib/reputation/store";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const qEmail = url.searchParams.get("email")?.trim() || "";
  const qName = url.searchParams.get("name")?.trim() || undefined;

  // Reputation exposes a trader's stats and history, so it's the CALLER'S own
  // only. In live mode the identity is the session (the ?email= param is
  // ignored, blocking `?email=victim` lookups); in demo mode the local client
  // supplies its own email.
  let email: string | undefined;
  let name: string | undefined;
  if (authConfigured()) {
    const user = await getServerUser();
    email = user?.email;
    name = user?.name;
  } else {
    email = qEmail;
    name = qName;
  }

  // Not signed in anywhere → return an empty "new trader" standing.
  if (!email) {
    return Response.json({ reputation: scoreReputation("", []) });
  }

  const reputation = await getReputation(email, name);
  return Response.json({ reputation });
}
