/* ==========================================================================
   GET /api/deals/:id/evidence?path=<storage path>
   Redirect to a short-lived signed URL for one uploaded evidence object. Only a
   party to the deal OR an admin reviewer may view it, and the path is checked to
   live under the deal's own prefix (traversal guard). 404 to everyone else, so
   evidence is never exposed by guessing a path.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { isAdmin } from "@/lib/auth/server";
import { authorizeDeal } from "@/lib/deals/access";
import { signedEvidenceUrl } from "@/lib/deals/evidence";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const path = new URL(req.url).searchParams.get("path") ?? "";

  // A party to the deal, or a reviewer, may open its evidence.
  const access = await authorizeDeal(id);
  const allowed = access.ok || (await isAdmin());
  if (!allowed) return jsonError("Not found", 404);

  const url = await signedEvidenceUrl(id, path);
  if (!url) return jsonError("Not found", 404);
  return Response.redirect(url, 302);
}
