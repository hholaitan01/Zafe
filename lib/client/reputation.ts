/* ==========================================================================
   Client call for the signed-in trader's reputation.

   In demo mode the server has no session, so we pass the local user's email
   (and name) as query params; in live mode the server reads the session cookie
   and ignores them. Type-only import — no server code reaches the browser.
   ========================================================================== */

import type { Reputation } from "@/lib/reputation/types";
import { apiFetch } from "./api";

export function getMyReputation(email?: string, name?: string): Promise<Reputation> {
  const q = new URLSearchParams();
  if (email) q.set("email", email);
  if (name) q.set("name", name);
  const qs = q.toString();
  return apiFetch<{ reputation: Reputation }>(`/api/reputation${qs ? `?${qs}` : ""}`).then((r) => r.reputation);
}
