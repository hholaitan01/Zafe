# Payments — ALAT escrow rails (Jerry, integrated by H2O)

The money-moves for the escrow: **collect** the buyer's funds, **hold** them,
**pay out** to the seller, **refund** the buyer. Ported from Jerry's ALAT work
onto the `deals` model, with the same **live / mock seam** as the rest of the
backend so the whole flow demos with zero bank access.

## Live vs. mock

Collection (ALATPay) and payout (ALAT Wallet) are separate ALAT products with
separate keys, so each goes live independently (`lib/payments/config.ts`):

| Keys set | Behaviour |
| -------- | --------- |
| none | **Mock** — fake collection account, instant "paid", fake payout/refund refs. Full flow works on stage. |
| `ALATPAY_API_KEY` + `ALATPAY_BUSINESS_ID` | Real **collection** (buyer funds escrow). |
| `ALAT_WALLET_API_KEY` + `ALAT_ESCROW_POOL_ACCOUNT` | Real **payout / refund** (seller paid, buyer refunded). |

The high-level ops in `index.ts` never throw — a live failure returns
`{ ok: false, error }`, exactly like the AI layer.

## What's where

```
lib/payments/
├── config.ts    # which mode (collectionLive / payoutLive)
├── alatpay.ts   # LIVE ALATPay client — virtual account, status re-query, callback check (Jerry)
├── wallet.ts    # LIVE ALAT Wallet client — account enquiry, transfer (Jerry)
├── receipt.ts   # receipt data for the Receipt screen (Jerry, on the Deal model)
└── index.ts     # createCollectionAccount / payoutSeller / refundBuyer  (+ mock)
```

## How it wires into the deal lifecycle

The money-moves run **through `lib/deals/store.ts`**, so status + timeline stay
consistent, and there are matching thin REST routes for the live ALAT surface:

| Step | Store function | REST route |
| ---- | -------------- | ---------- |
| Fund — collection account | `attachCollectionAccount` | `POST /api/escrow` |
| Money lands → funded | `setDealStatus(id,"funded")` | `POST /api/webhooks/alatpay` (verify + re-query) |
| Release (handover code) | `releaseWithCode` → `payoutSeller` | — |
| Release (direct) / auto-release | `releaseToSeller` / `runAutoReleases` | `POST /api/payout` |
| Dispute ruling → money | `openAndJudgeDispute` | — |
| Refund (full / partial) | `refundDeal` | `POST /api/refund` |
| Receipt | — | `GET /api/receipt/:id` (`?format=text`) |

Payouts are **idempotent** — a deal that already has a `payoutRef` isn't paid twice.

## Going live (Jerry)

1. Subscribe on the ALAT portals, set the keys above in `.env.local` / Vercel.
2. Fill in the two `TODO`s in `wallet.ts` / `index.ts` — the transfer
   `securityInfo` encryption scheme (from your bank contact) and confirm the
   ALATPay base URL + callback fields against your dashboard.
3. Capture the seller's payout account (`deals.seller_payout`) at release time.

See [`docs/payments-alat.md`](../../docs/payments-alat.md) and
[`docs/integration-plan.md`](../../docs/integration-plan.md).
