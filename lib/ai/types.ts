/* ==========================================================================
   Shared types for TrustFlow's AI backend (H2O's lane).

   Three AI features live here:
     1. Trust Score      — a 0–100 pre-deal risk score for a seller + chat
     2. Scam detector    — flags specific scam tactics in a message/chat
     3. Dispute judge    — weighs both sides of a dispute and decides fairly

   Every response carries a `mode` so the UI (and the judges) can see whether
   a real Claude call answered ("live"), the offline heuristic answered
   ("mock"), or a live call failed and we fell back ("mock-fallback").
   ========================================================================== */

export type AiMode = "live" | "mock" | "mock-fallback";

/** A seller's history, as far as we know it. All fields optional — a brand
    new seller with no history is exactly the risky case we care about. */
export interface SellerProfile {
  name?: string;
  /** BVN/NIN verified — every seller must verify before they can be paid. */
  verified?: boolean;
  completedDeals?: number;
  disputes?: number;
  accountAgeDays?: number;
  /** Average buyer rating, 0–5. */
  rating?: number;
}

export interface DealItem {
  title?: string;
  amount?: number;
  currency?: string;
}

/* ------------------------------ Trust Score ----------------------------- */

export interface TrustScoreRequest {
  /** The pasted buyer/seller conversation. */
  chat: string;
  seller?: SellerProfile;
  item?: DealItem;
}

export type TrustVerdict = "safe" | "caution" | "risky";

export interface TrustReason {
  label: string;
  detail: string;
  /** Does this reason push the score up, down, or neither? */
  weight: "positive" | "negative" | "neutral";
}

export interface TrustScoreResult {
  /** 0–100. Higher is safer. */
  score: number;
  verdict: TrustVerdict;
  /** One-line summary the Trust Score screen shows at the top. */
  headline: string;
  reasons: TrustReason[];
  redFlags: string[];
  recommendation: string;
  mode: AiMode;
}

/* ----------------------------- Scam detector ---------------------------- */

export interface ScamCheckRequest {
  /** The message or chat snippet to scan. */
  text: string;
  item?: DealItem;
}

export type ScamRisk = "low" | "medium" | "high";

export interface ScamTactic {
  name: string;
  evidence: string;
  severity: ScamRisk;
}

export interface ScamCheckResult {
  isScam: boolean;
  riskLevel: ScamRisk;
  /** 0–100 confidence in the risk call. */
  confidence: number;
  tactics: ScamTactic[];
  advice: string;
  mode: AiMode;
}

/* ----------------------------- Dispute judge ---------------------------- */

export interface DisputeParty {
  claim: string;
  evidence?: string[];
}

export interface DisputeRequest {
  item?: DealItem;
  amount?: number;
  buyer: DisputeParty;
  seller: DisputeParty;
  /** Optional: the deal chat, for extra context. */
  chat?: string;
}

export type DisputeDecision = "release_to_seller" | "refund_buyer" | "split";

export interface DisputeResult {
  decision: DisputeDecision;
  /** Only meaningful when decision is "split": buyer's share of the money, 0–100. */
  splitBuyerPercent: number;
  /** 0–100 confidence in the decision. */
  confidence: number;
  rationale: string;
  buyerPoints: string[];
  sellerPoints: string[];
  recommendedAction: string;
  mode: AiMode;
}
