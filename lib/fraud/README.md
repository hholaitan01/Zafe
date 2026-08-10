# Fraud watchlist (H2O, from Jerry's anti-fraud design)

The one anti-fraud signal that neither the AI Trust Score nor the reputation
model had — adopted from Jerry's `isFlaggedPattern`. A **hard override** on a
deal's Trust Score: a watchlisted seller is forced to **risky** even when the
chat looks clean, so the buyer is warned and must acknowledge the risk before
paying.

## How a seller gets flagged

1. **Seed list** (`blocklist.ts`) — contacts reported for fraud, matched by a
   normalised phone/email so formatting doesn't matter. In production this is a
   shared bank / platform fraud feed; here a small curated seed.
2. **Derived from Zafe's own history** (computed in `lib/deals/store.ts`,
   next to the deal data) — a seller with a **dispute resolved against them**
   (`refund_buyer` / `split`), or **≥2 disputes** on record, is auto-flagged.
   Self-reinforcing: bad outcomes make the next buyer's warning stronger.

## Where it plugs in

`createDeal` (`lib/deals/store.ts`) assesses every deal by blending three
things — the AI read of the chat, the seller's history, and this watchlist:

- flagged → `trust = { verdict: "risky", score ≤ 12, headline: "⚠ … fraud watchlist …" }`
- not flagged, no chat, but past disputes → `caution`
- otherwise → the AI chat score (or none)

Because it produces a verdict **without needing a chat**, a watchlisted seller
trips the red banner + risk-acknowledgement gate on the payment screen on its
own.

> Not wired to the payout gate — a flag warns the *buyer*; blocking a seller's
> payout is a separate call (Jerry's `bvn_nin_verified` verification path).
