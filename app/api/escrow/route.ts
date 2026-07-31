import { NextRequest, NextResponse } from "next/server";
import { generateVirtualAccount as generateAlatPayAccount } from "@/lib/alatpay";
import { supabaseServer } from "@/lib/supabase";

// Day 2 (Jerry): "Build the escrow wallet + take payment. Buyer pays into a
// safe ALAT wallet; the app marks the deal 'funded' when the cash truly lands."
//
// This calls ALATPay to generate the one-time virtual account, then stores
// our own 10-minute expiry on the transaction row (tighter than ALATPay's
// own ~30 min window, per the master plan's fraud-prevention design).

export async function POST(req: NextRequest) {
  const { transactionId } = await req.json();
  const supabase = await supabaseServer();

  const { data: tx } = await supabase
    .from("transactions")
    .select("*, buyer:buyer_id(*)")
    .eq("id", transactionId)
    .single();

  if (!tx) return NextResponse.json({ error: "transaction not found" }, { status: 404 });

  const account = await generateAlatPayAccount({
    amount: tx.amount,
    transactionRef: tx.transaction_ref,
    buyerEmail: tx.buyer.email,
    buyerPhone: tx.buyer.phone,
    buyerName: tx.buyer.full_name,
  });

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("transactions")
    .update({
      status: "PENDING_PAYMENT",
      virtual_account_number: account.data?.virtualBankAccountNumber,
      virtual_account_expires_at: expiresAt,
      alat_transaction_id: account.data?.transactionId,
    })
    .eq("id", tx.id);

  return NextResponse.json({ account: account.data, expiresAt });
}
