import { NextRequest, NextResponse } from "next/server";
import { accountNameEnquiry, debitWalletTransfer } from "@/lib/alat-wallet";
import { supabaseServer } from "@/lib/supabase";

// Day 4 (Jerry): "Build 'confirm received' → pay the seller. Buyer taps
// confirm, ALAT pays the seller's bank instantly (after checking the account)."
//
// Also handles the auto-release path (H2O's timer calls this same endpoint
// when the buyer goes silent past the delivery window) and requires the
// seller to have passed identity verification first — a banned identity
// can't just resurface under a new profile.

export async function POST(req: NextRequest) {
  const { transactionId, releasedVia } = await req.json(); // releasedVia: "buyer_confirm" | "handover_code" | "auto_release"
  const supabase = await supabaseServer();

  const { data: tx } = await supabase
    .from("transactions")
    .select("*, seller:seller_id(*)")
    .eq("id", transactionId)
    .single();

  if (!tx) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (tx.status !== "FUNDED" && tx.status !== "DELIVERED") {
    return NextResponse.json({ error: "transaction not eligible for payout" }, { status: 400 });
  }
  if (!tx.seller.bvn_nin_verified) {
    return NextResponse.json({ error: "seller has not completed identity verification" }, { status: 403 });
  }

  // Confirm the destination account resolves to the seller's verified name
  // before releasing a naira — this is the "checking the account" step.
  const enquiry = await accountNameEnquiry({
    bankCode: tx.seller.bank_code,
    accountNumber: tx.seller.account_number,
  });
  if (!enquiry?.accountName || !namesRoughlyMatch(enquiry.accountName, tx.seller.account_name)) {
    return NextResponse.json({ error: "seller account name mismatch — payout blocked" }, { status: 409 });
  }

  const payout = await debitWalletTransfer({
    sourceAccountNumber: process.env.ALAT_ESCROW_POOL_ACCOUNT!,
    destinationAccountNumber: tx.seller.account_number,
    destinationBankCode: tx.seller.bank_code,
    amount: tx.amount,
    transactionReference: `payout_${tx.id}_${Date.now()}`,
    narration: `TrustFlow payout for ${tx.item_description}`,
    securityInfo: "", // TODO: populate once encryption scheme is confirmed with bank contact
  });

  await supabase
    .from("transactions")
    .update({
      status: "RELEASED",
      payout_ref: payout.data?.reference,
      confirmed_at: new Date().toISOString(),
      release_method: releasedVia || "buyer_confirm",
    })
    .eq("id", tx.id);

  await supabase.rpc("increment_seller_success", { seller_id: tx.seller_id });

  return NextResponse.json({ ok: true, payout });
}

function namesRoughlyMatch(a: string, b: string) {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  return norm(a).includes(norm(b).slice(0, 6)) || norm(b).includes(norm(a).slice(0, 6));
}
