/* ==========================================================================
   /api/profile
   GET  ?email= | ?username=  → a user's profile (name parts, username, photo)
   POST { firstName?, otherNames?, lastName?, username?, photo?, email? }
        Save the profile, enforcing the name rules:
          • first save sets the names; after that first/last are locked
          • other names can be added once (if not set), never removed
          • no name that was added can be cleared
        Username is changeable (must be unique); photo is changeable.
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { getServerUser } from "@/lib/auth/server";
import { normalizeContact } from "@/lib/deals/helpers";
import { getProfile, getProfileByUsername, normalizeUsername, upsertProfile } from "@/lib/profiles/store";

const MAX_PHOTO = 700_000; // ~700 KB data URL cap

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username")?.trim();
  if (username) {
    const p = await getProfileByUsername(username);
    return Response.json({ profile: p });
  }
  const qEmail = url.searchParams.get("email")?.trim() || "";
  const user = await getServerUser();
  const email = user?.email || qEmail;
  if (!email) return Response.json({ profile: null });
  const profile = await getProfile(email);
  return Response.json({ profile });
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ email?: string; firstName?: string; otherNames?: string; lastName?: string; username?: string; photo?: string }>(req);
  if (!body) return jsonError("Invalid JSON body");

  const user = await getServerUser();
  const email = user?.email || body.email?.trim() || "";
  if (!email) return jsonError("A user email is required.");
  if (body.photo && body.photo.length > MAX_PHOTO) return jsonError("That image is too large — please use a smaller photo.", 413);

  const existing = await getProfile(email);
  const norm = (s?: string) => (s ?? "").trim() || undefined;

  // Names: first save wins; after that first/last are frozen and other-names is add-once.
  let firstName: string | undefined;
  let otherNames: string | undefined;
  let lastName: string | undefined;
  if (existing) {
    firstName = existing.firstName;
    lastName = existing.lastName;
    otherNames = existing.otherNames ? existing.otherNames : norm(body.otherNames);
  } else {
    firstName = norm(body.firstName);
    lastName = norm(body.lastName);
    otherNames = norm(body.otherNames);
  }

  // Username: changeable, must be unique. Empty keeps the existing one.
  let username = existing?.username;
  if (body.username !== undefined) {
    const u = normalizeUsername(body.username);
    if (u && u !== existing?.username) {
      const owner = await getProfileByUsername(u);
      if (owner && normalizeContact(owner.email) !== normalizeContact(email)) return jsonError("That username is taken.", 409);
      username = u;
    }
  }

  // Photo: changeable. Empty string clears it.
  const photo = body.photo !== undefined ? body.photo || undefined : existing?.photo;

  const profile = await upsertProfile({ email, firstName, otherNames, lastName, username, photo, updatedAt: new Date().toISOString() });
  return Response.json({ profile });
}
