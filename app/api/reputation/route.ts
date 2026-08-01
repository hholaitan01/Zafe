/* ==========================================================================
   GET /api/reputation
   The signed-in trader's own reputation (score, tier, factor breakdown, stats,
   and a one-line AI standing summary), computed from their escrow history.

   Identity comes from the Supabase session cookie in live mode. In demo mode
   there's no server session, so the client passes ?email= (and optional ?name=)
   from its local demo session — the dashboard already knows who it signed in.
   ========================================================================== */

import { getServerUser } from "@/lib/auth/server";
import { scoreReputation } from "@/lib/reputation/engine";
import { getReputation } from "@/lib/reputation/store";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const qEmail = url.searchParams.get("email")?.trim() || "";
  const qName = url.searchParams.get("name")?.trim() || undefined;

  // Prefer the trusted server session; fall back to the client-supplied email.
  const user = await getServerUser();
  const email = user?.email || qEmail;
  const name = user?.name || qName;

  // Not signed in anywhere → return an empty "new trader" standing.
  if (!email) {
    return Response.json({ reputation: scoreReputation("", []) });
  }

  const reputation = await getReputation(email, name);
  return Response.json({ reputation });
}
