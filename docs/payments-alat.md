# ALAT payments — scoping note for Jerry

Payments (ALAT) is **Jerry's lane**. The whole escrow flow is already built and working, but the
money-moves are **mocked** right now — they change the deal status without moving real money. This
note is exactly what to plug in.

## Two ALAT portals — you need both

1. **ALATPay** — `alatpay.developer.azure-api.net` → for **collecting** money (funding escrow).
   Use **"Pay With Bank Transfer"** (gives the buyer a one-time virtual account + a webhook when
   they've paid).
2. **ALAT Developer / Wema** — `wema-alatdev-apimgt.developer.azure-api.net` → for **paying out**.
   Use the **"Merchant Payout API"** (transfer to any bank account). Optionally
   **Account / Identity** name enquiry to verify a seller's account before payout.

## How it maps to our escrow

| Escrow step | ALAT API | Portal |
| ----------- | -------- | ------ |
| **Fund escrow** (buyer pays in) | Pay With Bank Transfer | ALATPay |
| **Hold** (in escrow) | — funds just sit in our merchant wallet, no separate API | — |
| **Release to seller / Refund to buyer** | Merchant Payout API | Wema |
| **Verify seller before payout** (optional) | Account / Identity name enquiry | Wema |

There's also a *Closed Wallet* API for per-user balances — **skip it**, it's overkill for us.

## What to pull from the portals (all behind the login)

- A **subscription key** (`Ocp-Apim-Subscription-Key`) — one per product you subscribe to.
- The **request/response + webhook** shape for *Pay With Bank Transfer* and *Merchant Payout*.

## Where it plugs into our code (the mocked spots you'll replace)

- `lib/deals/store.ts` — `releaseWithCode`, `runAutoReleases` (payout), and the fund status move.
- `app/api/deals/*` and `app/fund/page.tsx` — the fund action.
- Today these call `setDealStatus(...)`. Swap in the real ALAT call, then keep the status update.

The screens are ready and already show the amount, the trust/scam check, and the seller standing.
You just make the money real.

## Secrets — important

Put every key in `.env.local` locally and in **Vercel** env vars, e.g.:

```
ALATPAY_SUBSCRIPTION_KEY=        # collection (ALATPay)
ALAT_PAYOUT_SUBSCRIPTION_KEY=    # Merchant Payout (Wema)
ALATPAY_BUSINESS_ID=             # merchant / business id
```

**Never paste keys in chat or commit them** — the API / service-role keys bypass everything.
`.env.local` is git-ignored; set the same values in the Vercel dashboard for the deploy.

## Reference

- ALATPay – Pay With Bank Transfer: <https://alatpay.developer.azure-api.net/pay-with-bank-transfer>
- ALATPay – Get Started: <https://alatpay.developer.azure-api.net/get-started>
- Merchant Payout API: <https://wema-alatdev-apimgt.developer.azure-api.net/merchant-payout>
