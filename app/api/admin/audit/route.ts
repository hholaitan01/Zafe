/* ==========================================================================
   GET /api/admin/audit
   The admin action trail: who resolved which dispute, re-drove which money-move,
   or deactivated which account, and when. Read-only. Gated on the `audit.read`
   capability (every admin role holds it); returns 404 otherwise so the log's
   existence isn't confirmed to outsiders.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { requireCapability } from "@/lib/auth/server";
import { listAudit } from "@/lib/audit/log";

export async function GET(): Promise<Response> {
  if (!(await requireCapability("audit.read"))) return jsonError("Not found", 404);
  return Response.json({ entries: await listAudit(200) });
}
