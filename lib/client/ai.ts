/* ==========================================================================
   Client calls for the three AI features. Use these from screens that need an
   AI answer directly (e.g. a live scam check as the buyer pastes a chat, or a
   standalone dispute preview). Deals also compute the Trust Score server-side
   at creation, so the New Escrow screen usually reads deal.trust instead.
   ========================================================================== */

import type {
  DisputeRequest,
  DisputeResult,
  ScamCheckRequest,
  ScamCheckResult,
  TrustScoreRequest,
  TrustScoreResult,
} from "@/lib/ai/types";
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
