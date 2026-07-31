// ALAT Wallet Services (playground.alat.ng) — the actual bank-grade wallet
// APIs. This is the slow-to-get product: access needs an x-api-key issued
// directly by a Wema/ALAT bank contact, not just a self-serve signup.
// Start the access request on Day 1 — everything payout-related depends on it.
//
// Until access is approved, TrustFlow can still demo end-to-end using
// ALATPay (lib/alatpay.ts) for collection and a stubbed/mocked payout here —
// swap in real calls the moment the x-api-key arrives.

const ALAT_WALLET_BASE_URL = "https://playground.alat.ng"; // sandbox host — confirm exact path prefix in the portal once you have access

function alatWalletHeaders() {
  return {
    "x-api-key": process.env.ALAT_WALLET_API_KEY!,
    "Content-Type": "application/json",
  };
}

/**
 * Generates the customer-facing escrow wallet. NIN is mandatory per ALAT's
 * docs — this is what backs the "seller must verify identity" requirement
 * in the master plan. Two-step: this call kicks off wallet creation
 * (PENDING), then otpValidateWallet confirms it.
 */
export async function generateEscrowWallet({
  nin,
  firstName,
  lastName,
  phone,
}: {
  nin: string;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const res = await fetch(
    `${ALAT_WALLET_BASE_URL}/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnerships/Request`,
    {
      method: "POST",
      headers: alatWalletHeaders(),
      body: JSON.stringify({ nin, firstName, lastName, phoneNumber: phone }),
    }
  );
  if (!res.ok) throw new Error(`ALAT wallet creation failed: ${res.status}`);
  return res.json(); // expect PENDING status; callback confirms completion
}

export async function otpValidateWallet({ reference, otp }: { reference: string; otp: string }) {
  const res = await fetch(
    `${ALAT_WALLET_BASE_URL}/wallet-creation/api/CustomerAccount/GenerateWalletAccountForPartnershipsV2/otp`,
    {
      method: "POST",
      headers: alatWalletHeaders(),
      body: JSON.stringify({ reference, otp }),
    }
  );
  if (!res.ok) throw new Error(`ALAT wallet OTP validation failed: ${res.status}`);
  return res.json();
}

/**
 * Confirms the seller's payout account before release — this is the
 * "checking the account" step from Day 4 of the plan. Works for any
 * Nigerian bank, not just Wema/ALAT.
 */
export async function accountNameEnquiry({
  bankCode,
  accountNumber,
}: {
  bankCode: string;
  accountNumber: string;
}) {
  const res = await fetch(
    `${ALAT_WALLET_BASE_URL}/debit-wallet/api/Shared/AccountNameEnquiry/${bankCode}/${accountNumber}`,
    { headers: alatWalletHeaders() }
  );
  if (!res.ok) throw new Error(`ALAT account enquiry failed: ${res.status}`);
  return res.json();
}

/**
 * Pays the seller (or refunds the buyer) from the escrow wallet. Works both
 * intrabank and interbank via NIP, so sellers/buyers on any bank can be paid.
 *
 * `securityInfo` must be an encrypted signature the bank can verify — ALAT's
 * docs say only the client holds the key to produce it, but don't fully spec
 * the algorithm in the public reference. Get the exact scheme from your bank
 * contact before wiring this for real; don't guess at the encryption.
 */
export async function debitWalletTransfer({
  sourceAccountNumber,
  destinationAccountNumber,
  destinationBankCode,
  amount,
  transactionReference,
  narration,
  securityInfo,
}: {
  sourceAccountNumber: string;
  destinationAccountNumber: string;
  destinationBankCode: string;
  amount: number;
  transactionReference: string;
  narration: string;
  securityInfo: string; // TODO: confirm exact encryption scheme with bank contact
}) {
  const res = await fetch(`${ALAT_WALLET_BASE_URL}/debit-wallet/api/Shared/Transfer`, {
    method: "POST",
    headers: alatWalletHeaders(),
    body: JSON.stringify({
      sourceAccountNumber,
      destinationAccountNumber,
      destinationBankCode,
      amount,
      transactionReference,
      useCustomNarration: true,
      narration,
      securityInfo,
    }),
  });
  if (!res.ok) throw new Error(`ALAT debit wallet transfer failed: ${res.status}`);
  return res.json(); // expect PENDING; final status arrives via callback
}
