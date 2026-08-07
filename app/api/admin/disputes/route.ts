/* ==========================================================================
   GET /api/admin/disputes
   The human review queue: deals escalated to "under_review". Admin-only — the
   caller must pass isAdmin() (demo mode allows it; live mode gates on
   ADMIN_EMAILS). Returns 404 to non-admins so the queue's existence isn't
   confirmed to outsiders.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { isAdmin } from "@/lib/auth/server";
import { listUnderReview } from "@/lib/deals/store";

export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return jsonError("Not found", 404);
  return Response.json({ deals: await listUnderReview() });
}
