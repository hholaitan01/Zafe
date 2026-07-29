# Screen ↔ backend wiring map

How each screen Deji builds connects to the backend. **Deji builds the screens;
each backend owner wires their own engine into them** (H2O = AI, auth, deals;
Jerry = ALAT payments, payouts, ID verification).

All the client calls are typed and ready in **`@/lib/client`** (deals + AI) and
**`@/lib/auth`** (sign-in). Wiring a screen is usually one call.

> Built from the master plan's screen list — the Figma file wasn't accessible
> to read frames directly. Node names may differ slightly; the flow is the same.

| # | Screen | Wires | Call | Endpoint |
|---|--------|-------|------|----------|
| 1 | Landing / Get Started | — | (navigation only) | — |
| 2 | **Login / Sign up** | H2O ✅ | `signInWithGoogle()`, `signInWithApple()` (primary), `signInOrUp()` (email) | Supabase auth |
| 3 | **Dashboard / Home** | H2O | `listDeals()` | `GET /api/deals` |
| 4 | **New Escrow** | H2O | `createDeal({item, seller, chat})` → `deal.trust` | `POST /api/deals` |
| 5 | **Trust Score** (safe + risky) | H2O | `deal.trust`, or `getTrustScore()` for a standalone check | `POST /api/trust-score` |
| 6 | Fund Escrow / expiring account | **Jerry** (ALATPay) · H2O marks funded | `setDealStatus(id,"funded")` | `PATCH /api/deals/:id` |
| 7 | **Timeline** | H2O | `getDeal(id)` → `deal.timeline` | `GET /api/deals/:id` |
| 8 | **Code / handover** | H2O | `shipDeal(id)` → `deal.handoverCode`; `releaseDeal(id, code)` | `POST …/ship`, `POST …/release` |
| 9 | Proof (unboxing camera) | Deji (camera) · H2O consumes as dispute evidence | (evidence → `disputeDeal`) | — |
| 10 | Confirm received → pay seller | H2O releases · **Jerry** pays out | `releaseDeal(id, code)` | `POST …/release` |
| 11 | **Dispute** | H2O | `disputeDeal(id, {buyer, seller})` → `resolution` | `POST …/dispute` |
| 12 | Receipt | H2O (data) · Jerry (payout ref) | `getDeal(id)` | `GET /api/deals/:id` |
| 13 | Profile | H2O (user) · Jerry (payout account) | `getCurrentUser()` | Supabase auth |
| 14 | Seller sign-up + ID check | **Jerry** (BVN/NIN) · H2O (account) | — | — |
| 15 | Scam warning | H2O | `checkScam({text})`, or `deal.trust.verdict === "risky"` | `POST /api/scam-check` |

## H2O's screens to wire (once Deji pushes them)

3 Dashboard · 4 New Escrow · 5 Trust Score · 7 Timeline · 8 Code · 11 Dispute ·
15 Scam warning — plus 2 Login (done). Each is a single `@/lib/client` call.

### Example — New Escrow → Trust Score (the judges' key flow)

```tsx
"use client";
import { createDeal } from "@/lib/client";

const deal = await createDeal({
  item: { title, amount, currency: "NGN" },
  seller: { name, verified, completedDeals, disputes, accountAgeDays, rating },
  chat, // the pasted conversation
});
// deal.trust = { score, verdict: "safe"|"caution"|"risky", headline }
// → route to the green "safe" or red "risky" Trust Score screen off deal.trust.verdict
```

### Example — Code screen (handover + auto-release)

```tsx
import { shipDeal, releaseDeal } from "@/lib/client";

const shipped = await shipDeal(id);      // shipped.handoverCode, shipped.autoReleaseAt
const done = await releaseDeal(id, code); // wrong code throws ApiError; right code → completed
```

### Example — Dispute screen

```tsx
import { disputeDeal } from "@/lib/client";

const { deal, resolution } = await disputeDeal(id, {
  buyer:  { claim, evidence },
  seller: { claim, evidence },
});
// resolution.decision: "release_to_seller" | "refund_buyer" | "split"
// resolution.rationale, resolution.splitBuyerPercent
```

## Status

Every endpoint above is live and tested (demo mode today; flips to real Claude +
Supabase when the keys land). The only thing missing is Deji's screens in the
repo — the moment they're pushed, wiring each is the one-liner shown here.
