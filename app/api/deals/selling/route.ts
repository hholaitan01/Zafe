/* ==========================================================================
   GET /api/deals/selling?c=<contact>&c=<contact>
   The signed-in user's SALES — deals where they are the seller. Matched by the
   session email (trusted) plus any extra registered contacts (e.g. a phone the
   seller saved locally), passed as repeated ?c= params.
   ========================================================================== */

import { getServerUser } from "@/lib/auth/server";
import { listDealsBySellerContacts } from "@/lib/deals/store";

export async function GET(req: Request): Promise<Response> {
  const contacts = new URL(req.url).searchParams.getAll("c").map((s) => s.trim()).filter(Boolean);
  const user = await getServerUser();
  if (user?.email) contacts.push(user.email);
  const deals = await listDealsBySellerContacts(contacts);
  return Response.json({ deals });
}
