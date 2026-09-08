/* ==========================================================================
   GET /api/health
   Deployment readiness. Public callers get a minimal { ok, environment } so an
   uptime probe works without leaking configuration. An admin (isAdmin) also gets
   the detailed config issues — which keys are missing and what runs degraded —
   so a misconfigured production deploy is visible. No secret VALUES are returned.
   ========================================================================== */

import { isAdmin } from "@/lib/auth/server";
import { validateConfig } from "@/lib/config/validate";

export async function GET(): Promise<Response> {
  const report = validateConfig();
  if (!(await isAdmin())) {
    return Response.json({ ok: report.ok, environment: report.environment });
  }
  return Response.json(report);
}
