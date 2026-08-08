/* ==========================================================================
   GET /api/admin/aml
   The AML monitoring queue: every deal that trips a transaction-monitoring rule
   (large / reportable amount, AI-risky, dispute lost), with its flags. Read-time
   only — no extra storage. Admin-only (isAdmin: open in demo, ADMIN_EMAILS in
   live); returns 404 to non-admins.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { isAdmin } from "@/lib/auth/server";
import { listDeals } from "@/lib/deals/store";
import { assessDeal } from "@/lib/compliance/monitoring";

export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return jsonError("Not found", 404);
  const deals = await listDeals();
  const flagged = deals
    .map((d) => ({ deal: d, flags: assessDeal(d) }))
    .filter((x) => x.flags.length > 0)
    .sort((a, b) => b.deal.createdAt.localeCompare(a.deal.createdAt));
  return Response.json({ items: flagged });
}
