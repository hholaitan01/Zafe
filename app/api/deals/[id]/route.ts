/* ==========================================================================
   /api/deals/[id]
   GET   → one deal
   PATCH → advance the deal { status, note? } for the NON-money transitions only.

   Money/settlement statuses are deliberately NOT settable here — they can only
   be reached through the flows that actually move (and verify) the money:
     • funded    → the verified ALATPay webhook (/api/webhooks/alatpay)
     • completed → release-with-code / auto-release / payout (all check the transfer)
     • refunded/resolved → the refund + dispute flows (all check the transfer)
   Allowing them here would let a client mark a deal paid without any money moving.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { setDealStatus } from "@/lib/deals/store";
import type { DealStatus } from "@/lib/deals/types";

// Non-money transitions a client may set directly.
const PATCHABLE_STATUS: DealStatus[] = ["created", "shipped", "disputed"];
// Money/settlement statuses that must come from a verified money-move flow.
const PROTECTED_STATUS: DealStatus[] = ["funded", "completed", "refunded", "resolved"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Only a party to the deal may read it (guards against IDOR).
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to view this deal." : "Deal not found", access.status);
  return Response.json({ deal: access.deal });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  // Only a party to the deal may change it (guards against IDOR).
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

  const deal = await setDealStatus(id, body.status as DealStatus, body.note);
  if (!deal) return jsonError("Deal not found", 404);
  return Response.json({ deal });
}
