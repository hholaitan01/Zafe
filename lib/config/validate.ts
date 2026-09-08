/* ==========================================================================
   Production configuration validation (audit #22).

   A financial system should DETECT missing production configuration rather than
   silently falling back to demo/mock behaviour. This inspects the environment
   and reports what would run in a degraded or unsafe mode. In production a
   missing critical value is an ERROR (deploys/health should surface it); in
   dev/preview the same gap is informational, since demo fallbacks are expected.

   Pure reads of process.env and the existing live()/configured() helpers — no
   secret VALUES are ever returned, only which keys are present.
   ========================================================================== */

import { authConfigured } from "@/lib/auth/config";
import {
  FLW_SECRET_HASH,
  collectionLive,
  flutterwaveLive,
  payoutLive,
  paystackLive,
} from "@/lib/payments/config";

export type IssueLevel = "error" | "warn";
export interface ConfigIssue {
  level: IssueLevel;
  key: string;
  message: string;
}

export interface ConfigReport {
  environment: string;
  production: boolean;
  ok: boolean; // no errors
  issues: ConfigIssue[];
}

function env(name: string): string {
  return process.env[name] ?? "";
}

/**
 * Inspect the environment. `production` decides severity: a gap that is merely
 * "running in demo" in dev becomes a blocking error in production.
 */
export function validateConfig(): ConfigReport {
  const production = env("NODE_ENV") === "production";
  const issues: ConfigIssue[] = [];
  // In production a gap is an error; elsewhere it's a warning (demo is expected).
  const add = (key: string, message: string, forceWarn = false) =>
    issues.push({ level: production && !forceWarn ? "error" : "warn", key, message });

  // Deal persistence — without Supabase, deals live in an in-memory demo store
  // and are lost on restart.
  if (!(env("NEXT_PUBLIC_SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY"))) {
    add("SUPABASE_SERVICE_ROLE_KEY", "Deals, ledger and idempotency fall back to an in-memory demo store (data lost on restart).");
  }

  // Auth — without it there is no real session; every caller is the single demo user.
  if (!authConfigured()) {
    add("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Auth is in demo mode: no real sessions, and per-user access checks are bypassed.");
  }

  // Payments — at least one provider must be live, or all money-moves are simulated.
  const anyProvider = paystackLive() || flutterwaveLive() || (collectionLive() && payoutLive());
  if (!anyProvider) {
    add("PAYMENTS_PROVIDER", "No payment provider is configured: collection, payout and refund are all simulated.");
  }
  // Flutterwave authenticates webhooks by a shared secret hash; without it, real
  // callbacks never verify and funding is never confirmed.
  if (flutterwaveLive() && !FLW_SECRET_HASH) {
    add("FLW_SECRET_HASH", "Flutterwave is live but FLW_SECRET_HASH is unset: its webhooks cannot authenticate, so payments never confirm.");
  }

  // Auto-release — with no secret the sweep endpoint fails closed in production,
  // so deals past their timer never release.
  if (!env("CRON_SECRET")) {
    add("CRON_SECRET", "Auto-release is disabled in production (the sweep endpoint fails closed without this secret).");
  }

  // Dispute review — with no allowlist and real auth, nobody can access /admin.
  if (authConfigured() && !env("ADMIN_EMAILS")) {
    add("ADMIN_EMAILS", "No admin emails are set: nobody can open the dispute review or reconciliation queues.");
  }

  // Seller KYC — without it, sellers can't verify and payouts stay locked.
  if (!env("KYC_PROVIDER")) {
    add("KYC_PROVIDER", "KYC is not configured: sellers can't verify their identity, so payouts stay locked.");
  }

  // AML screening — a live feed must be wired before production.
  if (!env("SCREENING_PROVIDER")) {
    add("SCREENING_PROVIDER", "AML screening uses the built-in demo list; wire a real sanctions/PEP feed before launch.");
  }

  // Notification links point at this base URL.
  if (!(env("NEXT_PUBLIC_APP_URL") || env("NEXT_PUBLIC_SITE_URL"))) {
    add("NEXT_PUBLIC_APP_URL", "No public app URL is set: links in notification emails may be wrong.", true);
  }

  return { environment: env("NODE_ENV") || "development", production, ok: !issues.some((i) => i.level === "error"), issues };
}
