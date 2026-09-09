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
import { requireCapability } from "@/lib/auth/server";
import { getDeal, recoverSplitRemainder, refundDeal, releaseToSeller } from "@/lib/deals/store";
import { publicDeal } from "@/lib/deals/redact";
import { recordAudit } from "@/lib/audit/log";

export async function POST(req: Request): Promise<Response> {
  const caller = await requireCapability("reconciliation.retry");
  if (!caller) return jsonError("Not found", 404);
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
    // A resolved split's stranded seller-remainder leg re-drives here — safely,
    // via the settlement claim — since the deal is terminal and the review path
    // can no longer move it (audit #9). Every other disputed deal still routes
    // to the review queue so this endpoint never guesses a settlement amount.
    if (kind === "payout" && deal.status === "resolved") {
      const recovered = await recoverSplitRemainder(dealId);
      if (!recovered.ok) return jsonError(recovered.error ?? "The retry did not go through.", 422);
      await recordAudit({
        actorEmail: caller.email,
        actorRole: caller.role,
        action: "settlement.retry",
        target: body.key,
        meta: { kind, dealId, newStatus: recovered.deal?.status, recovery: "split-remainder" },
      });
      return Response.json({ ok: true, deal: publicDeal(recovered.deal) });
    }
    return jsonError("This deal is in a dispute. Re-drive it from the dispute review queue, not here.", 409);
  }

  const result = kind === "payout"
    ? await releaseToSeller(dealId, "reconciliation retry")
    : await refundDeal(dealId);

  if (!result.ok) return jsonError(result.error ?? "The retry did not go through.", 422);
  await recordAudit({
    actorEmail: caller.email,
    actorRole: caller.role,
    action: "settlement.retry",
    target: body.key,
    meta: { kind, dealId, newStatus: result.deal?.status },
  });
  return Response.json({ ok: true, deal: publicDeal(result.deal) });
}
