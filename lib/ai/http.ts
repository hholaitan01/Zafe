/* ==========================================================================
   Small helpers shared by the AI route handlers: consistent JSON parsing,
   error shapes, and a couple of light type guards. Keeps each route thin.
   ========================================================================== */

export function jsonError(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

/** Parse a JSON request body, or return null if it isn't valid JSON. */
export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
