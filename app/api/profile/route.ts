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
import { requireCaller } from "@/lib/auth/server";
import { authConfigured } from "@/lib/auth/config";
import { normalizeContact } from "@/lib/deals/helpers";
import { getProfile, getProfileByUsername, normalizeUsername, upsertProfile, type ProfileRecord } from "@/lib/profiles/store";

const MAX_PHOTO = 700_000; // ~700 KB data URL cap

/** Public projection of a profile — never leaks the owner's email. A @username
    lookup is a public directory read, so it must not deanonymise the account. */
function publicProfile(p: ProfileRecord | null) {
  if (!p) return null;
  return { firstName: p.firstName, otherNames: p.otherNames, lastName: p.lastName, username: p.username, photo: p.photo };
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const username = url.searchParams.get("username")?.trim();
  if (username) {
    // Public directory lookup — return display fields only, not the email.
    const p = await getProfileByUsername(username);
    return Response.json({ profile: publicProfile(p) });
  }
  // Own profile: identity is the session in live mode, the ?email= only in demo.
  const qEmail = url.searchParams.get("email")?.trim() || "";
  const caller = await requireCaller({ email: qEmail });
  if (!caller) return Response.json({ profile: null });
  const profile = await getProfile(caller.email);
  return Response.json({ profile });
}

export async function POST(req: Request): Promise<Response> {
  const body = await readJson<{ email?: string; firstName?: string; otherNames?: string; lastName?: string; username?: string; photo?: string }>(req);
  if (!body) return jsonError("Invalid JSON body");

  // Identity is the session in live mode; the client-supplied email is honoured
  // only in demo mode. This stops an unauthenticated request from writing (or
  // squatting a name/username on) another person's profile.
  const caller = await requireCaller({ email: body.email });
  if (!caller) return jsonError(authConfigured() ? "Sign in to update your profile." : "A user email is required.", authConfigured() ? 401 : 400);
  const email = caller.email;
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
