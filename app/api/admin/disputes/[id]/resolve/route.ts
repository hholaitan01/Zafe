/* ==========================================================================
   POST /api/admin/disputes/:id/resolve
   Body: { decision: "release_to_seller" | "refund_buyer" | "split",
           splitBuyerPercent?, note? }
   A human reviewer settles an escalated dispute: moves the money the guarded way
   and records who ruled and why. Admin-only (isAdmin, gated on ADMIN_EMAILS in
   live mode).
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { getServerUser, isAdmin } from "@/lib/auth/server";
import { adminResolveDispute } from "@/lib/deals/store";
import type { DisputeDecision } from "@/lib/ai/types";

const DECISIONS: DisputeDecision[] = ["release_to_seller", "refund_buyer", "split"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!(await isAdmin())) return jsonError("Not found", 404);
  const { id } = await params;
  const body = await readJson<{ decision?: string; splitBuyerPercent?: number; note?: string }>(req);
  if (!body || !body.decision || !DECISIONS.includes(body.decision as DisputeDecision)) {
    return jsonError("A valid decision is required (release_to_seller, refund_buyer, or split).");
  }
  let split = body.splitBuyerPercent;
  if (body.decision === "split") {
    if (typeof split !== "number" || split < 0 || split > 100) return jsonError("splitBuyerPercent must be between 0 and 100.");
  }
  const reviewer = (await getServerUser())?.email ?? "TrustFlow reviewer";
  const out = await adminResolveDispute(id, body.decision as DisputeDecision, { splitBuyerPercent: split, note: body.note, reviewer });
  if (!out.ok) return jsonError(out.error ?? "Couldn't resolve the dispute.", out.error === "not_found" ? 404 : 409);
  return Response.json({ deal: out.deal });
}
