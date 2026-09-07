/* ==========================================================================
   POST /api/deals/:id/dispute/evidence   (multipart, field "file")
   Upload one evidence file for a deal and return the marker to add to the
   dispute's evidence array. Only a party to the deal may upload (guards IDOR),
   and only image/PDF up to 8MB. Falls back with 503 when Storage isn't set up,
   so the client can tell the user to paste a link instead.
   ========================================================================== */

import { jsonError } from "@/lib/ai/http";
import { authorizeDeal } from "@/lib/deals/access";
import { evidenceConfigured, uploadEvidence } from "@/lib/deals/evidence";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;

  const rl = rateLimit(req, "evidence-upload", 20, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);

  const access = await authorizeDeal(id);
  if (!access.ok) return jsonError(access.status === 401 ? "Sign in to add evidence." : "Deal not found", access.status);

  if (!evidenceConfigured()) {
    return jsonError("File uploads aren't set up. Paste a link to the photo or video instead.", 503);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Expected a file upload.", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("No file provided.", 400);

  const res = await uploadEvidence(id, file);
  if (!res.ok) {
    if (res.error === "not_configured") return jsonError("File uploads aren't set up.", 503);
    return jsonError(res.error ?? "Couldn't upload the file.", 400);
  }
  return Response.json({ token: res.token });
}
