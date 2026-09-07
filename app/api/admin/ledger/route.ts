/* ==========================================================================
   GET /api/admin/ledger
   The reconciliation view: the money at a glance from Zafe's own ledger (held,
   funded, paid out, refunded, revenue, and whether the books balance), plus the
   most recent entries. Read-only. Admin-only (isAdmin: open in demo,
   ADMIN_EMAILS in live); returns 404 to non-admins so the view isn't confirmed
   to outsiders.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { isAdmin } from "@/lib/auth/server";
import { listEntries, reconciliation } from "@/lib/ledger/store";

export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return jsonError("Not found", 404);
  const [summary, entries] = await Promise.all([reconciliation(), listEntries(100)]);
  return Response.json({ summary, entries });
}
