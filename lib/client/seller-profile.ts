/* ==========================================================================
   The seller's own profile (verification + payout account), kept in the browser.

   Like the demo auth session, this is a lightweight local store so the seller
   flow works end to end without a new table. The payout account is also written
   onto each deal (deals.seller_payout) when the seller ships, which is what the
   live payout actually reads — this is just the seller's saved copy to prefill.
   (Live upgrade: move this to a `sellers` table keyed by email.)
   ========================================================================== */

export interface SellerPayout {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export interface SellerProfileData {
  verified: boolean;
  fullName?: string;
  phone?: string;
  payout?: SellerPayout;
}

const KEY = "trustflow.seller-profile";

export function getSellerProfile(): SellerProfileData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SellerProfileData) : null;
  } catch {
    return null;
  }
}

export function saveSellerProfile(p: SellerProfileData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage disabled — the flow still proceeds */
  }
}

export function isSellerVerified(): boolean {
  return getSellerProfile()?.verified === true;
}
