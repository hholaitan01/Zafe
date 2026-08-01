/* ==========================================================================
   Auth types shared across the login flow.
   ========================================================================== */

export type AuthMode = "live" | "demo";

export interface TrustUser {
  id: string;
  email: string;
  name?: string;
}

/** What every auth action returns, so the UI can react uniformly. */
export interface AuthResult {
  ok: boolean;
  mode: AuthMode;
  user?: TrustUser;
  /** A human-readable error to show the user, when ok is false. */
  error?: string;
  /** Set when the action needs the browser to navigate (e.g. OAuth redirect). */
  redirectUrl?: string;
  /** Set when a passwordless login link has been emailed — tell the user to check their inbox. */
  magicLinkSent?: boolean;
}
