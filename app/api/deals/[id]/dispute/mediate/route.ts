/* ==========================================================================
   POST /api/deals/:id/dispute/mediate
   Body: { messages: [{ role, content }] }

   Files the dispute MEDIATOR's recommendation onto the deal so it flows into
   the normal accept path. The mediator is re-run here server-side over the
   transcript, so the stored resolution is trusted (never a client-supplied
   decision). Like the form-based open, NO money moves here: the deal becomes
   "disputed" with the suggestion attached, and both sides still accept (or
   escalate) before anything settles.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { openDispute } from "@/lib/deals/store";
import { runDisputeTurn, type DisputeContext } from "@/lib/ai/dispute-agent";
import type { ChatMessage } from "@/lib/ai/client";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const m of input.slice(-30)) {
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim();
    if (text) out.push({ role, content: text.slice(0, 6000) });
  }
  return out;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const rl = rateLimit(req, "ai", 20, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  // Only a party to the deal may file a dispute on it (guards against IDOR).
  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to dispute this deal." : "Deal not found", access.status);
  const deal = access.deal;

  const body = await readJson<{ messages?: unknown }>(req);
  if (!body) return jsonError("Invalid JSON body");
  const messages = cleanMessages(body.messages);
  if (!messages.some((m) => m.role === "user")) return jsonError("Tell the mediator what happened first.");

  // Re-run the mediator on the server. Only a final decision can be filed.
  const ctx: DisputeContext = {
    item: { title: deal.item.title, amount: deal.item.amount, currency: deal.item.currency },
    amount: deal.item.amount,
    sellerClaim: deal.dispute?.seller?.claim,
    chat: deal.chat,
  };
  const turn = await runDisputeTurn(ctx, messages);
  if (turn.kind !== "decision") {
    return jsonError("The mediator needs a bit more before it can decide. Answer its questions, then file.", 409);
  }

  const buyerClaim = messages.filter((m) => m.role === "user").map((m) => m.content).join("\n").slice(0, 4000);
  const outcome = await openDispute(id, {
    reason: deal.dispute?.reason ?? "mediated",
    buyer: { claim: buyerClaim || "(no statement given)" },
    seller: { claim: deal.dispute?.seller?.claim ?? "(the seller has not added their side yet)" },
    resolution: turn.decision,
  });
  if (!outcome.ok) {
    return jsonError(outcome.error === "not_found" ? "Deal not found" : (outcome.error ?? "Couldn't file the dispute."), outcome.error === "not_found" ? 404 : 400);
  }
  return Response.json({ deal: outcome.deal, resolution: outcome.resolution });
}
