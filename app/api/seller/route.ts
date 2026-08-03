/* ==========================================================================
   /api/seller
   GET  ?email=<email>  → the seller's saved profile (verification + payout)
   POST { fullName, phone?, payout, email? } → verify + save the seller profile

   Identity: the session email (trusted) in live mode, else the client-supplied
   email in demo mode (the server has no session then).
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authConfigured } from "@/lib/auth/config";
import { getServerUser } from "@/lib/auth/server";
import { getSeller, upsertSeller, type SellerPayout } from "@/lib/sellers/store";

// A seller profile carries the payout account (sensitive), so GET only ever
// returns the CALLER's own profile. In live mode that's the session email and
// the ?email= param is ignored; in demo mode (no session) the local session's
// email is used. Never look up another person's payout by arbitrary email.
export async function GET(req: Request): Promise<Response> {
  if (authConfigured()) {
    const user = await getServerUser();
    if (!user?.email) return Response.json({ seller: null });
    return Response.json({ seller: await getSeller(user.email) });
  }
  const qEmail = new URL(req.url).searchParams.get("email")?.trim() || "";
  if (!qEmail) return Response.json({ seller: null });
  return Response.json({ seller: await getSeller(qEmail) });
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ email?: string; fullName?: string; phone?: string; payout?: SellerPayout }>(req);
  if (!body) return jsonError("Invalid JSON body");

  const user = await getServerUser();
  const email = user?.email || body.email?.trim() || "";
  if (!email) return jsonError("A seller email is required.");
  if (!body.payout?.accountNumber || !body.payout?.accountName) {
    return jsonError("A payout account (number + name) is required to get paid.");
  }

  const seller = await upsertSeller({
    email,
    fullName: body.fullName,
    phone: body.phone,
    idVerified: true,
    payout: body.payout,
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ seller });
}
