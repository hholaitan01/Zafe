// Trust Score = weighted blend of transaction history (35%), chat NLP (30%),
// account age (20%), and pattern matching against flagged accounts (15%).

export type SellerSignals = {
  totalTransactions: number;
  successfulTransactions: number;
  disputesFiled: number;
  accountCreatedAt: Date;
  scamProbability: number; // 0-100, from analyzeChatForScams
  isFlaggedPattern: boolean; // phone/email/bank matched a known-fraud record
};

export function computeTrustScore(s: SellerSignals) {
  const historyScore =
    s.totalTransactions === 0
      ? 50
      : Math.max(
          0,
          Math.round((s.successfulTransactions / s.totalTransactions) * 100) -
            s.disputesFiled * 8
        );

  const chatScore = 100 - s.scamProbability;

  const ageDays = (Date.now() - s.accountCreatedAt.getTime()) / 86_400_000;
  const ageScore = ageDays < 7 ? 20 : ageDays > 90 && s.totalTransactions > 0 ? 90 : 55;

  const patternScore = s.isFlaggedPattern ? 5 : 90;

  const weighted =
    historyScore * 0.35 + chatScore * 0.3 + ageScore * 0.2 + patternScore * 0.15;

  const score = Math.max(1, Math.min(99, Math.round(weighted)));
  const riskLevel = score >= 65 ? "LOW" : score >= 40 ? "MEDIUM" : "HIGH";

  return { score, riskLevel, breakdown: { historyScore, chatScore, ageScore, patternScore } };
}
