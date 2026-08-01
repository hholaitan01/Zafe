/* ==========================================================================
   /api/profile
   GET  ?email=<email>  → the user's saved name parts
   POST { firstName, otherNames?, lastName, email? } → save them

   Identity: the session email (trusted) in live mode, else the client-supplied
   email in demo mode.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { getServerUser } from "@/lib/auth/server";
import { getProfile, upsertProfile } from "@/lib/profiles/store";

export async function GET(req: Request): Promise<Response> {
  const qEmail = new URL(req.url).searchParams.get("email")?.trim() || "";
  const user = await getServerUser();
  const email = user?.email || qEmail;
  if (!email) return Response.json({ profile: null });
  const profile = await getProfile(email);
  return Response.json({ profile });
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ email?: string; firstName?: string; otherNames?: string; lastName?: string }>(req);
  if (!body) return jsonError("Invalid JSON body");

  const user = await getServerUser();
  const email = user?.email || body.email?.trim() || "";
  if (!email) return jsonError("A user email is required.");

  const profile = await upsertProfile({
    email,
    firstName: body.firstName,
    otherNames: body.otherNames,
    lastName: body.lastName,
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ profile });
}
