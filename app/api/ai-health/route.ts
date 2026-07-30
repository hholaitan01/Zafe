/* ==========================================================================
   GET /api/ai-health
   Quick check of the AI layer: which model, and whether we're running live
   (real Claude calls) or in offline demo mode. Handy on stage before a pitch.
   ========================================================================== */

import { AI_MODEL, aiEnabled } from "@/lib/ai/client";

export async function GET(): Promise<Response> {
  return Response.json({
    ok: true,
    mode: aiEnabled() ? "live" : "mock",
    model: AI_MODEL,
    features: ["trust-score", "scam-check", "dispute"],
  });
}
