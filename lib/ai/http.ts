/* ==========================================================================
   Small helpers shared by the AI route handlers: consistent JSON parsing,
   error shapes, and a couple of light type guards. Keeps each route thin.
   ========================================================================== */

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** The largest request body we'll parse (~1 MB). Bounds memory use and stops a
    trivial DoS from a giant body. Routes needing more (none today) can override. */
export const MAX_JSON_BYTES = 1_000_000;

/**
 * Parse a JSON request body, or return null if it isn't valid JSON OR exceeds
 * `maxBytes`. Reading as text first lets us enforce the cap even when the client
 * lies about (or omits) Content-Length.
 */
export async function readJson<T = unknown>(req: Request, maxBytes: number = MAX_JSON_BYTES): Promise<T | null> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
