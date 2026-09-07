/* ==========================================================================
   /api/deals/auto-release
   Releases any shipped deals whose timer has run out (the buyer never confirmed
   or disputed). This is the ONLY place auto-release runs — a SCHEDULED/ops sweep,
   never a side effect of reading deals.

   It moves money, so it's protected and FAILS CLOSED: when CRON_SECRET is set the
   caller must present it as a Bearer token (exactly what Vercel Cron sends, see
   vercel.json). When it's unset the endpoint is open ONLY in non-production
   (local/demo); in production a missing secret is treated as unauthorized rather
   than left open. Also rate-limited.

   Vercel Cron invokes via GET; POST stays for the existing client helper.
   ========================================================================== */

import { timingSafeEqual } from "node:crypto";
import { runAutoReleases } from "@/lib/deals/store";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

const CRON_SECRET = process.env.CRON_SECRET ?? "";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Authorized by a matching Bearer token; with no secret set, open only outside
    production (fail closed in prod so a config slip can't expose a money-move). */
function authorized(req: Request): boolean {
  if (!CRON_SECRET) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") ?? "";
  return safeEqual(auth, `Bearer ${CRON_SECRET}`);
}

async function handle(req: Request): Promise<Response> {
  const rl = rateLimit(req, "auto-release", 12, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const result = await runAutoReleases();
  // `released` stays the headline count for the existing client helper; the
  // operational counters (eligible/skipped/capped/enabled) ride alongside.
  return Response.json(result);
}

export const GET = handle;
export const POST = handle;
