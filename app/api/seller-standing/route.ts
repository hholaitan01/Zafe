/* ==========================================================================
   GET /api/seller-standing?contact=<phone|email>
   The seller's standing across past Zafe deals, for the pre-payment check.
   ========================================================================== */

import { authConfigured } from "@/lib/auth/config";
import { getServerUser } from "@/lib/auth/server";
import { getSellerStanding } from "@/lib/seller/standing";

export async function GET(req: Request): Promise<Response> {
  // A pre-payment check any signed-in trader may run, but not the anonymous
  // public — otherwise the endpoint lets anyone enumerate sellers' histories by
  // contact. Live mode requires a session; demo is the open local sandbox.
  if (authConfigured()) {
    const user = await getServerUser();
    if (!user?.email) return Response.json({ error: "Sign in to check a seller." }, { status: 401 });
  }
  const contact = new URL(req.url).searchParams.get("contact")?.trim() || "";
  if (!contact) return Response.json({ error: "A 'contact' query param is required." }, { status: 400 });
  const standing = await getSellerStanding(contact);
  return Response.json({ standing });
}
