// Day 5 (Jerry): shareable receipt at every step. This produces the data
// shape Deji's Receipt screen renders — kept as plain structured data so
// it can back a webpage, a shared image, or a PDF later without redoing
// the underlying logic.

export type ReceiptData = {
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
  releaseMethod: string | null;
  refundAmount: number | null;
};

export function buildReceipt(tx: any): ReceiptData {
  return {
    reference: tx.transaction_ref,
    item: tx.item_description,
    amount: tx.amount,
    status: tx.status,
    trustScoreAtPurchase: tx.trust_score ?? null,
    riskLevel: tx.risk_level ?? null,
    buyerName: tx.buyer?.full_name ?? "Unknown buyer",
    sellerName: tx.seller?.full_name ?? "Unknown seller",
    createdAt: tx.created_at,
    releasedAt: tx.confirmed_at ?? null,
    releaseMethod: tx.release_method ?? null,
    refundAmount:
      tx.status === "REFUNDED" ? tx.amount : tx.status === "PARTIALLY_REFUNDED" ? tx.partial_refund_amount ?? null : null,
  };
}

/** Plain-text version for sharing over WhatsApp/SMS where no UI renders. */
export function receiptToText(r: ReceiptData) {
  return [
    `TrustFlow Receipt — ${r.reference}`,
    `Item: ${r.item}`,
    `Amount: ₦${r.amount.toLocaleString("en-NG")}`,
    `Status: ${r.status}`,
    r.trustScoreAtPurchase != null ? `Trust Score at purchase: ${r.trustScoreAtPurchase}/100 (${r.riskLevel})` : null,
    `Buyer: ${r.buyerName}`,
    `Seller: ${r.sellerName}`,
    `Created: ${new Date(r.createdAt).toLocaleString("en-NG")}`,
    r.releasedAt ? `Released: ${new Date(r.releasedAt).toLocaleString("en-NG")} (${r.releaseMethod})` : null,
    r.refundAmount != null ? `Refunded: ₦${r.refundAmount.toLocaleString("en-NG")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
