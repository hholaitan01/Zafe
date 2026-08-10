# AI accuracy harness (H2O — Day-6 "count the mistakes")

A labelled test set + runner that scores Zafe's three AI features, so we
**know the number before a judge asks** and can watch it improve as we tune.

```bash
npm run eval:ai
```

- **No `ANTHROPIC_API_KEY`** → scores the **offline heuristic** (a deterministic baseline)
- **Key + credits** → scores **real Claude** (same command, no changes)

## What it checks

| Feature | Cases | Metric |
| --- | --- | --- |
| Scam detector | 12 (7 scams, 5 clean) | Is it a scam? — exact match |
| Trust Score | 5 | Verdict band (safe / caution / risky) |
| Dispute judge | 4 | Decision (release / refund / split) |

Add cases in `cases.ts`; the runner prints per-feature results, the failing
cases (with what it got vs. expected), and an overall mistake count. It exits
non-zero if anything fails, so it can double as a CI gate.

## Current baseline (offline heuristic, no credits)

**20 / 21 correct (95%) — 1 mistake.** Scam detector 12/12, dispute judge 4/4,
Trust Score 4/5. The one miss (`mixed-history`) is a deliberately borderline
seller — verified, with a clean chat but two past disputes and a 3.8★ rating —
which the keyword/points heuristic scores "safe" and the labels call "caution."
That's exactly the nuanced judgment the **real Claude** model handles better;
re-run with credits to see the AI close that gap.

> The heuristic is only the stage-safe fallback. The number that matters at the
> pitch is the live-Claude run — this harness produces it on demand.
