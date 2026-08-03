/* ==========================================================================
   POST /api/escrow  { dealId }
   Mint the buyer's ALATPay collection account for a deal and store it.

   - LIVE: return the one-time account to transfer into; the deal is funded
     later, only by the verified ALATPay webhook. { funded: false }
   - MOCK: there's no real rail, so the deposit "lands" immediately — we fund
     the deal here on the SERVER (the client can't set funded itself). { funded: true }
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { attachCollectionAccount, setDealStatus } from "@/lib/deals/store";
import { createCollectionAccount } from "@/lib/payments";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ dealId?: string }>(req);
  if (!body?.dealId) return jsonError("dealId is required.");

  // Only a party to the deal may start funding it (guards against IDOR).
  const access = await authorizeDeal(body.dealId);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to pay for this deal." : "Deal not found.", access.status);
  const deal = access.deal;

  let account;
  try {
    account = await createCollectionAccount(deal);
  } catch {
    return jsonError("Couldn't start the payment. Please try again.", 502);
  }
  await attachCollectionAccount(deal.id, { accountNumber: account.accountNumber, expiresAt: account.expiresAt, alatTransactionId: account.alatTransactionId });

  // Demo only: no real payment rail, so mark it funded now (server-side).
  if (account.mode === "mock") {
    await setDealStatus(deal.id, "funded", "Buyer paid into escrow (demo)");
    return Response.json({ account, funded: true });
  }
  return Response.json({ account, funded: false });
}
