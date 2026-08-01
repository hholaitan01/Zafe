/* ==========================================================================
   /api/seller
   GET  ?email=<email>  → the seller's saved profile (verification + payout)
   POST { fullName, phone?, payout, email? } → verify + save the seller profile

   Identity: the session email (trusted) in live mode, else the client-supplied
   email in demo mode (the server has no session then).
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { getServerUser } from "@/lib/auth/server";
import { getSeller, upsertSeller, type SellerPayout } from "@/lib/sellers/store";

export async function GET(req: Request): Promise<Response> {
  const qEmail = new URL(req.url).searchParams.get("email")?.trim() || "";
  const user = await getServerUser();
  const email = user?.email || qEmail;
  if (!email) return Response.json({ seller: null });
  const seller = await getSeller(email);
  return Response.json({ seller });
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
