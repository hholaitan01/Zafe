# Reputation — per-user trader standing (H2O)

A **real, per-user reputation model**: a trader's accumulated standing across
every escrow they've run on TrustFlow. Settle deals cleanly and it rises; rack
up disputes and it falls.

> This is **not** the per-deal **Trust Score** (that scores a *counterparty*
> from one chat). Reputation is *your own* standing, derived from *your* deal
> history — and it's what personalises the Dashboard hero.

## The model (`engine.ts`)

Deterministic and **fully attributable** — every point is tied to a factor, and
the factors sum to the score, so a trader's standing can be shown to a
counterparty and defended. No AI in the number.

| Factor | Weight |
| ------ | ------ |
| Starting standing | **+60** (everyone starts here) |
| Completed deals | +6 each, capped **+30** |
| Value transacted | +3 per ₦250k settled, capped **+12** |
| On-time confirmations | up to **+6** (buyer confirmed, not auto-released) |
| Account tenure | +1 / month, capped **+6** |
| Dispute rate | up to **−40** (share of deals that went to dispute) |
| Disputes lost | −8 each, capped **−24** (judged against them) |

Clamped to 0–100. A trader with no history sits at the 60 baseline but is
tiered **New trader** until they transact. Tiers: `new` → `building` (55) →
`trusted` (70) → `highly_trusted` (85).

## AI standing summary (`insight.ts`)

One warm, factual sentence summarising the standing. Same seam as the rest of
the AI layer: **Claude** phrases it when `ANTHROPIC_API_KEY` is set, otherwise a
deterministic heuristic sentence is used — so the Dashboard always has copy and
never blocks on a key. Claude only *narrates*; the engine owns the number.

## Route

| Route | Does |
| ----- | ---- |
| `GET /api/reputation` | The signed-in trader's reputation. Identity from the Supabase **session cookie** (live), or `?email=`/`?name=` (demo). |

```jsonc
{ "reputation": {
  "email": "…", "score": 64, "tier": "building", "tierLabel": "Building trust",
  "factors": [ { "label": "Starting standing", "detail": "…", "points": 60 }, … ],
  "stats":   { "total": 5, "completed": 1, "disputed": 1, "volume": 240000, … },
  "summary": "1 clean deal so far; resolving disputes fairly will lift your score."
} }
```

## Live vs. demo

Reputation is **derived** — the `deals` table is the single source of truth, so
it's always recomputed fresh on read (never stale). Deals are scoped per user
(`buyer_email`), so the number reflects *that* trader's history.

- **Live** — a snapshot is upserted to the `reputations` table (see
  `schema.sql`) for cheap read-back. Persistence is **best-effort**: if the
  table isn't there yet, the reputation is still computed and returned.
- **Demo** — no keys; computed from the in-memory seed history. The server has
  no session, so the Dashboard passes the local user's email.

## Going live (Jerry)

Run `schema.sql` in Supabase (alongside `deals/schema.sql`). Nothing else — the
app degrades gracefully if it's not there yet.
