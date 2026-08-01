/* ==========================================================================
   POST /api/payout  { dealId, via? }
   Release the escrowed money to the seller and complete the deal. The screens
   normally reach this through releaseWithCode / auto-release (which pay out via
   the same seam); this is the direct REST entry (live ALAT / external trigger).
   Idempotent: a deal that already has a payoutRef isn't paid twice.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { releaseToSeller } from "@/lib/deals/store";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ dealId?: string; via?: string }>(req);
  if (!body?.dealId) return jsonError("dealId is required.");

  const result = await releaseToSeller(body.dealId, body.via);
  if (!result.ok) return jsonError(result.error ?? "Payout failed.", result.error === "not_found" ? 404 : 400);

  return Response.json({ ok: true, deal: result.deal, payoutRef: result.deal?.payoutRef });
}
