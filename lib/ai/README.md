# TrustFlow AI backend (H2O)

The three AI features that power TrustFlow, as real API routes. Each one calls
**Claude** (`claude-opus-5` by default) using the official Anthropic SDK with
JSON-schema structured outputs — and falls back to a deterministic offline
heuristic so the app still demos on stage with no key and no network.

## The three features

| Feature | Route | What it does |
| ------- | ----- | ------------ |
| **Trust Score** | `POST /api/trust-score` | Reads a pasted chat + seller history → a 0–100 safety score with reasons and red flags |
| **Scam detector** | `POST /api/scam-check` | Scans a message/chat and flags the specific scam tactics inside it |
| **Dispute judge** | `POST /api/dispute` | Weighs both sides' evidence → release to seller, refund buyer, or split |
| _health_ | `GET /api/ai-health` | Reports the model and whether we're `live` or in `mock` (demo) mode |

## Live vs. demo mode

- **Live** — set `ANTHROPIC_API_KEY` (see `.env.example`). Real Claude calls.
- **Demo/mock** — no key set. Deterministic heuristics in `mock.ts` answer instead.
- **mock-fallback** — a live call was attempted but failed (network, rate limit,
  refusal); we quietly fall back to the heuristic so the demo never dies.

Every response includes a `"mode"` field (`"live"` / `"mock"` / `"mock-fallback"`)
so the UI — and the judges — can see exactly what answered.

## Layout

```
lib/ai/
├── client.ts       # Anthropic client + the runStructured() helper (the one seam)
├── prompts.ts      # the three system prompts (tune these without touching plumbing)
├── mock.ts         # offline heuristic engine (demo mode)
├── types.ts        # shared request/response types
├── http.ts         # tiny route helpers (json parse, errors)
├── trust-score.ts  # feature 1: live + mock + graceful fallback
├── scam-check.ts   # feature 2
└── dispute.ts      # feature 3
app/api/
├── trust-score/route.ts
├── scam-check/route.ts
├── dispute/route.ts
└── ai-health/route.ts
```

## Try it

```bash
# Trust Score
curl -s localhost:3000/api/trust-score -H 'content-type: application/json' -d '{
  "chat": "Seller: pay into my personal account first, then I ship. Trust me, last one left!",
  "seller": { "verified": false, "completedDeals": 0, "accountAgeDays": 2 },
  "item": { "title": "iPhone 13", "amount": 250000, "currency": "NGN" }
}'

# Scam detector
curl -s localhost:3000/api/scam-check -H 'content-type: application/json' -d '{
  "text": "Send a small clearance fee to release your item, then I refund you. Urgent!"
}'

# Dispute judge
curl -s localhost:3000/api/dispute -H 'content-type: application/json' -d '{
  "item": { "title": "PS5", "amount": 400000, "currency": "NGN" },
  "buyer":  { "claim": "Box arrived empty", "evidence": ["unboxing video shows no console"] },
  "seller": { "claim": "I shipped it sealed", "evidence": [] }
}'
```

## For the front end (Deji)

Every route takes JSON and returns JSON — no auth needed to call them from the
screens. `POST` the body shown above; render `score` / `verdict` / `reasons` on
the Trust Score screen, `tactics` on the scam warning, and `decision` /
`rationale` on the dispute screen. The `mode` field is safe to ignore in the UI.
