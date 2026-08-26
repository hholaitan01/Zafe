/* ==========================================================================
   POST /api/support
   Body: { messages: [{ role, content }], dealId? }
   Agent 3 — the support assistant answers about how Zafe works and, when a
   dealId is given AND the caller is a party to it, about that deal.

   Unauthenticated calls reach Claude, so it is throttled. The deal summary is
   built server-side through authorizeDeal, so a caller can never ground the
   agent on a deal that is not theirs (guards against IDOR / data leakage).
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { getSupportReply } from "@/lib/ai/support";
import type { ChatMessage } from "@/lib/ai/client";
import type { DealSummary } from "@/lib/ai/types";
import { authorizeDeal } from "@/lib/deals/access";
import { isPartyToDeal } from "@/lib/deals/access";
import { getServerUser } from "@/lib/auth/server";
import type { Deal } from "@/lib/deals/types";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

function cleanMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const out: ChatMessage[] = [];
  for (const m of input.slice(-30)) {
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.trim();
    if (text) out.push({ role, content: text.slice(0, 6000) });
  }
  return out.length ? out : null;
}

async function summarize(deal: Deal): Promise<DealSummary> {
  let role: DealSummary["role"] = "you";
  const user = await getServerUser();
  if (user?.email && isPartyToDeal(deal, user.email)) {
    // best-effort party role from the trusted session
    const me = user.email.toLowerCase();
    if (deal.buyerEmail && deal.buyerEmail.toLowerCase() === me) role = "buyer";
    else if (deal.seller?.contact && deal.seller.contact.toLowerCase() === me) role = "seller";
  }
  return {
    reference: deal.reference,
    item: deal.item.title,
    amount: deal.item.amount,
    currency: deal.item.currency,
    status: deal.status,
    role,
    trustScore: deal.trust?.score,
    hasDispute: Boolean(deal.dispute) || deal.status === "disputed" || deal.status === "under_review",
  };
}

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(req, "ai", 20, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  const body = await readJson<{ messages?: unknown; dealId?: unknown }>(req);
  if (!body) return jsonError("Invalid JSON body");

  const messages = cleanMessages(body.messages);
  if (!messages) return jsonError("messages must be a non-empty array of { role, content }.");

  // Ground on the deal only if the caller is entitled to it; otherwise answer
  // generally. We never surface why grounding was skipped (no enumeration).
  let deal: DealSummary | undefined;
  if (typeof body.dealId === "string" && body.dealId) {
    const access = await authorizeDeal(body.dealId);
    if (access.ok) deal = await summarize(access.deal);
  }

  const result = await getSupportReply(messages, deal);
  return Response.json(result);
}
