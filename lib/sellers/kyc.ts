/* ==========================================================================
   Seller identity verification (KYC) seam.

   Submitting a payout form is NOT identity verification. Previously the seller
   route marked every submission `idVerified: true`, so the "Verified" badge —
   which the trust model and buyers rely on — meant nothing. That is a
   misrepresentation in a product whose whole promise is trust.

   Same live/demo seam as the rest of the app:
     • DEMO (no Supabase backend) — a sandbox with no real identities, so we
       treat sellers as verified to keep the happy-path flow demoable.
     • LIVE — verification requires a real BVN/NIN/ID check. Until a provider is
       wired (KYC_PROVIDER), we return false: an unverified badge is honest; a
       fake verified badge is not. Wire the provider call in the marked spot.
   ========================================================================== */

import { SERVICE_ROLE_KEY, SUPABASE_URL } from "@/lib/deals/config";

/** Set to your KYC/BVN/NIN provider id once integrated. Unset = not wired yet. */
const KYC_PROVIDER = process.env.KYC_PROVIDER ?? "";

function backendLive(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export interface KycInput {
  email: string;
  fullName?: string;
  phone?: string;
}

/**
 * Verify a seller's identity. Returns whether they are genuinely verified —
 * never a blanket true just because a form was submitted.
 */
export async function verifySellerIdentity(input: KycInput): Promise<boolean> {
  // Sandbox: no real identities to check, so keep the flow demoable.
  if (!backendLive()) return true;

  // Live, but no KYC provider configured → we cannot verify, so we must not claim to.
  if (!KYC_PROVIDER) return false;

  // TODO: call the configured KYC/BVN/NIN provider with `input` and return its
  // real pass/fail result. Until then, unverified is the honest default.
  void input;
  return false;
}
