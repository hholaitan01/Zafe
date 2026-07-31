import { NextRequest, NextResponse } from "next/server";
import { debitWalletTransfer } from "@/lib/alat-wallet";
import { supabaseServer } from "@/lib/supabase";

// Day 5 (Jerry): "Build refunds + the receipt. Full or partial refund back
// to the buyer, and a shareable receipt at every step."
//
// Called after the AI dispute judge (H2O's part) recommends PARTIAL_REFUND
// or FULL_REFUND, or when the buyer disputes and the recommendation is
// accepted. `refundAmount` lets partial refunds split the escrowed amount.

export async function POST(req: NextRequest) {
  const { transactionId, refundAmount, disputeId } = await req.json();
  const supabase = await supabaseServer();

  const { data: tx } = await supabase
    .from("transactions")
    .select("*, buyer:buyer_id(*), seller:seller_id(*)")
    .eq("id", transactionId)
    .single();

  if (!tx) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!["FUNDED", "DELIVERED", "DISPUTED"].includes(tx.status)) {
    return NextResponse.json({ error: "transaction not eligible for refund" }, { status: 400 });
  }

  const amount = refundAmount ?? tx.amount;
  if (amount > tx.amount) {
    return NextResponse.json({ error: "refund amount exceeds escrowed amount" }, { status: 400 });
  }

  // Buyer must have bank details on file (captured at signup) to receive
  // a refund into an arbitrary bank account, same as seller payouts.
  if (!tx.buyer.bank_code || !tx.buyer.account_number) {
    return NextResponse.json({ error: "buyer has no refund account on file" }, { status: 400 });
  }

  const refund = await debitWalletTransfer({
    sourceAccountNumber: process.env.ALAT_ESCROW_POOL_ACCOUNT!,
    destinationAccountNumber: tx.buyer.account_number,
    destinationBankCode: tx.buyer.bank_code,
    amount,
    transactionReference: `refund_${tx.id}_${Date.now()}`,
    narration: `TrustFlow refund for ${tx.item_description}`,
    securityInfo: "", // TODO: populate once encryption scheme is confirmed with bank contact
  });

  const isPartial = amount < tx.amount;
  const newStatus = isPartial ? "PARTIALLY_REFUNDED" : "REFUNDED";

  let partialPayout = null;
  if (isPartial) {
    if (!tx.seller.bvn_nin_verified) {
      return NextResponse.json({ error: "seller has not completed identity verification for remainder payout" }, { status: 403 });
    }
    const remainder = tx.amount - amount;
    partialPayout = await debitWalletTransfer({
      sourceAccountNumber: process.env.ALAT_ESCROW_POOL_ACCOUNT!,
      destinationAccountNumber: tx.seller.account_number,
      destinationBankCode: tx.seller.bank_code,
      amount: remainder,
      transactionReference: `partial_payout_${tx.id}_${Date.now()}`,
      narration: `TrustFlow partial payout for ${tx.item_description}`,
      securityInfo: "", // TODO: populate once encryption scheme is confirmed with bank contact
    });
  }

  await supabase
    .from("transactions")
    .update({ 
      status: newStatus, 
      payout_ref: refund.data?.reference,
      partial_refund_amount: isPartial ? amount : null,
      confirmed_at: new Date().toISOString()
    })
    .eq("id", tx.id);

  if (disputeId) {
    await supabase
      .from("disputes")
      .update({ resolution: newStatus, resolved_at: new Date().toISOString() })
      .eq("id", disputeId);
  }

  await supabase.rpc("increment_seller_disputes", { seller_id: tx.seller_id });

  return NextResponse.json({ ok: true, refund, amountRefunded: amount, partialPayout });
}
