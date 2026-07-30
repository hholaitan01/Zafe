/* ==========================================================================
   POST /api/scam-check
   Body: { text: string, item?: {...} }
   Flags the scam tactics inside a message or short chat.
   ========================================================================== */

import { getScamCheck } from "@/lib/ai/scam-check";
import { isNonEmptyString, jsonError, readJson } from "@/lib/ai/http";
import type { ScamCheckRequest } from "@/lib/ai/types";

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<ScamCheckRequest>(req);
  if (!body) return jsonError("Invalid JSON body");
  if (!isNonEmptyString(body.text)) {
    return jsonError("A 'text' string is required (the message or chat to scan).");
  }

  const result = await getScamCheck({ text: body.text, item: body.item });
  return Response.json(result);
}
