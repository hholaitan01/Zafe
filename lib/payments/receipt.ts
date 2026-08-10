/* ==========================================================================
   Shareable receipt data — the shape Deji's Receipt screen renders, kept as
   plain structured data so it can back a webpage, a shared image, or a PDF
   later. (Ported from Jerry's lib/receipt.ts; adapted to the Deal model.)
   ========================================================================== */

import type { Deal } from "@/lib/deals/types";

const RISK: Record<string, string> = { safe: "LOW", caution: "MEDIUM", risky: "HIGH" };

export interface ReceiptData {
  reference: string;
  item: string;
  amount: number;
  status: string;
  trustScoreAtPurchase: number | null;
  riskLevel: string | null;
  buyerName: string;
  sellerName: string;
  createdAt: string;
  releasedAt: string | null;
  refundAmount: number | null;
  payoutRef: string | null;
}

export function buildReceipt(deal: Deal): ReceiptData {
  const done = deal.status === "completed" || deal.status === "resolved" || deal.status === "refunded";
  return {
    reference: deal.reference,
    item: deal.item.title,
    amount: deal.item.amount,
    status: deal.status,
    trustScoreAtPurchase: deal.trust?.score ?? null,
    riskLevel: deal.trust ? (RISK[deal.trust.verdict] ?? null) : null,
    buyerName: deal.buyerEmail || "Buyer",
    sellerName: deal.seller?.name || "Seller",
    createdAt: deal.createdAt,
    releasedAt: done ? deal.updatedAt : null,
    refundAmount:
      deal.status === "refunded" ? deal.item.amount : deal.status === "resolved" ? (deal.partialRefundAmount ?? null) : null,
    payoutRef: deal.payoutRef ?? null,
  };
}

/** Plain-text version for sharing over WhatsApp/SMS where no UI renders. */
export function receiptToText(r: ReceiptData): string {
  return [
    `Zafe Receipt — ${r.reference}`,
    `Item: ${r.item}`,
    `Amount: ₦${r.amount.toLocaleString("en-NG")}`,
    `Status: ${r.status}`,
    r.trustScoreAtPurchase != null ? `Trust Score at purchase: ${r.trustScoreAtPurchase}/100 (${r.riskLevel})` : null,
    `Buyer: ${r.buyerName}`,
    `Seller: ${r.sellerName}`,
    `Created: ${new Date(r.createdAt).toLocaleString("en-NG")}`,
    r.releasedAt ? `Settled: ${new Date(r.releasedAt).toLocaleString("en-NG")}` : null,
    r.refundAmount != null ? `Refunded: ₦${r.refundAmount.toLocaleString("en-NG")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
