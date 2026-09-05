/* ==========================================================================
   /api/deals/[id]
   GET   → one deal
   PATCH → advance the deal { status, note? } for the NON-money transitions only.

   Money/settlement statuses are deliberately NOT settable here — they can only
   be reached through the flows that actually move (and verify) the money.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { setDealStatus } from "@/lib/deals/store";
import type { DealStatus } from "@/lib/deals/types";

const PATCHABLE_STATUS: DealStatus[] = ["created", "shipped", "disputed"];
const PROTECTED_STATUS: DealStatus[] = ["funded", "completed", "refunded", "resolved"];

function publicDealForRole(deal: Awaited<ReturnType<typeof authorizeDeal>> extends { ok: true; deal: infer D } ? D : never, role: string) {
  if (role === "demo") return deal;

  // The handover code is a buyer-only secret. Payout destinations are also
  // private: each side only needs its own account details, never the other
  // party's banking information.
  if (role === "buyer") {
    return { ...deal, handoverCode: deal.handoverCode, sellerPayout: undefined };
  }
  if (role === "seller") {
    return { ...deal, handoverCode: undefined, buyerPayout: undefined };
  }
  return { ...deal, handoverCode: undefined, sellerPayout: undefined, buyerPayout: undefined };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to view this deal." : "Deal not found", access.status);
  const role = await callerRoleOnDeal(access.deal);
  return Response.json({ deal: publicDealForRole(access.deal, role) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to change this deal." : "Deal not found", access.status);

  const body = await readJson<{ status?: string; note?: string }>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (body.status && PROTECTED_STATUS.includes(body.status as DealStatus)) {
    return jsonError(`'${body.status}' is set by the payment/dispute flow, not directly.`, 409);
  }
  if (!body.status || !PATCHABLE_STATUS.includes(body.status as DealStatus)) {
    return jsonError(`status must be one of: ${PATCHABLE_STATUS.join(", ")}`);
  }

  const role = await callerRoleOnDeal(access.deal);
  if (role !== "demo") {
    // Only the seller may mark a funded deal as shipped. Disputes can be opened
    // by either party; "created" is kept buyer-side for normal lifecycle use.
    if (body.status === "shipped" && role !== "seller") {
      return jsonError("Only the seller can mark an item as shipped.", 403);
    }
    if (body.status === "created" && role !== "buyer") {
      return jsonError("Only the buyer can reset a deal to created.", 403);
    }
  }

  const deal = await setDealStatus(id, body.status as DealStatus, body.note);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal: publicDealForRole(deal, role) });
}
