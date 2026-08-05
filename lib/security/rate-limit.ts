/* ==========================================================================
   A tiny, dependency-free rate limiter for the unauthenticated endpoints.

   These routes (the AI features, the payment webhook) take no session, so
   without a throttle anyone can loop them to burn the Anthropic budget, hammer
   ALATPay, or exhaust the instance. This caps calls per client (by IP) in a
   fixed time window.

   NOTE (deployment): the counter lives in the process memory of one serverless
   instance, so under horizontal scaling the effective limit is per-instance,
   not global. It stops casual and single-source abuse; for a hard global cap,
   back this with a shared store (Upstash/Redis, or Vercel KV) behind the same
   interface. It is deliberately simple so it can't itself fail a request.
   ========================================================================== */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Best-effort client key: the first X-Forwarded-For hop (Vercel sets it), else a constant. */
function clientKey(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Allow up to `limit` requests per `windowMs` for `bucket` + client IP.
 * Returns { ok:false, retryAfterSeconds } when the caller is over the limit.
 */
export function rateLimit(req: Request, bucket: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const key = `${bucket}:${clientKey(req)}`;
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    sweep(now);
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** A 429 response with a Retry-After header. */
export function tooManyRequests(retryAfterSeconds: number): Response {
  return Response.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/** Drop expired buckets occasionally so the map can't grow without bound. */
let lastSweep = 0;
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) if (now >= b.resetAt) buckets.delete(k);
}
