<div align="center">

# TrustFlow

### Escrow that makes buying from strangers safe.

Pay a seller you have never met. Your money stays locked until you confirm the item arrived and it
is exactly what you paid for. Before you send a naira, an AI reads your chat for scam signs. If a
deal goes wrong, an AI settles it. And every trader carries a reputation they actually earned.

Built on Wema's ALAT rails for **Wema Hackaholics 7.0**.

[**View the design in Figma**](https://www.figma.com/design/Us0oRlytOQwSacJoGawZQV/WEMA-BANK-HACKATOBN)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![AI](https://img.shields.io/badge/AI-Claude-8A63D2)
![Hackaholics 7.0](https://img.shields.io/badge/Hackaholics%207.0-Hackathon-059669)

</div>

---

## The problem

Nigeria runs on social commerce. People buy and sell on WhatsApp, Instagram, and Telegram every
day. But there is no trust layer under any of it. You pay first and hope the seller ships, or the
seller ships first and hopes you pay. Someone always carries the risk, and someone always gets
burned.

TrustFlow puts a neutral middle between the two sides. The money is held, not handed over, until
the buyer confirms. And it does one thing no escrow service here does: it checks the deal for fraud
*before* the buyer pays, not after they have already lost the money.

## What it does

1. **Score the deal.** Paste your chat with the seller and the AI returns a Trust Score from 0 to
   100. If it smells like a scam, a red banner says so right on the payment screen, and a risky deal
   cannot be funded until you tick *"I understand the risk, pay anyway."*
2. **Check the seller.** Enter their phone or email and TrustFlow looks them up across past deals:
   new, reliable, or caution, with a verified badge if they passed KYC.
3. **Fund escrow.** The buyer pays into a dedicated account. The money is held. The seller sees that
   it is funded and ships.
4. **Release with a code.** The buyer gets a secret 6-digit handover code and only reveals it once
   the item is in hand and correct. The seller cannot get paid without it. If the buyer goes silent,
   an auto-release timer pays the seller so funds are never frozen forever.
5. **Settle disputes.** If the two disagree, an AI mediator weighs both sides and rules: pay the
   seller, refund the buyer, or split the difference.
6. **Build reputation.** Every clean deal raises your standing. Every dispute lowers it. The number
   is explainable, tied to real history, and shown on your dashboard.

## The app

One Next.js codebase that works on a laptop and a phone from the same routes. On desktop it is a
workspace: a fixed sidebar, a search bar, your trust score in the corner. On mobile the same screens
collapse to a compact top bar and a bottom tab bar. Nothing is a separate mobile build.

The look is a light "trust fintech" system: navy ink, emerald for the money-held-safe story, one
type scale, soft depth on a near-white canvas. The transaction history and the release receipt are
modelled on the bank apps Nigerians already trust, so the flow feels familiar the first time you
open it: history grouped by month with in/out totals, and a proper receipt you can share.

| Route | Screen | Backed by |
| ----- | ------ | --------- |
| `/` | Landing | The pitch |
| `/login` | Sign in | Passwordless: Google OAuth + one-time email link |
| `/dashboard` | Home | Your reputation and your own deals, scoped per user |
| `/new-escrow` | Create a deal | `createDeal`; runs the Trust Score if you paste a chat |
| `/trust-score` | Trust check | The seller's real score, verdict, and reasons |
| `/fund` | Payment | Scam banner + seller standing + the risk-acknowledgement gate |
| `/timeline` | Deal progress | The deal's real item, amount, seller, and status stepper |
| `/history` | Activity | Every deal you are part of, grouped by month |
| `/dispute` | Dispute | The AI mediator's real ruling |
| `/profile` | Profile | Reputation history, payout account, verification |
| `/selling` · `/request` · `/seller` | Selling | Your sales, payment requests, KYC |
| `/receipt` · `/released` · `/locked` | Confirmations | The proof each deal leaves behind |

## The AI

Three features, each a live API route powered by Claude. Every one calls the model when
`ANTHROPIC_API_KEY` is set and falls back to a deterministic offline heuristic otherwise, so the app
always works on stage with no key.

- **Trust Score.** A 0-100 pre-deal risk score that blends the chat, the seller's TrustFlow history,
  and a fraud watchlist (`lib/fraud/`) that hard-overrides a listed seller to risky even when no
  chat was pasted.
- **Scam detector.** Names the specific tactics in a message: pressure to pay now, moving off
  escrow, refusing to verify, prices too good to be true.
- **Dispute judge.** Weighs both sides' claims and evidence and decides: release, refund, or split.

Accuracy is measured, not assumed. `npm run eval:ai` scores the AI against 21 labelled cases in
[`lib/ai/eval`](lib/ai/eval).

## Reputation and seller standing

- **Trader reputation** (`lib/reputation`) is your own standing, derived from your deal history. It
  is deterministic and fully explainable: every point ties to a factor (completed deals, value
  moved, on-time confirmations, tenure, dispute rate) and the factors sum to the score. The AI
  writes the one-line summary. The number is always the engine's.
- **Seller standing** (`lib/seller`) scores the person you are about to pay, matched by a normalised
  contact across past deals, and shows it before you fund.

## Security

Money is the whole product, so the guardrails are not optional.

- **No IDOR.** Deal IDs are handled server-side with the service-role key, which bypasses row-level
  security, so every deal-by-id route proves the caller is a party to that deal first. Not a party
  reads as 404, so the API never even confirms a deal exists to someone who should not see it.
- **Clean logout.** Signing out revokes the session and clears the token, auth and session cookies,
  `localStorage`, and `sessionStorage`, so a shared device keeps nothing.
- **Guarded money moves.** A deal only reaches funded, completed, or refunded through a verified or
  checked path. The browser can never set those directly.

## Payments (ALAT)

The money-moves (collect, hold, payout, refund) run through the deal lifecycle
(`lib/payments/`, `lib/deals/store.ts`) with the same live/mock seam as everything else: real ALAT
calls when the keys are set, simulated otherwise, so the full escrow flow demos with no bank access.

- **Collect (fund escrow)** → ALATPay: `POST /api/escrow` + `POST /api/webhooks/alatpay` (verify and re-query)
- **Payout (release / refund)** → ALAT Wallet: `releaseWithCode`, auto-release, dispute rulings, `POST /api/payout`, `POST /api/refund`
- **Receipt** → `GET /api/receipt/:id`

See [`lib/payments/README.md`](lib/payments/README.md) for the wiring, and
[`docs/payments-alat.md`](docs/payments-alat.md) / [`docs/integration-plan.md`](docs/integration-plan.md)
for going fully live.

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run eval:ai      # score the AI on 21 labelled cases
```

It runs with **zero keys** in demo mode. Add keys to `.env.local` to go live:

```
ANTHROPIC_API_KEY=              # AI. Falls back to the offline heuristic without it.
NEXT_PUBLIC_SUPABASE_URL=       # auth + deals persistence
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only. Never commit it, never paste it in chat.
```

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**, deployed on **Vercel**
- **Claude** for the three AI features and the reputation summaries
- **Supabase** for passwordless auth (Google + magic link) and Postgres (`deals`, `reputations`)
- **ALAT APIs** for escrow collection and payouts

Every backend layer has the same live/demo seam: the real service when its keys are present, a
deterministic stand-in when they are not, so the app is never blocked on a backend.

## The team

One app, three lanes.

| Person | Lane | Owns |
| ------ | ---- | ---- |
| **Jerry** | Back end (lead) | ALAT escrow and payments, database, KYC and anti-fraud |
| **H2O** | Back end + front end | AI, deals, auth, reputation, and the responsive web + mobile UI |
| **Deji** | Design | The original Figma screens the product is built from |

## Project structure

```
app/
├── page.tsx              # Landing
├── _lib/
│   ├── AppShell.tsx      # the responsive sidebar + bottom-nav frame
│   ├── TrustDetail.tsx   # the Trust Score reveal
│   ├── screen-html.tsx   # renders the two celebration screens (locked, released)
│   └── nav.ts            # route map
├── login/ dashboard/ new-escrow/ fund/ timeline/ history/ dispute/
├── profile/ notifications/ settings/ seller/ selling/ request/
├── trust-score/ receipt/ locked/ released/          # the rest of the flow
└── api/
    ├── trust-score/  scam-check/  dispute/           # the 3 AI features
    ├── deals/  deals/[id]/(ship|release|dispute)/  auto-release/
    ├── escrow/  webhooks/alatpay/  payout/  refund/  receipt/[id]/   # ALAT rails
    ├── reputation/  seller-standing/  ai-health/
    └── auth/callback/
lib/
├── ai/          # Claude client, prompts, offline mock, 3 features, eval
├── auth/         # passwordless Supabase auth + demo mode
├── deals/        # escrow model + store (Supabase + seeded demo) + IDOR guard
├── payments/     # ALAT collect / payout / refund + live/mock seam
├── reputation/   # the trader reputation model
├── seller/       # seller-standing model
├── fraud/        # the watchlist that overrides the Trust Score
└── client/       # the typed browser API the screens call
middleware.ts     # refreshes the auth session cookie
docs/             # design notes, master plan, deploy and integration guides
```

Each backend area keeps its own README: [`lib/ai`](lib/ai/README.md),
[`lib/auth`](lib/auth/README.md), [`lib/deals`](lib/deals/README.md),
[`lib/reputation`](lib/reputation/README.md). The screen-to-backend wiring map is in
[`docs/wiring-map.md`](docs/wiring-map.md).
