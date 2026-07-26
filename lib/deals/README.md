# Deals — escrow data layer (H2O)

Create-a-deal + save-it, plus list / read / advance. A deal is the whole life
of one escrow transaction, and it carries its own **Trust Score** (computed at
creation from the pasted chat). Same live/demo seam as the rest of the backend.

## Routes

| Route | Does |
| ----- | ---- |
| `GET /api/deals` | List all deals (newest first); also runs the auto-release sweep |
| `POST /api/deals` | Create a deal; stores amount, item, seller, chat — and runs the Trust Score |
| `GET /api/deals/:id` | One deal |
| `PATCH /api/deals/:id` | Simple status move: `{ status, note? }` (e.g. fund, refund) |
| `POST /api/deals/:id/ship` | Seller ships → mints the buyer's **handover code** + starts the **auto-release timer** |
| `POST /api/deals/:id/release` | Buyer confirms with `{ code }` → seller is paid (wrong code is rejected) |
| `POST /api/deals/:id/dispute` | Open dispute with both sides' evidence → **AI judge decides** → money moves |
| `POST /api/deals/auto-release` | Release any deals whose timer ran out (cron-friendly) |

## Lifecycle & anti-cheat

```
created → funded → shipped → completed          (happy path)
                     │           ▲
                     │           └─ buyer enters the handover code, OR the
                     │              auto-release timer fires (buyer went silent)
                     └─ disputed → completed | refunded | resolved (AI judge)
```

- **Handover code** — minted on `ship`, held by the buyer. The seller is only
  paid once it's used, so the buyer can't claim "it never arrived" after their
  own code released the money.
- **Auto-release timer** — set on `ship` (`AUTO_RELEASE_DAYS`, default 3). If the
  buyer neither confirms nor disputes, the money releases to the seller so it
  can't be frozen forever. Runs on the sweep (listing deals or the cron route).
- **Dispute** — `POST …/dispute` opens it, hands both sides to the AI dispute
  judge, applies the ruling (release → `completed`, refund → `refunded`,
  split → `resolved`), and records `dispute.resolution` on the deal.

## Live vs. demo

- **Live** — set `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
  Deals persist to the Supabase `deals` table (see `schema.sql`).
- **Demo** — no keys. An in-memory store **seeded with believable deals**
  (a couple finished, one live/funded, one in dispute, one risky brand-new)
  so the Dashboard and Trust Score screens have real data with no database.

## Deal shape

```jsonc
{
  "id": "…", "reference": "TF-7QH2",
  "item":   { "title": "iPhone 13", "amount": 240000, "currency": "NGN" },
  "seller": { "name": "Ada Electronics", "verified": true, "completedDeals": 42, … },
  "chat":   "Buyer: … Seller: …",
  "status": "funded",              // created → funded → shipped → completed | disputed | refunded
  "trust":  { "score": 87, "verdict": "safe", "headline": "…" },
  "timeline": [ { "at": "…", "status": "funded", "label": "Money held in escrow" } ],
  "createdAt": "…", "updatedAt": "…"
}
```

## Create a deal

```bash
curl -s localhost:3000/api/deals -H 'content-type: application/json' -d '{
  "item":   { "title": "iPhone 13", "amount": 240000, "currency": "NGN" },
  "seller": { "name": "Ada Electronics", "verified": true, "completedDeals": 42, "disputes": 0, "accountAgeDays": 420, "rating": 4.9 },
  "chat":   "Seller: happy to use TrustFlow escrow, here are extra photos and the serial."
}'
# → { "deal": { …, "trust": { "score": …, "verdict": "safe" } } }
```

## For the front end (Deji)

- **Dashboard** — `GET /api/deals`, render each deal's `reference`, `item`,
  `status`, and `trust.score`.
- **New Escrow** — `POST /api/deals` with the item + seller + pasted chat; the
  response's `deal.trust` is what the Trust Score screen shows.
- **Code screen** — after `POST …/ship`, show `deal.handoverCode` to the buyer
  and count down to `deal.autoReleaseAt`. `POST …/release { code }` on confirm.
- **Dispute screen** — `POST …/dispute` with both sides; render
  `deal.dispute.resolution` (`decision`, `rationale`, `splitBuyerPercent`).
- **Timeline** — every action appends to `deal.timeline`.

```bash
# Ship → get the handover code → release with it
curl -sX POST localhost:3000/api/deals/<id>/ship
curl -sX POST localhost:3000/api/deals/<id>/release -H 'content-type: application/json' -d '{"code":"729145"}'

# Full dispute in one call
curl -sX POST localhost:3000/api/deals/<id>/dispute -H 'content-type: application/json' -d '{
  "buyer":  { "claim": "Box arrived empty", "evidence": ["unboxing video shows no console"] },
  "seller": { "claim": "I shipped it sealed", "evidence": [] }
}'
```

## Going live (Jerry)

Run `schema.sql` in Supabase, then set `SUPABASE_SERVICE_ROLE_KEY` (server-only)
alongside the URL. The store switches from demo to the table with no code change.
