/* ==========================================================================
   The escrow fee model — one source of truth, used on every screen that shows
   a price and (later) by settlement.

     • ₦1,000 flat for deals at or below ₦100,000
     • 1% of the amount for deals above ₦100,000, capped at ₦5,000
       (so 1% applies from ₦100,000 up to ₦500,000, then holds at ₦5,000)

   The two meet cleanly at ₦100,000 (1% of ₦100,000 = ₦1,000), so there is no
   jump at the boundary. On top of the fee, Nigerian rules add:
     • 7.5% VAT on the fee (a service charge), remitted to the NRS
     • a ₦50 stamp duty on the buyer's funding transfer (≥ ₦10,000), which the
       sender bears — shown for transparency, collected on the transfer itself.

   Fee transparency before the buyer funds is itself a compliance requirement
   (FCCPC + CBN consumer-protection). This module keeps the numbers honest and
   in one place.
   ========================================================================== */

export const FEE_FLAT = 1_000; // deals at or below the threshold
export const FEE_RATE = 0.01; // 1% above the threshold
export const FEE_THRESHOLD = 100_000; // flat at/below, percentage above
export const FEE_CAP = 5_000; // the escrow fee never exceeds this
export const VAT_RATE = 0.075; // 7.5% VAT on the fee
export const STAMP_DUTY = 50; // ₦50 electronic-transfer stamp duty
export const STAMP_DUTY_MIN = 10_000; // applies to transfers at/above this

export interface FeeBreakdown {
  /** The protected amount (the goods price held in escrow). */
  amount: number;
  /** The escrow service fee, after the cap. */
  fee: number;
  /** 7.5% VAT on the fee. */
  vat: number;
  /** fee + vat — what the fee costs all-in. */
  feeTotal: number;
  /** Whether the cap was applied (useful for copy). */
  capped: boolean;
  /** ₦50 stamp duty on the funding transfer (0 below the minimum). */
  stampDuty: number;
  /** What the buyer transfers in: amount + feeTotal + stampDuty. */
  buyerPaysTotal: number;
}

/** The escrow service fee for an amount (before VAT), with the cap applied. */
export function computeFee(amount: number): number {
  if (!(amount > 0)) return 0;
  const raw = amount <= FEE_THRESHOLD ? FEE_FLAT : amount * FEE_RATE;
  return Math.min(Math.round(raw), FEE_CAP);
}

/** The full, disclosable price breakdown for a deal amount. */
export function feeBreakdown(amount: number): FeeBreakdown {
  const amt = amount > 0 ? Math.round(amount) : 0;
  const fee = computeFee(amt);
  const vat = Math.round(fee * VAT_RATE);
  const stampDuty = amt >= STAMP_DUTY_MIN ? STAMP_DUTY : 0;
  const feeTotal = fee + vat;
  return {
    amount: amt,
    fee,
    vat,
    feeTotal,
    capped: amt > FEE_THRESHOLD && amt * FEE_RATE > FEE_CAP,
    stampDuty,
    buyerPaysTotal: amt + feeTotal + stampDuty,
  };
}

/** One-line summary of the pricing rule, for captions. */
export const FEE_RULE_TEXT = "1% over ₦100,000 (max ₦5,000), or ₦1,000 flat below. Plus 7.5% VAT.";
