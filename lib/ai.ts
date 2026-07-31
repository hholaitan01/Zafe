import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCAM_SYSTEM_PROMPT = `You are a fraud detection analyst for a P2P escrow platform in Nigeria.
Analyze this conversation between a buyer and seller.
Look for these red flags:
1. Urgency pressure ("Pay now", "Last one", "Someone else wants it")
2. Refusal to verify identity (no video call, no photo of item)
3. Price significantly below market value
4. Request for payment to personal account instead of business
5. Newly created social media account
6. Inconsistent product descriptions
7. Request to move the conversation to another platform

Return JSON only, no markdown fences:
{"scam_probability": 0-100, "flags": [{"type": "...", "snippet": "...", "severity": "low|medium|high"}], "summary": "one sentence assessment"}`;

export async function analyzeChatForScams(chatText: string) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SCAM_SYSTEM_PROMPT },
      { role: "user", content: chatText },
    ],
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0].message.content || "{}";
  return JSON.parse(raw) as {
    scam_probability: number;
    flags: { type: string; snippet: string; severity: string }[];
    summary: string;
  };
}

const DISPUTE_SYSTEM_PROMPT = `You are a fair dispute mediator for a P2P escrow platform.
Given the transaction details, delivery evidence, and both parties' statements,
recommend exactly one of:
- RELEASE: funds go to seller (goods delivered as described)
- PARTIAL_REFUND: split amount (goods received but not as described)
- FULL_REFUND: return all funds to buyer (goods not received or scam)

Return JSON only, no markdown fences:
{"recommendation": "RELEASE|PARTIAL_REFUND|FULL_REFUND", "reasoning": "clear explanation, fair to both parties"}`;

export async function resolveDispute(context: {
  itemDescription: string;
  amount: number;
  trackingNumber?: string;
  buyerComplaint: string;
  sellerResponse: string;
}) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DISPUTE_SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(context) },
    ],
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0].message.content || "{}";
  return JSON.parse(raw) as { recommendation: string; reasoning: string };
}
