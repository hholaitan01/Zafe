/* ==========================================================================
   POST /api/payout  { dealId, via? }
   Release the escrowed money to the seller and complete the deal. The screens
   normally reach this through releaseWithCode / auto-release (which pay out via
   the same seam); this is the direct REST entry (live ALAT / external trigger).
   Idempotent: a deal that already has a payoutRef isn't paid twice.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal, callerRoleOnDeal } from "@/lib/deals/access";
import { releaseToSeller } from "@/lib/deals/store";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ dealId?: string; via?: string }>(req);
  if (!body?.dealId) return jsonError("dealId is required.");

  // Releasing escrow to the seller is the buyer's "confirm receipt" action.
  // Guard against IDOR (must be a party) AND against a seller self-releasing
  // their own escrow without the buyer confirming — only the buyer may.
  const access = await authorizeDeal(body.dealId);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to release this deal." : "Deal not found", access.status);
  const role = await callerRoleOnDeal(access.deal);
  if (role === "seller" || role === "other") {
    return jsonError("Only the buyer can release escrow. Use the handover code, or wait for auto-release.", 403);
  }

  const result = await releaseToSeller(body.dealId, body.via);
  if (!result.ok) return jsonError(result.error ?? "Payout failed.", result.error === "not_found" ? 404 : 400);

  return Response.json({ ok: true, deal: result.deal, payoutRef: result.deal?.payoutRef });
}
