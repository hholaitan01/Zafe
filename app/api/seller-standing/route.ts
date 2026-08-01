/* ==========================================================================
   GET /api/seller-standing?contact=<phone|email>
   The seller's standing across past TrustFlow deals, for the pre-payment check.
   ========================================================================== */

import { getSellerStanding } from "@/lib/seller/standing";

export async function GET(req: Request): Promise<Response> {
  const contact = new URL(req.url).searchParams.get("contact")?.trim() || "";
  if (!contact) return Response.json({ error: "A 'contact' query param is required." }, { status: 400 });
  const standing = await getSellerStanding(contact);
  return Response.json({ standing });
}
