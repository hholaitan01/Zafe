// ALATPay — merchant payment gateway (developer.alatpay.ng)
// Handles collecting the buyer's money into escrow: card, bank transfer, USSD.
// Auth model: businessId + x-api-key, issued when you register on the ALATPay
// merchant portal (separate from the ALAT Wallet Services bank partnership below).
//
// Confirm the exact base URL and callback payload shape against your ALATPay
// merchant dashboard once your business/API key are approved — sandbox vs
// live hosts differ and this hasn't been tested against a live sandbox yet.

const ALATPAY_BASE_URL = "https://apibox.alatpay.ng/bank-transfer/api/v1"; // verify in ALATPay dashboard docs

function alatPayHeaders() {
  return {
    "Ocp-Apim-Subscription-Key": process.env.ALATPAY_API_KEY!,
    "Content-Type": "application/json",
  };
}

/**
 * Generates a one-time virtual account for the buyer to pay into.
 * ALATPay's own docs say these expire after ~30 min; the master plan wants
 * a tighter ~10 min window, so we track our own `expires_at` in the
 * transactions table on top of theirs — don't rely on ALATPay's timer alone.
 */
export async function generateVirtualAccount({
  amount,
  transactionRef,
  buyerEmail,
  buyerPhone,
  buyerName,
}: {
  amount: number; // naira
  transactionRef: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerName: string;
}) {
  const res = await fetch(`${ALATPAY_BASE_URL}/transactions/${process.env.ALATPAY_BUSINESS_ID}`, {
    method: "POST",
    headers: alatPayHeaders(),
    body: JSON.stringify({
      businessId: process.env.ALATPAY_BUSINESS_ID,
      amount,
      currency: "NGN",
      orderId: transactionRef,
      description: "TrustFlow escrow deposit",
      customer: {
        email: buyerEmail,
        phone: buyerPhone,
        firstName: buyerName.split(" ")[0] || buyerName,
        lastName: buyerName.split(" ").slice(1).join(" ") || "-",
      },
    }),
  });
  if (!res.ok) throw new Error(`ALATPay virtual account request failed: ${res.status}`);
  return res.json();
}

/** Re-query a transaction's status directly, instead of trusting the callback alone. */
export async function checkTransactionStatus(alatTransactionId: string) {
  const res = await fetch(`${ALATPAY_BASE_URL}/transactions/verify/${alatTransactionId}`, {
    headers: alatPayHeaders(),
  });
  if (!res.ok) throw new Error(`ALATPay status check failed: ${res.status}`);
  return res.json();
}

/**
 * ALATPay callback verification. Their docs describe a callback-URL model
 * rather than a documented HMAC header (unlike Squad) — confirm with your
 * merchant dashboard whether they sign callbacks, and if so, verify that
 * signature here instead of just checking businessId + status.
 */
export function isValidAlatPayCallback(payload: any) {
  return (
    payload &&
    payload.data &&
    payload.data.businessId === process.env.ALATPAY_BUSINESS_ID &&
    typeof payload.data.status === "string"
  );
}
