/* ==========================================================================
   The payment-provider seam.

   Everything money-related in Zafe (collect into escrow, pay the seller,
   refund the buyer, authenticate a webhook) goes through this one interface so
   the gateway is replaceable. ALAT is the original; Paystack is the one we are
   moving to; Flutterwave drops in later by implementing the same interface.

   Amounts are always Naira (whole units) at this boundary — a provider that
   works in kobo converts internally, so callers never think about it.
   ========================================================================== */

export interface CollectionRequest {
  amountNaira: number;
  reference: string;      // our deal reference; the provider echoes it back on the webhook
  customerEmail: string;
  customerName: string;
}

export interface CollectionAccount {
  accountNumber: string;
  bankName: string;
  providerRef?: string;   // the provider's own transaction id, for re-query
  expiresAt: string;
}

export interface TransferRequest {
  amountNaira: number;
  bankCode: string;
  accountNumber: string;
  accountName?: string;   // when set, the provider confirms the name before sending
  reference: string;      // DETERMINISTIC per logical operation, so a retry is idempotent
  narration: string;
}

export interface TransferResult {
  ok: boolean;
  ref?: string;
  error?: string;
}

/** The reconciled status of a prior transfer, looked up by its reference.
    - succeeded: the money went out — do NOT send again.
    - failed:    it definitively did not go out — safe to retry.
    - pending:   still in flight at the provider — wait, do not retry.
    - unknown:   couldn't determine — hold for manual reconciliation, never retry. */
export type TransferStatus = "succeeded" | "pending" | "failed" | "unknown";

/** The normalised meaning of a webhook, once its signature has been checked. */
export interface WebhookEvent {
  authenticated: boolean; // false = signature/verification failed → caller must refuse to act
  funded: boolean;        // true only for a confirmed successful collection
  reference: string;      // our deal reference (maps the event back to a deal)
  providerRef?: string;   // the provider's transaction id
  eventId: string;        // stable id used to process each event exactly once (idempotency)
}

export interface PaymentProvider {
  readonly id: "paystack" | "alat" | "flutterwave";

  /** Open a one-time account the buyer pays the escrow into. */
  createCollection(req: CollectionRequest): Promise<CollectionAccount>;

  /** Re-query a transaction's true status, so we never trust a callback alone. */
  verifyTransaction(providerRef: string): Promise<{ successful: boolean } | null>;

  /** Send money out (payout to seller, or refund to buyer). Idempotent on `reference`. */
  transfer(req: TransferRequest): Promise<TransferResult>;

  /**
   * The true status of a prior transfer, looked up by its deterministic
   * `reference`. Called before retrying a stale/failed settlement so a transfer
   * that already went through (but whose success we never recorded — e.g. a
   * crash or timeout after the provider accepted it) is never sent twice.
   */
  getTransferStatus(reference: string): Promise<TransferStatus>;

  /**
   * Authenticate and parse a raw webhook body. Returns null when the body is
   * not a recognisable event for us; returns `{ authenticated: false }` when it
   * is recognisable but its signature does not verify.
   */
  parseWebhook(rawBody: string, headers: Headers): WebhookEvent | null;
}
