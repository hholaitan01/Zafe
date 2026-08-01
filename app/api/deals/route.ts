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
  const body = await readJson<CreateDealInput & { initiatedBy?: "buyer" | "seller" }>(req);
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

  // Who created this? The session is trusted for the creator's side.
  const user = await getServerUser();
  let seller = body.seller;
  let buyerEmail: string | undefined;
  if (body.initiatedBy === "seller") {
    // Seller-initiated "request payment": the creator is the SELLER; the buyer
    // is the counterparty they're requesting money from.
    seller = { ...body.seller, contact: user?.email || body.seller.contact, name: body.seller.name || user?.name };
    buyerEmail = body.buyerEmail;
  } else {
    // Buyer-initiated (default): the creator is the buyer.
    buyerEmail = user?.email || body.buyerEmail;
  }

  const deal = await createDeal({ item: body.item, seller, chat: body.chat, buyerEmail });
  return Response.json({ deal }, { status: 201 });
}
