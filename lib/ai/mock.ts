/* ==========================================================================
   Offline heuristic engine — TrustFlow's "demo mode".

   When no ANTHROPIC_API_KEY is set (or a live call fails), the AI features
   fall back to these deterministic functions so the app still demos on stage
   with no network. The logic is a transparent keyword + seller-history model:
   good enough to feel real and to make the two demo sellers land where the
   plan wants them (a clean seller ~87, a dodgy one ~23).

   This is intentionally simple and self-contained — the real intelligence is
   Claude (see client.ts + prompts.ts); this just keeps the lights on.
   ========================================================================== */

import { clampScore } from "./client";
import type {
  DisputeRequest,
  DisputeResult,
  ScamCheckRequest,
  ScamCheckResult,
  ScamTactic,
  SellerProfile,
  TrustReason,
  TrustScoreRequest,
  TrustScoreResult,
} from "./types";

/** Scam phrases → the tactic they signal. Matched case-insensitively. */
const SCAM_SIGNALS: { pattern: RegExp; tactic: string; weight: number }[] = [
  { pattern: /\b(personal account|my own account|different account|another account)\b/i, tactic: "Payment steered to a personal account", weight: 22 },
  { pattern: /\b(outside|off) (the )?(app|escrow|platform|trustflow)\b/i, tactic: "Trying to move the deal outside escrow", weight: 25 },
  { pattern: /\b(gift ?card|steam card|itunes|amazon card)\b/i, tactic: "Asking for gift cards", weight: 28 },
  { pattern: /\b(crypto|bitcoin|btc|usdt|binance)\b/i, tactic: "Pushing crypto payment", weight: 18 },
  { pattern: /\b(western union|moneygram)\b/i, tactic: "Untraceable money transfer", weight: 24 },
  { pattern: /\b(pay|send).{0,20}(fee|charge|tax|clearance).{0,20}(release|unlock|before)\b/i, tactic: "Advance-fee / pay-to-release trick", weight: 26 },
  { pattern: /\b(release|unlock).{0,20}(fee|charge|payment)\b/i, tactic: "Advance-fee / pay-to-release trick", weight: 26 },
  { pattern: /\b(pay|send)\b.{0,15}\b(me\s+)?direct(ly)?\b/i, tactic: "Pushing you to pay the seller directly", weight: 20 },
  { pattern: /\bescrow\b.{0,20}\b(too long|slow|stress|wahala|delay|delays)\b/i, tactic: "Talking you out of escrow", weight: 22 },
  { pattern: /\b(skip|forget|no need for|without|don'?t need)\b.{0,12}\bescrow\b/i, tactic: "Talking you out of escrow", weight: 22 },
  { pattern: /\b(urgent|now now|right now|immediately|last one|someone else (is|will|are)|before (it|someone))\b/i, tactic: "Urgency and pressure", weight: 14 },
  { pattern: /\b(send|pay)\b.{0,15}\b(within|in)\s*\d+\s*(min|mins|minutes|hrs|hours)\b/i, tactic: "Countdown pressure to pay fast", weight: 14 },
  { pattern: /\b(trust me|i swear|i promise|i'?m not a scammer|do you not trust)\b/i, tactic: "Pressuring you to trust them", weight: 12 },
  { pattern: /\b(pay first|pay before|send first|transfer first|deposit first)\b/i, tactic: "Demanding payment before any protection", weight: 20 },
  { pattern: /\b(i (have |already )?sent|check again|it'?s pending|reversed|bank delay)\b/i, tactic: "Fake or excused payment proof", weight: 20 },
  { pattern: /\b(bit\.ly|tinyurl|http:\/\/|click (this|the) link|verify your account)\b/i, tactic: "Suspicious link / phishing", weight: 20 },
];

function findTactics(text: string): { tactics: ScamTactic[]; pressure: number } {
  const seen = new Set<string>();
  const tactics: ScamTactic[] = [];
  let pressure = 0;
  for (const { pattern, tactic, weight } of SCAM_SIGNALS) {
    const match = text.match(pattern);
    if (match && !seen.has(tactic)) {
      seen.add(tactic);
      pressure += weight;
      tactics.push({
        name: tactic,
        evidence: `"${match[0].trim()}"`,
        severity: weight >= 24 ? "high" : weight >= 16 ? "medium" : "low",
      });
    }
  }
  return { tactics, pressure };
}

/** Score a seller's history: returns a -/+ adjustment around a neutral base. */
function sellerAdjustment(seller?: SellerProfile): { delta: number; reasons: TrustReason[]; flags: string[] } {
  const reasons: TrustReason[] = [];
  const flags: string[] = [];
  if (!seller) {
    reasons.push({ label: "No seller history", detail: "We know nothing about this seller yet, so treat with extra care.", weight: "negative" });
    return { delta: -10, reasons, flags };
  }

  let delta = 0;

  if (seller.verified) {
    delta += 18;
    reasons.push({ label: "Identity verified", detail: "This seller passed BVN/NIN verification, so a banned scammer can't just reappear.", weight: "positive" });
  } else {
    delta -= 20;
    flags.push("Seller has not verified their identity (BVN/NIN)");
    reasons.push({ label: "Not verified", detail: "This seller hasn't verified their identity. Unverified sellers can't be paid out until they do.", weight: "negative" });
  }

  const deals = seller.completedDeals ?? 0;
  if (deals >= 20) {
    delta += 16;
    reasons.push({ label: "Strong track record", detail: `${deals} completed deals on TrustFlow.`, weight: "positive" });
  } else if (deals >= 5) {
    delta += 8;
    reasons.push({ label: "Some track record", detail: `${deals} completed deals so far.`, weight: "positive" });
  } else {
    delta -= 6;
    reasons.push({ label: "Little history", detail: `Only ${deals} completed deal${deals === 1 ? "" : "s"}. Not much to go on.`, weight: "negative" });
  }

  const disputes = seller.disputes ?? 0;
  if (disputes >= 3) {
    delta -= 18;
    flags.push(`Seller has ${disputes} past disputes`);
    reasons.push({ label: "Repeated disputes", detail: `${disputes} past disputes is a real warning sign.`, weight: "negative" });
  } else if (disputes > 0) {
    delta -= 6;
    reasons.push({ label: "A past dispute", detail: `${disputes} past dispute on record.`, weight: "neutral" });
  }

  const age = seller.accountAgeDays ?? 0;
  if (age >= 180) {
    delta += 8;
    reasons.push({ label: "Established account", detail: "Account has been active for a while.", weight: "positive" });
  } else if (age <= 7) {
    delta -= 10;
    flags.push("Brand-new seller account (under a week old)");
    reasons.push({ label: "Very new account", detail: "This account was created only days ago.", weight: "negative" });
  }

  if (typeof seller.rating === "number") {
    if (seller.rating >= 4.5) {
      delta += 6;
      reasons.push({ label: "Highly rated", detail: `Buyers rate this seller ${seller.rating.toFixed(1)}/5.`, weight: "positive" });
    } else if (seller.rating < 3) {
      delta -= 8;
      reasons.push({ label: "Low rating", detail: `Buyers rate this seller ${seller.rating.toFixed(1)}/5.`, weight: "negative" });
    }
  }

  return { delta, reasons, flags };
}

export function mockTrustScore(req: TrustScoreRequest): TrustScoreResult {
  const { tactics, pressure } = findTactics(req.chat || "");
  const seller = sellerAdjustment(req.seller);

  // Neutral base, lifted/lowered by history, then dragged down by chat pressure.
  const score = clampScore(62 + seller.delta - pressure);
  const verdict = score >= 70 ? "safe" : score >= 40 ? "caution" : "risky";

  const chatReasons: TrustReason[] = tactics.map((t) => ({
    label: t.name,
    detail: `Seen in the chat: ${t.evidence}`,
    weight: "negative",
  }));
  const flags = [...seller.flags, ...tactics.filter((t) => t.severity !== "low").map((t) => t.name)];

  const headline =
    verdict === "safe"
      ? "Looks safe. The usual protections apply."
      : verdict === "caution"
        ? "Be careful — a few things don't add up."
        : "High risk. This deal shows classic scam signs.";

  const recommendation =
    verdict === "safe"
      ? "Go ahead, but still pay through TrustFlow escrow so your money is protected until you confirm."
      : verdict === "caution"
        ? "Only proceed inside TrustFlow escrow, and don't pay any 'fees' to release your item."
        : "Do not pay this seller directly. If you continue at all, use escrow only, and be ready to walk away.";

  return {
    score,
    verdict,
    headline,
    reasons: [...seller.reasons, ...chatReasons].slice(0, 6),
    redFlags: Array.from(new Set(flags)),
    recommendation,
    mode: "mock",
  };
}

export function mockScamCheck(req: ScamCheckRequest): ScamCheckResult {
  const { tactics, pressure } = findTactics(req.text || "");
  const confidence = clampScore(pressure > 0 ? 45 + pressure : 20);
  const riskLevel = pressure >= 40 ? "high" : pressure >= 18 ? "medium" : "low";
  const isScam = pressure >= 18;

  const advice = isScam
    ? "Don't pay outside TrustFlow escrow, and never send money to 'release' an item — that's the scam."
    : "Nothing obviously wrong, but still pay through escrow so you're covered either way.";

  return { isScam, riskLevel, confidence, tactics, advice, mode: "mock" };
}

export function mockDispute(req: DisputeRequest): DisputeResult {
  const buyerText = `${req.buyer?.claim ?? ""} ${(req.buyer?.evidence ?? []).join(" ")}`.toLowerCase();
  const sellerText = `${req.seller?.claim ?? ""} ${(req.seller?.evidence ?? []).join(" ")}`.toLowerCase();

  // Very light evidence weighting: proof-of-delivery vs proof-of-problem.
  const sellerProof = /(unboxing|handover code|tracking|delivered|signed|receipt|video|photo)/.test(sellerText);
  const buyerProof = /(damaged|wrong item|empty|not (as )?described|never (arrived|received)|fake|broken|video|photo)/.test(buyerText);

  let decision: DisputeResult["decision"];
  let splitBuyerPercent = 0;
  let confidence: number;
  let rationale: string;

  if (buyerProof && !sellerProof) {
    decision = "refund_buyer";
    confidence = 70;
    rationale = "The buyer shows evidence of a problem and the seller has no delivery proof, so the fair outcome is a full refund.";
  } else if (sellerProof && !buyerProof) {
    decision = "release_to_seller";
    confidence = 70;
    rationale = "The seller can show the item was delivered as agreed and the buyer offers no counter-evidence, so the money should be released to the seller.";
  } else if (sellerProof && buyerProof) {
    decision = "split";
    splitBuyerPercent = 50;
    confidence = 55;
    rationale = "Both sides show partial evidence. Without stronger proof either way, an even split is the fairest interim outcome.";
  } else {
    decision = "split";
    splitBuyerPercent = 50;
    confidence = 40;
    rationale = "Neither side has provided clear evidence. Pending real proof (unboxing video, handover code, delivery record), an even split is the safest call.";
  }

  return {
    decision,
    splitBuyerPercent,
    confidence,
    rationale,
    buyerPoints: req.buyer?.claim ? [req.buyer.claim] : [],
    sellerPoints: req.seller?.claim ? [req.seller.claim] : [],
    recommendedAction:
      decision === "refund_buyer"
        ? "Refund the buyer in full from escrow and log the seller's account for review."
        : decision === "release_to_seller"
          ? "Release the held funds to the seller's verified account."
          : `Split the escrow: ${splitBuyerPercent}% back to the buyer, the rest to the seller.`,
    mode: "mock",
  };
}
