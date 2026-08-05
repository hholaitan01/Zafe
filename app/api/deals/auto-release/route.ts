/* ==========================================================================
   /api/deals/auto-release
   Releases any shipped deals whose timer has run out (the buyer never confirmed
   or disputed). This is a SCHEDULED/ops sweep, not a user action — no screen
   calls it, and the same sweep already runs inside every deal-list call.

   It moves money, so it's protected: when CRON_SECRET is set (production) the
   caller must present it as a Bearer token, which is exactly what Vercel Cron
   sends (see vercel.json). When it's unset (local/demo) it stays open, since it
   can only release deals already past their timer. Also rate-limited.

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

/** Authorized when no secret is configured (local/demo), or the Bearer token matches. */
function authorized(req: Request): boolean {
  if (!CRON_SECRET) return true;
  const auth = req.headers.get("authorization") ?? "";
  return safeEqual(auth, `Bearer ${CRON_SECRET}`);
}

async function handle(req: Request): Promise<Response> {
  const rl = rateLimit(req, "auto-release", 12, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const released = await runAutoReleases();
  return Response.json({ released });
}

export const GET = handle;
export const POST = handle;
