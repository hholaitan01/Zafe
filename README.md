<div align="center">

# TrustFlow AI

### AI-powered escrow for peer-to-peer trades

**Buy and sell from strangers without getting scammed.** Money is held safe until the buyer
confirms, an AI flags scams before anyone ships, and an AI settles disputes — built on Wema's
own ALAT rails for **Wema Hackaholics 7.0**.

[🎨 **View the design in Figma**](https://www.figma.com/design/Us0oRlytOQwSacJoGawZQV/WEMA-BANK-HACKATOBN)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Track](https://img.shields.io/badge/Hackaholics%207.0-Hackathon-E4144F)

</div>

---

## The problem

If you buy something on WhatsApp or Instagram, you either pay first and pray the seller ships,
or the seller ships first and prays you pay. Somebody always risks getting cheated. **TrustFlow
removes that risk** by holding the money safely in the middle until both sides are happy.

## How it works

1. **Secure** — the buyer pays into a safe holding wallet (escrow). The seller sees the money is there and ships with confidence.
2. **Score** — an AI reads the chat and the seller's history and returns a **Trust Score (0–100)** that warns the buyer if it looks like a scam.
3. **Release** — when the buyer confirms they got the item, the held money is released to the seller instantly.
4. **Resolve** — if the two disagree, an **AI mediator** weighs the evidence and decides fairly: pay, refund, or split.

## Screens

| Route         | Screen                | Status |
| ------------- | --------------------- | ------ |
| `/`           | Landing / Get Started | ✅ built |
| `/login`      | Sign up / Log in      | ✅ built |
| `/dashboard`  | Home / Dashboard      | 🔜 next |

The Landing and Login screens are the real designs in working code — inputs accept typing, the
Show/Hide password toggle works, and every button navigates. The full 16-screen design lives in
the [Figma file](https://www.figma.com/design/Us0oRlytOQwSacJoGawZQV/WEMA-BANK-HACKATOBN).

## Team

This is **one Next.js app** the whole team shares:

| Person   | Role                | Owns |
| -------- | ------------------- | ---- |
| **Jerry** | Back end (team lead) | ALAT escrow & payments, database, anti-fraud |
| **H2O**   | Back end             | The AI — Trust Score, scam detection, dispute mediation |
| **Deji**  | Front end            | Every screen people see (`app/`) |

## Run it locally

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

## Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Supabase** — database + auth *(backend, in progress)*
- **ALAT APIs** — escrow wallet, collections, payouts *(backend, in progress)*
- Deploys on **Vercel**

## Project structure

```
app/
├── layout.tsx        # shared shell + metadata
├── globals.css       # reset, fonts, shared styles
├── page.tsx          # Landing / Get Started
├── login/page.tsx    # Sign up / Log in
├── dashboard/page.tsx# Dashboard (placeholder — built next)
└── api/              # backend routes
    ├── trust-score/  # AI Trust Score (H2O)
    ├── scam-check/   # AI scam detector (H2O)
    ├── dispute/      # AI dispute judge (H2O)
    ├── deals/        # create / list / advance escrow deals (H2O)
    ├── ai-health/    # AI layer status
    └── auth/callback/# OAuth return (H2O)
lib/ai/               # the AI backend — prompts, Claude client, demo mode (H2O)
lib/auth/             # email/Google sign-in — Supabase + demo mode (H2O)
lib/deals/            # escrow deal model + store (Supabase + seeded demo) (H2O)
middleware.ts         # refreshes the auth session cookie
docs/                 # the design prototype + master plan
```

The three AI features are live as API routes — see [`lib/ai/README.md`](lib/ai/README.md).
They call **Claude** when an `ANTHROPIC_API_KEY` is set, and fall back to a
deterministic offline "demo mode" so the app still works on stage with no key.

The Login screen is wired to real **Supabase** email/Google sign-in — see
[`lib/auth/README.md`](lib/auth/README.md). Same idea: it runs in demo mode
until the Supabase keys are set, so the flow is never blocked on the backend.

## Where the backend plugs in

Search the code for `// TODO (backend — Jerry/H2O)` — those comments mark the exact spots where
the real sign-in, escrow and payment calls connect. The screens are ready for them.
