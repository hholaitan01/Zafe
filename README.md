<div align="center">

# TrustFlow AI

### AI-powered escrow for peer-to-peer trades

**Buy and sell from strangers without getting scammed.** Money is held safe until the buyer
confirms, an AI flags scams before anyone pays, an AI settles disputes, and every trader builds a
real reputation over time — built on Wema's own ALAT rails for **Wema Hackaholics 7.0**.

[🎨 **View the design in Figma**](https://www.figma.com/design/Us0oRlytOQwSacJoGawZQV/WEMA-BANK-HACKATOBN)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Claude](https://img.shields.io/badge/AI-Claude-8A63D2)
![Track](https://img.shields.io/badge/Hackaholics%207.0-Hackathon-E4144F)

</div>

---

## The problem

If you buy something on WhatsApp or Instagram, you either pay first and pray the seller ships,
or the seller ships first and prays you pay. Somebody always risks getting cheated. **TrustFlow
removes that risk** by holding the money safely in the middle until both sides are happy — and by
putting an AI check between the buyer and their money *before* they pay.

## How it works

1. **Score** — before you pay, an AI reads your chat with the seller and returns a **Trust Score (0–100)**. A red "scam signs detected" banner appears right on the payment screen, and a risky deal can't be funded until you tick *"I understand the risk, pay anyway."*
2. **Check the seller** — enter the seller's phone/email and TrustFlow looks them up across past deals: **new / reliable / caution**, plus a verified badge.
3. **Secure** — the buyer pays into escrow. The money is **held**, not sent to the seller yet.
4. **Release** — the buyer confirms with a secret **handover code** and the seller is paid. If the buyer goes silent, an **auto-release timer** pays the seller so funds can't be frozen forever.
5. **Resolve** — if the two disagree, an **AI mediator** weighs both sides' evidence and decides fairly: pay, refund, or split.
6. **Build reputation** — every clean deal raises your **trader reputation**; disputes lower it. It's a real, explainable score, shown on your dashboard.

## What's built

**The whole buyer journey runs on real backend logic** (rendered from Deji's designs):

| Route | Screen | Wired to |
| ----- | ------ | -------- |
| `/` | Landing | — |
| `/login` | Sign in | **Passwordless** — Google OAuth + email magic link |
| `/dashboard` | Home | Your reputation + your own deals (per-user) |
| `/new-escrow` | Create a deal | `createDeal` — Trust Score runs if a chat is pasted (optional) |
| `/fund` | Payment | Trust/scam banner + seller standing + **risk-acknowledgement gate** |
| `/timeline` | Deal progress | The deal's real item, amount, seller, status |
| `/dispute` | Dispute | The **AI dispute judge**'s real ruling |
| `/locked`, `/released`, `/delivery-code`, `/receipt`, … | Rest of the flow | Rendered from the design |

Every screen is the **exact Figma design** rendered as a live page by a small engine
(`app/_lib/screen-html.tsx`), so the visuals stay pixel-identical while the buttons, inputs and
data are real.

### The three AI features (H2O)

Live as API routes, powered by **Claude**. Each one calls the model when `ANTHROPIC_API_KEY` is
set and falls back to a deterministic offline heuristic (`mock` / `mock-fallback`) so the app
**always works on stage with no key**.

- **Trust Score** — a 0–100 pre-deal risk score from the chat + seller history.
- **Scam detector** — flags specific scam tactics in a message/chat.
- **Dispute judge** — weighs both sides and decides: release, refund, or split.

Accuracy is measured — `npm run eval:ai` runs 21 labelled cases (see [`lib/ai/eval`](lib/ai/eval)).

### Reputation & seller standing (H2O)

- **Trader reputation** (`lib/reputation`) — a real, per-user standing derived from your own deal
  history. Deterministic and **fully explainable**: every point is tied to a factor (completed
  deals, value transacted, on-time confirmations, tenure, dispute rate) and the factors sum to the
  score. Claude writes a one-line summary; the number is always the engine's.
- **Seller standing** (`lib/seller`) — when a buyer enters a seller's phone/email, TrustFlow scores
  the seller from past TrustFlow deals (matched by a normalised contact), shown before payment.

## Team

This is **one Next.js app** the whole team shares:

| Person | Role | Owns | Status |
| ------ | ---- | ---- | ------ |
| **Jerry** | Back end (lead) | ALAT escrow & payments, database, KYC/anti-fraud | Rails written; **integrated** with a live/mock seam |
| **H2O** | Back end | AI (Trust Score, scam, dispute), deals, auth, reputation | ✅ built |
| **Deji** | Front end | Every screen people see (`app/`) | ✅ designs in |

### ALAT payments (Jerry's rails, integrated)

The money-moves — **collect → hold → payout / refund** — are wired through the deal lifecycle
(`lib/payments/`, `lib/deals/store.ts`) with the **same live/mock seam** as everything else: real
ALAT calls when the keys are set, simulated otherwise, so the full escrow flow demos with no bank
access. ALATPay (collection) and the ALAT Wallet (payout) go live independently.

- **Collect (fund escrow)** → **ALATPay** — `POST /api/escrow` + `POST /api/webhooks/alatpay` (verify + re-query)
- **Payout (release / refund)** → **ALAT Wallet** — `releaseWithCode` / auto-release / dispute rulings, and `POST /api/payout`, `POST /api/refund`
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
ANTHROPIC_API_KEY=              # AI → Claude (else mock-fallback)
NEXT_PUBLIC_SUPABASE_URL=       # auth + deals persistence
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only — never commit / never in chat
```

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**, deployed on **Vercel**
- **Claude** (`claude-opus-5`) for all three AI features + reputation summaries
- **Supabase** — passwordless auth (Google + magic link) and Postgres (`deals`, `reputations`)
- **ALAT APIs** — escrow collection + payouts *(Jerry, in progress)*

Every backend layer has the same **live / demo seam**: real service when its keys are present,
a deterministic stand-in when they aren't, so the app is never blocked on a backend.

## Project structure

```
app/
├── page.tsx              # Landing
├── login/                # Passwordless sign-in (Google + magic link)
├── dashboard/            # Reputation + your deals
├── new-escrow/           # Create a deal
├── fund/                 # Payment: trust banner + seller standing + risk gate
├── timeline/ dispute/ …  # The rest of the flow
├── _lib/screen-html.tsx  # renders a Figma design as a live, wired page
├── _screens/             # the design markup for each screen
└── api/
    ├── trust-score/  scam-check/  dispute/   # the 3 AI features (H2O)
    ├── deals/  deals/[id]/(ship|release|dispute)/  auto-release/
    ├── escrow/  webhooks/alatpay/  payout/  refund/  receipt/[id]/  # ALAT rails (Jerry)
    ├── reputation/       # per-user trader reputation (H2O)
    ├── seller-standing/  # seller lookup for the payment screen (H2O)
    ├── ai-health/        # AI layer status
    └── auth/callback/    # OAuth + magic-link return
lib/
├── ai/          # Claude client, prompts, mock, 3 features, eval  (H2O)
├── auth/         # passwordless Supabase auth + demo mode          (H2O)
├── deals/        # escrow model + store (Supabase + seeded demo)   (H2O)
├── payments/     # ALAT collect/payout/refund + live/mock seam     (Jerry)
├── reputation/   # the trader reputation model                     (H2O)
├── seller/       # seller-standing model                           (H2O)
└── client/       # typed browser API for the screens
middleware.ts     # refreshes the auth session cookie
docs/             # design prototype + master plan + deploy notes
```

Each backend area has its own README: [`lib/ai`](lib/ai/README.md) ·
[`lib/auth`](lib/auth/README.md) · [`lib/deals`](lib/deals/README.md) ·
[`lib/reputation`](lib/reputation/README.md). The wiring map of every screen → backend call is in
[`docs/wiring-map.md`](docs/wiring-map.md).
