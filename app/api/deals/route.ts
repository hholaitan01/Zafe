/* ==========================================================================
   /api/deals
   GET  → list all deals (newest first)
   POST → create a deal { item:{title,amount,currency?}, seller:{...}, chat?, buyerEmail? }
          The Trust Score is computed and stored on the deal when a chat is given.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { getServerUser } from "@/lib/auth/server";
import { authConfigured } from "@/lib/auth/config";
import { createDeal, listDeals, listDealsForUser } from "@/lib/deals/store";
import type { CreateDealInput } from "@/lib/deals/types";
import { resolveContact } from "@/lib/profiles/store";

export async function GET(req: Request): Promise<Response> {
  const buyer = new URL(req.url).searchParams.get("buyer")?.trim() || "";

  // LIVE: scope strictly to the session. The ?buyer= param is ignored and an
  // unauthenticated request is rejected — so nobody can read another trader's
  // deals (or the whole table) by passing an arbitrary email or none at all.
  if (authConfigured()) {
    const user = await getServerUser();
    if (!user?.email) return jsonError("Sign in to view your deals.", 401);
    return Response.json({ deals: await listDealsForUser(user.email) });
  }

  // DEMO: single local sandbox, no cross-tenant data to protect.
  const deals = buyer ? await listDealsForUser(buyer) : await listDeals();
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
    // is the counterparty they're requesting money from (resolve @username).
    seller = { ...body.seller, contact: user?.email || body.seller.contact, name: body.seller.name || user?.name };
    buyerEmail = body.buyerEmail ? await resolveContact(body.buyerEmail) : undefined;
  } else {
    // Buyer-initiated (default): the creator is the buyer; resolve the seller's
    // contact (email / phone / @username) to a canonical identity.
    if (body.seller.contact) seller = { ...body.seller, contact: await resolveContact(body.seller.contact) };
    buyerEmail = user?.email || body.buyerEmail;
  }

  const deal = await createDeal({ item: body.item, seller, chat: body.chat, buyerEmail });
  return Response.json({ deal }, { status: 201 });
}
