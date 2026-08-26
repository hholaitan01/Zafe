/* ==========================================================================
   POST /api/dispute/agent
   Body: { messages: [{ role, content }], dealId?, item?, amount? }
   Agent 2 — the dispute mediator. Returns the next turn: a follow-up question,
   or a final recommendation (DisputeTurn).

   When a dealId is given AND the caller is a party to it, the item, amount,
   seller's side, and chat come from the real deal (server-side, secure). With
   no valid deal it falls back to the item/amount in the body, which keeps the
   demo working. Throttled because it reaches Claude.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { runDisputeTurn, type DisputeContext } from "@/lib/ai/dispute-agent";
import type { ChatMessage } from "@/lib/ai/client";
import { authorizeDeal } from "@/lib/deals/access";
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

export async function POST(req: Request): Promise<Response> {
  const rl = rateLimit(req, "ai", 20, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  const body = await readJson<{ messages?: unknown; dealId?: unknown; item?: unknown; amount?: unknown }>(req);
  if (!body) return jsonError("Invalid JSON body");

  const messages = cleanMessages(body.messages);

  let ctx: DisputeContext = {};
  if (typeof body.dealId === "string" && body.dealId) {
    const access = await authorizeDeal(body.dealId);
    if (access.ok) {
      const d = access.deal;
      ctx = {
        item: { title: d.item.title, amount: d.item.amount, currency: d.item.currency },
        amount: d.item.amount,
        sellerClaim: d.dispute?.seller?.claim,
        chat: d.chat,
      };
    }
  }
  // Demo / no authorized deal: take the item and amount from the body only.
  if (!ctx.item) {
    const item = body.item as { title?: unknown; currency?: unknown } | undefined;
    const amount = typeof body.amount === "number" ? body.amount : undefined;
    ctx = {
      item: {
        title: typeof item?.title === "string" ? item.title.slice(0, 120) : undefined,
        amount,
        currency: typeof item?.currency === "string" ? item.currency.slice(0, 8) : "NGN",
      },
      amount,
    };
  }

  const turn = await runDisputeTurn(ctx, messages);
  return Response.json(turn);
}
