/* ==========================================================================
   POST /api/admin/disputes/:id/resolve
   Body: { decision: "release_to_seller" | "refund_buyer" | "split",
           splitBuyerPercent?, note? }
   A human reviewer settles an escalated dispute: moves the money the guarded way
   and records who ruled and why. Admin-only (isAdmin, gated on ADMIN_EMAILS in
   live mode).
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { requireCapability } from "@/lib/auth/server";
import { adminResolveDispute, getDeal } from "@/lib/deals/store";
import type { DisputeDecision } from "@/lib/ai/types";
import { publicDeal } from "@/lib/deals/redact";
import { recordAudit } from "@/lib/audit/log";
import { APPROVERS_REQUIRED, approvalFingerprint, approvalKey, clearApproval, hasDualApproval, recordApproval, requiresDualApproval } from "@/lib/payments/approvals";

const DECISIONS: DisputeDecision[] = ["release_to_seller", "refund_buyer", "split"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const caller = await requireCapability("dispute.resolve");
  if (!caller) return jsonError("Not found", 404);
  const { id } = await params;
  const body = await readJson<{ decision?: string; splitBuyerPercent?: number; note?: string }>(req);
  if (!body || !body.decision || !DECISIONS.includes(body.decision as DisputeDecision)) {
    return jsonError("A valid decision is required (release_to_seller, refund_buyer, or split).");
  }
  let split = body.splitBuyerPercent;
  if (body.decision === "split") {
    if (typeof split !== "number" || split < 0 || split > 100) return jsonError("splitBuyerPercent must be between 0 and 100.");
  }

  // Dual control (audit #17): a large settlement needs a second distinct admin to
  // approve the exact same ruling before any money moves. The escrow principal is
  // what's at stake, so the threshold is checked against it.
  const deal = await getDeal(id);
  if (!deal) return jsonError("Deal not found", 404);
  if (requiresDualApproval(deal.item.amount)) {
    const key = approvalKey(id);
    const fingerprint = approvalFingerprint(body.decision, split);
    const state = await recordApproval(key, fingerprint, caller.email);
    await recordAudit({
      actorEmail: caller.email,
      actorRole: caller.role,
      action: "settlement.approval",
      target: id,
      meta: { decision: body.decision, splitBuyerPercent: split, approvers: state.approvers.length, needed: APPROVERS_REQUIRED },
    });
    if (!hasDualApproval(state, fingerprint)) {
      // First (or repeated same-admin) approval: recorded, but nothing moves until
      // a second DISTINCT admin approves this exact ruling.
      return Response.json(
        {
          pendingApproval: true,
          approvals: state.approvers.length,
          needed: APPROVERS_REQUIRED,
          message: `Approval recorded. This settlement of ₦${deal.item.amount.toLocaleString("en-NG")} needs ${APPROVERS_REQUIRED} distinct admins to approve the same ruling before it executes.`,
        },
        { status: 202 },
      );
    }
  }

  const out = await adminResolveDispute(id, body.decision as DisputeDecision, { splitBuyerPercent: split, note: body.note, reviewer: caller.email });
  if (!out.ok) return jsonError(out.error ?? "Couldn't resolve the dispute.", out.error === "not_found" ? 404 : 409);
  // Executed: clear the approval scope so a later ruling on this deal starts fresh.
  if (requiresDualApproval(deal.item.amount)) await clearApproval(approvalKey(id));
  // Money moved on a human's call: record who, what, and why.
  await recordAudit({
    actorEmail: caller.email,
    actorRole: caller.role,
    action: "dispute.resolve",
    target: id,
    meta: { decision: body.decision, splitBuyerPercent: split, note: body.note },
  });
  return Response.json({ deal: publicDeal(out.deal) });
}
