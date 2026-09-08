/* ==========================================================================
   /api/seller
   GET  ?email=<email>  → the seller's saved profile (verification + payout)
   POST { fullName, phone?, payout, email? } → verify + save the seller profile

   Identity: the session email (trusted) in live mode, else the client-supplied
   email in demo mode (the server has no session then).
   ========================================================================== */

import { jsonError, readJson } from "@/lib/ai/http";
import { authConfigured } from "@/lib/auth/config";
import { getServerUser, requireCaller } from "@/lib/auth/server";
import { verifySellerIdentity } from "@/lib/sellers/kyc";
import { getSeller, upsertSeller, type SellerPayout } from "@/lib/sellers/store";
import { payoutChanged, payoutFingerprint } from "@/lib/sellers/payout-guard";
import { createPayoutOtp, verifyPayoutOtp } from "@/lib/sellers/payout-otp";
import { sendPayoutOtpEmail } from "@/lib/notifications";
import { screenParty } from "@/lib/compliance/screening";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

// A seller profile carries the payout account (sensitive), so GET only ever
// returns the CALLER's own profile. In live mode that's the session email and
// the ?email= param is ignored; in demo mode (no session) the local session's
// email is used. Never look up another person's payout by arbitrary email.
export async function GET(req: Request): Promise<Response> {
  if (authConfigured()) {
    const user = await getServerUser();
    if (!user?.email) return Response.json({ seller: null });
    return Response.json({ seller: await getSeller(user.email) });
  }
  const qEmail = new URL(req.url).searchParams.get("email")?.trim() || "";
  if (!qEmail) return Response.json({ seller: null });
  return Response.json({ seller: await getSeller(qEmail) });
}

export async function POST(req: Request): Promise<Response> {
  // Cap saves per client so payout-change OTP codes can't be brute-forced by
  // looping this endpoint (defence in depth alongside the per-code attempt cap).
  const rl = rateLimit(req, "seller-save", 10, 60_000);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSeconds);
  const body = await readJson<{ email?: string; fullName?: string; phone?: string; payout?: SellerPayout; idType?: "bvn" | "vnin"; idNumber?: string; selfie?: string; otp?: string }>(req);
  if (!body) return jsonError("Invalid JSON body");

  // The payout account is where escrow money lands, so the identity here MUST be
  // trusted: the session in live mode, the client email only in demo. Otherwise
  // an unauthenticated request could overwrite another seller's payout account
  // and redirect their payouts.
  const caller = await requireCaller({ email: body.email });
  if (!caller) return jsonError(authConfigured() ? "Sign in to save your seller details." : "A seller email is required.", authConfigured() ? 401 : 400);
  const email = caller.email;
  if (!body.payout?.accountNumber || !body.payout?.accountName) {
    return jsonError("A payout account (number + name) is required to get paid.");
  }

  // Changing an EXISTING payout account is the highest-value action an attacker
  // can take with a hijacked session, so it takes a second factor: an email OTP.
  // (A first-time set has no prior account to protect, so it skips this.)
  const existing = await getSeller(email);
  const isChange = !!payoutFingerprint(existing?.payout) && payoutChanged(existing?.payout, body.payout);
  const fingerprint = payoutFingerprint(body.payout);
  if (isChange) {
    if (!body.otp) {
      // Issue and send a code; nothing changes until it is confirmed.
      const code = await createPayoutOtp(email, fingerprint);
      const delivery = await sendPayoutOtpEmail(email, code);
      const sent = delivery.ok && delivery.mode === "live"; // a real email, not the demo outbox
      if (sent) return Response.json({ requiresOtp: true, sent: true });
      // No mailer wired: the local sandbox surfaces the code so the flow is
      // testable. In LIVE mode we cannot deliver the confirmation code, so we
      // FAIL CLOSED — never save an unverified payout destination (audit #11).
      if (!authConfigured()) return Response.json({ requiresOtp: true, sent: false, devCode: code });
      return jsonError("We can't send the confirmation code needed to change your payout account right now. Please try again later or contact support.", 503);
    } else {
      const ok = await verifyPayoutOtp(email, fingerprint, body.otp);
      if (!ok) return jsonError("That confirmation code is wrong or expired.", 401);
    }
  }

  // Identity verification is a real check, not a side effect of saving a payout
  // account. In demo mode this is true (sandbox); in live mode it's only true
  // once the KYC provider matches the BVN/vNIN to the name (see lib/sellers/kyc).
  // The id number is used to verify and never stored on the seller record.
  const idVerified = await verifySellerIdentity({ email, fullName: body.fullName, phone: body.phone, idType: body.idType, idNumber: body.idNumber, selfie: body.selfie });

  // AML screening: a sanctions / PEP / watchlist HIT blocks verification (and so
  // payouts) — fail-closed. A "needs review" (no live provider wired) is
  // surfaced to the caller but doesn't hard-block, since the compliance
  // programme flags provider integration as a pre-production requirement.
  const screening = await screenParty({ name: body.fullName, contact: email, idNumber: body.idNumber });
  // Verified only when identity checks pass AND no screening hit. A missing live
  // provider (needsReview, no hits) is a flagged programme gap, not a hard block.
  const cleared = idVerified && screening.hits.length === 0;

  const seller = await upsertSeller({
    email,
    fullName: body.fullName,
    phone: body.phone,
    idVerified: cleared,
    payout: body.payout,
    // Stamp the change so the cooldown starts; preserve the prior stamp when the
    // account didn't change (so re-saving other details doesn't reset it).
    payoutUpdatedAt: isChange ? new Date().toISOString() : existing?.payoutUpdatedAt,
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ seller, screening: { clear: screening.clear, needsReview: screening.needsReview, hits: screening.hits } });
}
