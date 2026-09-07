# Ledger — Zafe's own record of the money

The payment provider (ALAT / Paystack / Flutterwave) is the source of truth for
whether cash actually moved. This ledger is Zafe's **independent** double-entry
record of every move, so the books reconcile without asking the provider: what
is held in escrow, what was paid out, what was refunded, and what Zafe earned.

## The model (small on purpose)

Every entry is a set of signed **legs** whose amounts **sum to zero** (whole
Naira). A leg's amount is added to that account's running balance, so a positive
leg is cash going up and a negative leg is it going down (or a liability we owe).
Because every entry nets to zero, the sum of all account balances is always zero.
That identity is what makes the books provable (`trialBalance()`).

The chart of accounts (`types.ts`):

| Account | Meaning |
| ------- | ------- |
| `escrow` | Cash Zafe holds in the provider pool. Up on funding, down on payout/refund. |
| `buyer_funds` | What Zafe owes back out of held funds (a liability; negative while held, back to zero once settled). |
| `revenue` | Fees Zafe has earned (a credit balance, carried negative). |

A full lifecycle: **fund ₦N** posts `escrow +N`, `buyer_funds −N`; **payout**
posts `escrow −cashOut`, `buyer_funds +gross`, `revenue −fee`; **refund** posts
`escrow −N`, `buyer_funds +N`. After settlement `buyer_funds` is back to zero and
`escrow` holds only the retained fee. There is no fee model yet, so `fee`
defaults to 0 and `revenue` stays flat — the leg is there for when one lands.

## Where it posts

Best-effort, at the real money-moves, keyed by a deterministic `ref` so a retry
is a no-op:

| Move | Where | Entry (`ref`) |
| ---- | ----- | ------------- |
| Escrow funded | `setDealStatus(id,"funded")` (all providers) | `fund:<dealId>` |
| Seller paid | `payoutSeller` on success | `payout:<dealId>` |
| Buyer refunded | `refundBuyer` on success | `refund:<dealId>` |

Recording goes through `recordSafe`, which **never throws**: the provider is the
source of truth for the transfer, so a failed ledger write is logged and
swallowed rather than failing a payout or refund. A missed entry is recoverable
(the deal row still carries the amounts) and a retry re-posts under the same ref.

## Live vs. mock

Same seam as the rest of the backend. With Supabase set it writes the
`ledger_entries` table (`schema.sql`, PK on `ref` for idempotency); with no
Supabase it uses an in-memory list, so the flow and reconciliation work on stage
with no database.

## Checking it

`npm run check:ledger` exercises the builders, the balance invariant,
idempotency, and full-lifecycle reconciliation (no live keys, no network).
