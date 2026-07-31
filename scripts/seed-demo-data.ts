// Day 3 (Jerry): "Add two demo sellers. One clearly safe (score 87), one
// clearly dodgy (score 23) so the demo always works."
//
// Live AI scoring is non-deterministic — good for a real product, bad for
// a judge watching a 4-minute pitch. These two records set trust_score
// directly rather than routing through the live webhook/AI pipeline, so
// the "safe seller" and "risky seller" screens always render the same way.
// Real transactions created during the demo still run the full live pipeline.
//
// Run with: npx tsx scripts/seed-demo-data.ts

import { supabaseAdmin } from "../lib/supabase";

async function seed() {
  const supabase = supabaseAdmin();

  const ninetyDaysAgo = new Date(Date.now() - 120 * 86_400_000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();

  // --- Demo buyer (used to create both demo transactions) ---
  const { data: buyer } = await supabase
    .from("users")
    .upsert(
      {
        email: "demo.buyer@trustflow.app",
        full_name: "Demo Buyer",
        phone: "08010000000",
        bank_code: "035",
        account_number: "0011223344",
        account_name: "Demo Buyer",
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  // --- Seller A: clearly safe ---
  const { data: safeSeller } = await supabase
    .from("users")
    .upsert(
      {
        email: "chidinma.gadgets@trustflow.app",
        full_name: "Chidinma's Gadgets",
        phone: "08020000001",
        bank_code: "035",
        account_number: "0022334455",
        account_name: "CHIDINMA OKAFOR",
        trust_score: 87,
        total_transactions: 12,
        successful_transactions: 12,
        disputes_filed: 0,
        bvn_nin_verified: true,
        created_at: ninetyDaysAgo,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  // --- Seller B: clearly dodgy ---
  const { data: dodgySeller } = await supabase
    .from("users")
    .upsert(
      {
        email: "quickdeals.ng@trustflow.app",
        full_name: "QuickDeals NG",
        phone: "08030000002",
        bank_code: "058",
        account_number: "0033445566",
        account_name: "EMEKA PERSONAL WALLET",
        trust_score: 23,
        total_transactions: 1,
        successful_transactions: 0,
        disputes_filed: 0,
        bvn_nin_verified: false,
        created_at: twoDaysAgo,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (!buyer || !safeSeller || !dodgySeller) {
    throw new Error("Seed failed — check that the users table upserts succeeded.");
  }

  // --- Transaction against the safe seller ---
  const { data: safeTx } = await supabase
    .from("transactions")
    .insert({
      buyer_id: buyer.id,
      seller_id: safeSeller.id,
      amount: 145000,
      item_description: "HP EliteBook 840 G5, 16GB RAM, 256GB SSD",
      status: "FUNDED",
      transaction_ref: "demo_safe_" + Date.now(),
      trust_score: 87,
      risk_level: "LOW",
      risk_reasons: [],
    })
    .select()
    .single();

  await supabase.from("chat_analyses").insert({
    transaction_id: safeTx?.id,
    raw_text:
      "Hi, still have the EliteBook? Sure — happy to do a video call first if you'd like. It's in great shape, I can send more photos too. Take your time deciding.",
    flags: [],
    scam_probability: 8,
    analysis_summary: "No pressure tactics detected; seller offered video verification unprompted.",
  });

  // --- Transaction against the dodgy seller ---
  const { data: dodgyTx } = await supabase
    .from("transactions")
    .insert({
      buyer_id: buyer.id,
      seller_id: dodgySeller.id,
      amount: 95000,
      item_description: "iPhone 13, 128GB (as advertised)",
      status: "FUNDED",
      transaction_ref: "demo_risky_" + Date.now(),
      trust_score: 23,
      risk_level: "HIGH",
      risk_reasons: [
        { type: "Urgency pressure", snippet: "pay now, last one left", severity: "high" },
        { type: "Refusal to verify", snippet: "no time for video calls", severity: "high" },
        { type: "Personal account request", snippet: "send to my personal account", severity: "medium" },
      ],
    })
    .select()
    .single();

  await supabase.from("chat_analyses").insert({
    transaction_id: dodgyTx?.id,
    raw_text:
      "Pay now, someone else is interested and it's the last one. No time for video calls, just send the money to my personal account and I'll ship today.",
    flags: [
      { type: "Urgency pressure", snippet: "pay now, last one left", severity: "high" },
      { type: "Refusal to verify", snippet: "no time for video calls", severity: "high" },
      { type: "Personal account request", snippet: "send to my personal account", severity: "medium" },
    ],
    scam_probability: 82,
    analysis_summary: "Multiple high-severity scam indicators: urgency pressure, refusal to verify, personal account request.",
  });

  console.log("Seeded demo buyer, safe seller (87/LOW), and risky seller (23/HIGH).");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
