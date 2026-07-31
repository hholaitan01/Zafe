import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { buildReceipt, receiptToText } from "@/lib/receipt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = await params;
  const supabase = await supabaseServer();

  const { data: tx } = await supabase
    .from("transactions")
    .select("*, buyer:buyer_id(*), seller:seller_id(*)")
    .eq("id", transactionId)
    .single();

  if (!tx) return NextResponse.json({ error: "not found" }, { status: 404 });

  const receipt = buildReceipt(tx);
  const format = req.nextUrl.searchParams.get("format");

  if (format === "text") {
    return new NextResponse(receiptToText(receipt), { headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json(receipt);
}
