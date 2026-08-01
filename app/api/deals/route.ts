/* ==========================================================================
   /api/deals
   GET  → list all deals (newest first)
   POST → create a deal { item:{title,amount,currency?}, seller:{...}, chat?, buyerEmail? }
          The Trust Score is computed and stored on the deal when a chat is given.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { getServerUser } from "@/lib/auth/server";
import { createDeal, listDeals, listDealsForUser } from "@/lib/deals/store";
import type { CreateDealInput } from "@/lib/deals/types";

export async function GET(req: Request): Promise<Response> {
  // Scope to the signed-in trader: the session cookie (live) wins, else the
  // client-supplied ?buyer= (demo). With no identity at all, list everything.
  const buyer = new URL(req.url).searchParams.get("buyer")?.trim() || "";
  const user = await getServerUser();
  const email = user?.email || buyer;
  const deals = email ? await listDealsForUser(email) : await listDeals();
  return Response.json({ deals });
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<CreateDealInput>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!body.item || !isNonEmptyString(body.item.title)) {
    return jsonError("item.title is required.");
  }
  if (typeof body.item.amount !== "number" || !(body.item.amount > 0)) {
    return jsonError("item.amount must be a positive number.");
  }
  if (!body.seller || typeof body.seller !== "object") {
    return jsonError("A 'seller' object is required.");
  }

  // Attribute the deal to the signed-in trader (server session is trusted over
  // any client-supplied email) so it counts toward their reputation.
  const user = await getServerUser();
  const deal = await createDeal({
    item: body.item,
    seller: body.seller,
    chat: body.chat,
    buyerEmail: user?.email || body.buyerEmail,
  });
  return Response.json({ deal }, { status: 201 });
}
