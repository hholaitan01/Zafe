/* ==========================================================================
   POST /api/escrow  { dealId }
   Generate the buyer's one-time ALATPay collection account for a deal and store
   it (with our tighter ~10-min expiry). Live in ALAT mode; a simulated NUBAN in
   demo mode. The deal is marked "funded" later by the ALATPay webhook.
   (Ported from Jerry's escrow route; now on the `deals` model.)
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { attachCollectionAccount, getDeal } from "@/lib/deals/store";
import { createCollectionAccount } from "@/lib/payments";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ dealId?: string }>(req);
  if (!body?.dealId) return jsonError("dealId is required.");

  const deal = await getDeal(body.dealId);
  if (!deal) return jsonError("Deal not found.", 404);

  const account = await createCollectionAccount(deal);
  await attachCollectionAccount(deal.id, { accountNumber: account.accountNumber, expiresAt: account.expiresAt, alatTransactionId: account.alatTransactionId });

  return Response.json({ account });
}
