/* ==========================================================================
   GET  /api/waitlist                       → { count }  (public social proof)
   POST /api/waitlist { email, name?, ref? } → { ok, code, position, total, referrals }

   Public (no auth), so it is hardened against the obvious abuse:
     • Server-side email validation (never trust the client).
     • A hidden honeypot field (`company`): real users leave it blank.
     • Body size is capped by readJson (~1 MB).
     • Best-effort per-instance rate limit as a speed bump.
     • A repeat email returns its existing standing, so the endpoint can't be
       used to tell whether an address was already on the list.

   Writes go through the server-only store (service-role key). The browser never
   touches the database. `ref` is a referrer's code and is validated server-side.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { addToWaitlist, getStanding, waitlistCount } from "@/lib/waitlist/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort in-memory limiter (per server instance). A speed bump against
// trivial spam, not a substitute for an edge/KV limiter in production.
const HITS = new Map<string, { n: number; t: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10_000;
  const max = 5;
  const rec = HITS.get(ip);
  if (!rec || now - rec.t > windowMs) {
    HITS.set(ip, { n: 1, t: now });
    if (HITS.size > 5000) HITS.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > max;
}

export async function GET(): Promise<Response> {
  return Response.json({ count: await waitlistCount() });
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return jsonError("Too many requests. Please try again shortly.", 429);

  const body = await readJson<{ email?: string; name?: string; source?: string; ref?: string; company?: string }>(req);
  if (!body) return jsonError("Invalid request.");

  // Coerce every field to a string before touching it (a caller can send a
  // non-string value in valid JSON).
  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  // Honeypot: accept silently so a bot sees success, but store nothing.
  if (str(body.company).trim()) return Response.json({ ok: true });

  const email = str(body.email).trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return jsonError("Enter a valid email address.");

  const name = str(body.name).trim().slice(0, 80) || undefined;
  const source = str(body.source).trim().slice(0, 40) || "waitlist";
  const ref = str(body.ref).trim().slice(0, 64) || undefined;

  const res = await addToWaitlist({ email, name, source, ref });
  if (!res.ok) return jsonError("Could not join the waitlist. Please try again.", 500);

  const standing = await getStanding(email);
  return Response.json({
    ok: true,
    code: res.code ?? standing?.code,
    position: standing?.position,
    total: standing?.total,
    referrals: standing?.referrals ?? 0,
  });
}
