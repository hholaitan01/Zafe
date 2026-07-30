/* ==========================================================================
   Feature 2 — Scam detector.
   Scans a message/chat and flags the specific scam tactics inside it.
   ========================================================================== */

import { AI_MODEL, aiEnabled, clampScore, runStructured } from "./client";
import { mockScamCheck } from "./mock";
import { SCAM_CHECK_SYSTEM } from "./prompts";
import type { ScamCheckRequest, ScamCheckResult } from "./types";

const SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["isScam", "riskLevel", "confidence", "tactics", "advice"],
  properties: {
    isScam: { type: "boolean" },
    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
    confidence: { type: "integer", description: "0–100" },
    tactics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "evidence", "severity"],
        properties: {
          name: { type: "string" },
          evidence: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    advice: { type: "string" },
  },
};

function buildUser(req: ScamCheckRequest): string {
  return [
    req.item ? `Context — item: ${req.item.title ?? "unknown"} (${req.item.currency ?? "NGN"} ${req.item.amount ?? "?"})` : "",
    "Scan this text for scam tactics:",
    "",
    req.text?.trim() || "(no text provided)",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function getScamCheck(req: ScamCheckRequest): Promise<ScamCheckResult> {
  if (!aiEnabled()) return mockScamCheck(req);

  try {
    const raw = await runStructured<Omit<ScamCheckResult, "mode">>({
      system: SCAM_CHECK_SYSTEM,
      user: buildUser(req),
      schema: SCHEMA,
      effort: "low",
    });
    return { ...raw, confidence: clampScore(raw.confidence), mode: "live" };
  } catch (err) {
    console.error(`[scam-check] live call failed (${AI_MODEL}), using mock:`, err);
    return { ...mockScamCheck(req), mode: "mock-fallback" };
  }
}
