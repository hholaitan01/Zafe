/* ==========================================================================
   POST /api/admin/ledger/retry   { key }
   Re-drive a stuck money-move from the settlement exception queue. The key is a
   settlement key ("payout:<dealId>" / "refund:<dealId>"). Admin-only.

   Safe by construction: the settlement claim inside the payout/refund path means
   a move that actually succeeded is never sent again — a retry of one already
   done short-circuits. Disputed deals are excluded here because their settlement
   needs a decision (the buyer's share, the split percent); those re-drive from
   the dispute review queue instead, so this endpoint never guesses an amount.
   ========================================================================== */

import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import { isAdmin } from "@/lib/auth/server";
import { getDeal, refundDeal, releaseToSeller } from "@/lib/deals/store";
import { publicDeal } from "@/lib/deals/redact";

export async function POST(req: Request): Promise<Response> {
  if (!(await isAdmin())) return jsonError("Not found", 404);
  const body = await readJson<{ key?: string }>(req);
  if (!body || !isNonEmptyString(body.key)) return jsonError("A settlement 'key' is required.");

  const idx = body.key.indexOf(":");
  const kind = idx > 0 ? body.key.slice(0, idx) : "";
  const dealId = idx > 0 ? body.key.slice(idx + 1) : "";
  if ((kind !== "payout" && kind !== "refund") || !dealId) {
    return jsonError("Unrecognized settlement key.");
  }

  const deal = await getDeal(dealId);
  if (!deal) return jsonError("Deal not found", 404);
  if (deal.dispute) {
    return jsonError("This deal is in a dispute. Re-drive it from the dispute review queue, not here.", 409);
  }

  const result = kind === "payout"
    ? await releaseToSeller(dealId, "reconciliation retry")
    : await refundDeal(dealId);

  if (!result.ok) return jsonError(result.error ?? "The retry did not go through.", 422);
  return Response.json({ ok: true, deal: publicDeal(result.deal) });
}
