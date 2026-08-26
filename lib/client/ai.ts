/* ==========================================================================
   Client calls for the three AI features. Use these from screens that need an
   AI answer directly (e.g. a live scam check as the buyer pastes a chat, or a
   standalone dispute preview). Deals also compute the Trust Score server-side
   at creation, so the New Escrow screen usually reads deal.trust instead.
   ========================================================================== */

import type {
  DisputeRequest,
  DisputeResult,
  DisputeTurn,
  ScamCheckRequest,
  ScamCheckResult,
  SupportReply,
  TrustScoreRequest,
  TrustScoreResult,
} from "@/lib/ai/types";
import type { ChatMessage } from "@/lib/ai/client";
import { apiFetch } from "./api";

export function getTrustScore(req: TrustScoreRequest): Promise<TrustScoreResult> {
  return apiFetch<TrustScoreResult>("/api/trust-score", { method: "POST", body: JSON.stringify(req) });
}

export function checkScam(req: ScamCheckRequest): Promise<ScamCheckResult> {
  return apiFetch<ScamCheckResult>("/api/scam-check", { method: "POST", body: JSON.stringify(req) });
}

export function judgeDispute(req: DisputeRequest): Promise<DisputeResult> {
  return apiFetch<DisputeResult>("/api/dispute", { method: "POST", body: JSON.stringify(req) });
}

/* --------------------------- Conversational agents ---------------------- */

/** Agent 3 — support assistant. Pass the running transcript; add a dealId to
    ground the answer in that deal (only works if you are a party to it). */
export function askSupport(messages: ChatMessage[], dealId?: string): Promise<SupportReply> {
  return apiFetch<SupportReply>("/api/support", { method: "POST", body: JSON.stringify({ messages, dealId }) });
}

/** Agent 2 — dispute mediator. Send the transcript; get the next turn (a
    follow-up question or the final recommendation). A dealId pulls the item,
    amount, and chat from the real deal; otherwise pass item/amount for a demo. */
export function mediateDispute(
  messages: ChatMessage[],
  opts: { dealId?: string; item?: { title?: string; currency?: string }; amount?: number } = {},
): Promise<DisputeTurn> {
  return apiFetch<DisputeTurn>("/api/dispute/agent", {
    method: "POST",
    body: JSON.stringify({ messages, ...opts }),
  });
}
