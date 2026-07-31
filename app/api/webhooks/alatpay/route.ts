import { NextRequest, NextResponse } from "next/server";
import { isValidAlatPayCallback, checkTransactionStatus } from "@/lib/alatpay";
import { supabaseAdmin } from "@/lib/supabase";
import { analyzeChatForScams } from "@/lib/ai";
import { computeTrustScore } from "@/lib/trust-score";

// Day 2 (Jerry): "the app marks the deal 'funded' when the cash truly lands" —
// this is the truth-check. We never trust a screenshot; we only trust this
// callback PLUS a re-query against ALATPay's own verify endpoint.

export async function POST(req: NextRequest) {
  const payload = await req.json();

  if (!isValidAlatPayCallback(payload)) {
    return NextResponse.json({ error: "invalid callback payload" }, { status: 401 });
  }

  const { data } = payload;
  if (data.status !== "completed" && data.status !== "successful") {
    return NextResponse.json({ received: true }); // ignore pending/failed events
  }

  const supabase = supabaseAdmin();

  const { data: tx } = await supabase
    .from("transactions")
    .select("*, seller:seller_id(*)")
    .eq("transaction_ref", data.orderId)
    .single();

  if (!tx) return NextResponse.json({ error: "transaction not found" }, { status: 404 });

  // Re-query directly rather than trusting the callback alone — this is
  // the "no fake receipts" guarantee from the master plan.
  const transactionIdToVerify = tx.alat_transaction_id || data.transactionId || data.id;
  if (!transactionIdToVerify) {
    return NextResponse.json({ error: "missing transaction id for verification" }, { status: 400 });
  }
  const verified = await checkTransactionStatus(transactionIdToVerify);
  if (verified?.data?.status !== "completed" && verified?.data?.status !== "successful") {
    return NextResponse.json({ error: "callback did not match verified status" }, { status: 409 });
  }

  await supabase.from("transactions").update({ status: "FUNDED" }).eq("id", tx.id);

  // Run the Trust Score the moment funds are confirmed — before the seller ships.
  let scamProbability = 30;
  let flags: any[] = [];
  let summary = "";
  if (tx.chat_text) {
    const analysis = await analyzeChatForScams(tx.chat_text);
    scamProbability = analysis.scam_probability;
    flags = analysis.flags;
    summary = analysis.summary;
    await supabase.from("chat_analyses").insert({
      transaction_id: tx.id,
      raw_text: tx.chat_text,
      flags,
      scam_probability: scamProbability,
      analysis_summary: summary,
    });
  }

  const { score, riskLevel } = computeTrustScore({
    totalTransactions: tx.seller.total_transactions,
    successfulTransactions: tx.seller.successful_transactions,
    disputesFiled: tx.seller.disputes_filed,
    accountCreatedAt: new Date(tx.seller.created_at),
    scamProbability,
    isFlaggedPattern: false, // TODO: real pattern-match lookup against banned identities
  });

  await supabase
    .from("transactions")
    .update({ trust_score: score, risk_level: riskLevel, risk_reasons: flags })
    .eq("id", tx.id);

  return NextResponse.json({ received: true });
}
