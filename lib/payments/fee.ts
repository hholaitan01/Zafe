/* ==========================================================================
   Zafe's escrow fee — one source of truth for the money math.

   Policy: 2% of the deal amount, capped, split 50/50 between buyer and seller.
     - The BUYER pays their half on top at funding (transfers amount + buyerShare).
     - The SELLER's half is deducted at payout (receives amount − sellerShare).
     - Zafe earns the fee only on a completed deal. On a refund or a dispute
       split, no fee is kept — the buyer's half is returned (see lib/payments).

   The rate and cap are configuration, not magic numbers. They read NEXT_PUBLIC_
   env so the same values are used on the server AND in the browser (the fund
   screen shows the buyer the true total), and this module is pure math with no
   server-only imports, so it is safe to import from a client component.
   ========================================================================== */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

/** Fee rate in basis points (200 = 2.00%). Override with NEXT_PUBLIC_ZAFE_FEE_BPS. */
export const FEE_BPS = intEnv("NEXT_PUBLIC_ZAFE_FEE_BPS", 200);
/** Cap on the total fee, in whole Naira. 0 disables the cap. Override with NEXT_PUBLIC_ZAFE_FEE_CAP_NAIRA. */
export const FEE_CAP_NAIRA = intEnv("NEXT_PUBLIC_ZAFE_FEE_CAP_NAIRA", 10000);

export interface Fee {
  total: number; // the whole fee for the deal
  buyerShare: number; // paid by the buyer at funding
  sellerShare: number; // deducted from the seller at payout
}

/**
 * The fee for a deal of `amount` Naira: 2% capped, split so the two halves add
 * back to the total exactly (the odd Naira goes to the seller's side).
 */
export function computeFee(amount: number): Fee {
  const raw = Math.round((amount * FEE_BPS) / 10000);
  const total = FEE_CAP_NAIRA > 0 ? Math.min(raw, FEE_CAP_NAIRA) : raw;
  const buyerShare = Math.floor(total / 2);
  return { total, buyerShare, sellerShare: total - buyerShare };
}

/** What the buyer transfers into escrow: the deal amount plus their fee half. */
export function collectionAmount(amount: number): number {
  return amount + computeFee(amount).buyerShare;
}

/** What the seller receives on a successful release: the amount minus their half. */
export function sellerNet(amount: number): number {
  return amount - computeFee(amount).sellerShare;
}

/**
 * The seller's fee on a DISPUTED outcome. Policy: on a dispute Zafe keeps the
 * buyer's half (already paid, not refunded) plus half the fee rate (1% at the
 * default 2%) of whatever the seller actually receives. Never more than the
 * seller's normal capped half, so a large disputed deal is not overcharged.
 *   - Seller wins outright: receipt = the whole amount, so this equals the
 *     normal seller half and Zafe keeps the full fee.
 *   - Split: charged only on the seller's portion.
 *   - Buyer wins outright: receipt = 0, so this is 0 and Zafe keeps only the
 *     buyer's half.
 */
export function disputeSellerFee(sellerReceipt: number, dealAmount: number): number {
  const halfBps = Math.round(FEE_BPS / 2);
  const raw = Math.round((sellerReceipt * halfBps) / 10000);
  return Math.min(raw, computeFee(dealAmount).sellerShare);
}
