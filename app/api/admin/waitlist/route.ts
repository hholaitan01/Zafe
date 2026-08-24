/* ==========================================================================
   GET /api/admin/waitlist          → { entries, count }
   GET /api/admin/waitlist?format=csv → the list as a CSV download

   Admin-only, gated on isAdmin() (open in demo mode, ADMIN_EMAILS in live), the
   same as the dispute and AML queues. Non-admins get a 404 so the endpoint's
   existence isn't confirmed. Read-only.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { isAdmin } from "@/lib/auth/server";
import { listWaitlist } from "@/lib/waitlist/store";

/** Quote a CSV field only when it contains a comma, quote, or newline. */
function csvField(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET(req: Request): Promise<Response> {
  if (!(await isAdmin())) return jsonError("Not found", 404);

  const rows = await listWaitlist();

  if (new URL(req.url).searchParams.get("format") === "csv") {
    const header = "email,name,source,joined_at";
    const lines = rows.map((r) => [r.email, r.name ?? "", r.source ?? "", r.createdAt].map((x) => csvField(String(x))).join(","));
    const csv = [header, ...lines].join("\n") + "\n";
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="zafe-waitlist.csv"',
        "Cache-Control": "no-store",
      },
    });
  }

  return Response.json({ entries: rows, count: rows.length });
}
