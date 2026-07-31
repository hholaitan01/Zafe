# TrustFlow AI (v2 — ALAT / Wema Hackaholics 7.0)

AI-powered escrow for P2P physical-goods transactions in Nigeria, running on
Wema's ALAT rails. Team: Jerry (back end — payments/escrow) · H2O (back end —
AI/deal logic) · Deji (front end).

This README covers **Jerry's slice** of the build — the escrow, payment, and
payout engine. H2O owns `lib/ai.ts` and `lib/trust-score.ts`'s live prompts;
Deji owns everything under rendering in `app/`.

## The ALAT split (read this first)

ALAT is two separate products with different auth models — don't conflate them:

| | ALATPay (`lib/alatpay.ts`) | ALAT Wallet Services (`lib/alat-wallet.ts`) |
|---|---|---|
| What it does | Collects the buyer's payment into escrow | Holds the escrow pool + pays sellers out |
| Auth | `businessId` + API key, self-serve signup | `x-api-key` issued by a bank contact — **needs sign-off** |
| Used for | Day 2: virtual account + webhook | Day 4: account enquiry + payout · Day 5: refunds |

**Start the ALAT Wallet Services access request on Day 1.** It's explicitly
the slowest-arriving piece in the plan — nothing in Day 4 or 5 works without
it, so don't let it sit until you need it.

## Setup

1. `npm install`
2. Create a Supabase project → run `supabase/schema.sql` in the SQL editor.
3. Register on the ALATPay merchant portal → get `ALATPAY_API_KEY` + `ALATPAY_BUSINESS_ID`.
4. Request ALAT Wallet Services access from your bank contact → this gets you `ALAT_WALLET_API_KEY` and an escrow pool account number.
5. Copy `.env.example` to `.env.local`, fill in every value.
6. `npm run dev` → http://localhost:3000

## Jerry's task checklist

- [ ] **Day 1** — Project + Supabase schema (`supabase/schema.sql`) live. ALAT Wallet Services access request submitted.
- [ ] **Day 2** — `app/api/escrow/route.ts` (generate virtual account) and `app/api/webhooks/alatpay/route.ts` (confirm funded) working against ALATPay sandbox.
- [ ] **Day 3** — Run `npx tsx scripts/seed-demo-data.ts` to seed the two demo sellers (87/LOW, 23/HIGH) — hand off to Deji for the Trust Score screens.
- [ ] **Day 4** — `app/api/payout/route.ts` working: account name enquiry + debit wallet transfer, gated on `bvn_nin_verified`.
- [ ] **Day 5** — `app/api/refund/route.ts` and `app/api/receipt/[transactionId]/route.ts` working, wired to H2O's dispute judge output.
- [ ] **Day 6** — Re-run the seed script against fresh demo accounts if needed; make sure one deal sits mid-flow and one sits in dispute, so the dashboard doesn't look empty.
- [ ] **Day 7** — Final backend check, tidy code, this README updated with anything that changed.

## Two things to nail down before Day 4

1. **`securityInfo` encryption** in `debitWalletTransfer()` — ALAT's public docs
   confirm a request needs to be signed/encrypted but don't spec the exact
   algorithm. Get this from your bank contact directly; don't guess at it,
   since a wrong encryption scheme fails silently or worse.
2. **ALATPay callback signing** — unlike some gateways, ALATPay's public docs
   describe a callback URL model without a clearly documented HMAC header.
   Confirm whether they sign callbacks in your merchant dashboard, and if so,
   verify that signature in `isValidAlatPayCallback()` instead of just
   checking `businessId` + `status`.

## Fraud-prevention mechanics this code implements

- **No fake receipts**: the webhook re-queries ALATPay's own verify endpoint
  before marking a transaction `FUNDED` — never trusts the callback alone.
- **Expiring virtual account**: escrow route sets its own 10-minute expiry
  on top of ALATPay's ~30-minute default.
- **Verified payouts only**: `payout` and `refund` routes block if the
  seller/buyer hasn't passed identity verification, and cross-check the
  destination account name before releasing funds.
