/* ==========================================================================
   The seller's profile (verification + payout account) on the client.

   Source of truth is now the server (`/api/seller`, the `sellers` store), so it
   persists across devices and the release can read the payout account
   server-side. We keep a localStorage cache for instant UI (the "verify to get
   paid" banner) and offline fallback.
   ========================================================================== */

import { apiFetch, ApiError } from "./api";

export interface SellerPayout {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface SellerProfileData {
  /** Server-determined (the KYC result). Optional on input; always set on reads. */
  verified?: boolean;
  fullName?: string;
  phone?: string;
  payout?: SellerPayout;
}

interface SellerRecord {
  email: string;
  fullName?: string;
  phone?: string;
  idVerified: boolean;
  payout?: SellerPayout;
}

const KEY = "trustflow.seller-profile";

function cache(p: SellerProfileData | null): void {
  if (typeof window === "undefined") return;
  try {
    if (p) window.localStorage.setItem(KEY, JSON.stringify(p));
    else window.localStorage.removeItem(KEY);
  } catch {
    /* storage disabled — the flow still proceeds */
  }
}

/** Fast, synchronous read of the cached profile (for the verify banner etc.). */
export function getSellerProfile(): SellerProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SellerProfileData) : null;
  } catch {
    return null;
  }
}

export function isSellerVerified(): boolean {
  return getSellerProfile()?.verified === true;
}

function toData(r: SellerRecord | null): SellerProfileData | null {
  if (!r) return null;
  return { verified: r.idVerified, fullName: r.fullName, phone: r.phone, payout: r.payout };
}

/** The result of a save: either it persisted, or changing the payout account
    needs an emailed confirmation code first (2FA). */
export type SaveSellerResult =
  | { status: "saved"; profile: SellerProfileData }
  | { status: "otp_required"; sent: boolean; devCode?: string };

/** Persist the seller profile server-side (verify) when we can, and always keep
    a local cache so the flow never hard-breaks (e.g. offline, or no session
    email yet — it will sync to the server once signed in).

    Changing an existing payout account returns `otp_required`: the caller must
    resubmit with the emailed `otp` to confirm the change. A wrong/expired code
    throws an ApiError the caller can show. */
export async function saveSellerProfile(
  profile: SellerProfileData,
  email?: string,
  /** The BVN / vNIN + selfie to verify. Sent to the server for the KYC check and never cached. */
  id?: { idNumber?: string; idType?: "bvn" | "vnin"; selfie?: string },
  /** The emailed confirmation code, when resubmitting a payout-account change. */
  otp?: string,
): Promise<SaveSellerResult> {
  try {
    const r = await apiFetch<{ seller?: SellerRecord; requiresOtp?: boolean; sent?: boolean; devCode?: string }>("/api/seller", {
      method: "POST",
      body: JSON.stringify({ email, fullName: profile.fullName, phone: profile.phone, payout: profile.payout, idNumber: id?.idNumber, idType: id?.idType, selfie: id?.selfie, otp }),
    });
    if (r.requiresOtp) return { status: "otp_required", sent: !!r.sent, devCode: r.devCode };
    const server = toData(r.seller ?? null);
    if (server) {
      // The server decides `verified` via the real KYC check — trust it, not the form.
      cache(server);
      return { status: "saved", profile: server };
    }
  } catch (e) {
    // A real server rejection (a wrong code, a missing email) must surface so the
    // caller can react; only a network/offline error falls through to the cache.
    if (e instanceof ApiError) throw e;
  }
  // Offline / no-session fallback: cache the details but never claim verified.
  const local: SellerProfileData = { ...profile, verified: false };
  cache(local);
  return { status: "saved", profile: local };
}

/** Load the seller profile from the server and refresh the cache. If the server
    has no record, keep any local cache (it may be a verify not yet synced to a
    session) rather than clobbering it. */
export async function loadSellerProfile(email?: string): Promise<SellerProfileData | null> {
  try {
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    const r = await apiFetch<{ seller: SellerRecord | null }>(`/api/seller${q}`);
    if (r.seller) {
      const data = toData(r.seller);
      cache(data);
      return data;
    }
    return getSellerProfile(); // server has nothing — trust the local cache
  } catch {
    return getSellerProfile(); // offline fallback to the cache
  }
}
