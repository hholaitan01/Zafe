# Integration plan — merging Jerry's ALAT payment rails into the app

> **Status:** ✅ **Done on `claude/h2o-o24xwd`.** Jerry's ALAT rails are ported to
> `lib/payments/` (with a live/mock seam) and wired into the `deals` lifecycle;
> the routes (`/api/escrow`, `/api/webhooks/alatpay`, `/api/payout`,
> `/api/refund`, `/api/receipt/:id`) build and pass an end-to-end mock test.
> His OpenAI AI / Tailwind scaffold were **not** adopted (see below). What
> remains is the **`main` cleanup** — this branch is the clean tree to merge
> *from*; `main` still carries Jerry's duplicate scaffold to resolve at PR time.

**Goal:** get Jerry's ALAT payment/payout work and the existing app (AI, deals,
auth, reputation, wired screens) into **one clean, building tree** — without
losing anyone's work.

Jerry's payment code is good and we're keeping it. The problem is only *how* it
landed: it was scaffolded as a **separate Next.js app in its own git history and
merged into `main`**, which brought a second copy of everything (a different AI
provider, a different data model, Tailwind, a different `package.json`) and left
`main` in a non-building state. This plan unifies the two.

---

## The core decisions (one of each)

| Concern | Winner | Why |
| ------- | ------ | --- |
| **App / git history** | The existing app on `claude/h2o-o24xwd` | It's the current, building tree and drives the whole wired front-end. Jerry's files get **ported onto it**, not merged as a second root history. |
| **Data model** | **`deals`** (extended) | The AI, reputation, seller-standing, all `/api/deals/*` routes, and every wired screen already run on it. We add ALAT columns rather than rewire the app. |
| **AI** | H2O's **`lib/ai/`** (Claude) | The three features + eval already exist here. Jerry's `lib/ai.ts` (OpenAI) and `lib/trust-score.ts` are dropped. |
| **Toolchain** | Existing `package.json`, `globals.css`, `tsconfig`, README | Keeps the Claude SDK, Turbopack, `eval:ai`, and the design-screen styling. Jerry's Tailwind/OpenAI scaffold is not adopted. |

> Net: **keep Jerry's ALAT rails, drop his scaffold.**

---

## ✅ What we keep from Jerry (his real work)

Port these onto the current branch, adapted to talk to `deals` (see wiring below):

| File | Keep as | Notes |
| ---- | ------- | ----- |
| `lib/alatpay.ts` | `lib/payments/alatpay.ts` | Virtual-account collection, status re-query. Solid. |
| `lib/alat-wallet.ts` | `lib/payments/wallet.ts` | Merchant payout / transfer helpers. |
| `lib/receipt.ts` | `lib/payments/receipt.ts` | Receipt generation. |
| `app/api/escrow/route.ts` | same path | Generates the buyer's collection account. |
| `app/api/webhooks/alatpay/route.ts` | same path | The "money truly landed" verify → mark funded. |
| `app/api/payout/route.ts` | same path | Release to seller. |
| `app/api/refund/route.ts` | same path | Refund / partial refund to buyer. |
| `app/api/receipt/[transactionId]/route.ts` | same path | Receipt read. |

His `supabase/schema.sql` is a useful reference for the payment columns (below),
but we don't adopt the whole `transactions`/`users` schema.

## ❌ What we drop (do **not** merge)

| Dropped | Reason |
| ------- | ------ |
| `lib/ai.ts` (OpenAI) | Duplicates H2O's Claude scam/Trust Score in `lib/ai/`. We're Claude, not OpenAI. |
| `lib/trust-score.ts` | Its weighted seller score overlaps H2O's **reputation model** (`lib/reputation/`). Fold any wanted signal into reputation instead of a third score. |
| `lib/supabase.ts` | Duplicates `lib/auth/browser.ts`, `lib/auth/server.ts`, `lib/deals/config.ts`. Reuse those; expose one service-role admin helper if needed. |
| `tailwind.config.ts`, `postcss.config.js`, his `globals.css` | Screens are inline-styled design markup; adopting Tailwind would break them. Keep our `globals.css`. |
| his `package.json`, `next.config.js`, his `README.md`, `page.tsx`, `layout.tsx` | Keep ours (Claude SDK, Turbopack, `eval:ai`, design styling, current README). |
| the stray `TrustSolve` gitlink + second root history | Repo hygiene — see below. |
| `openai`, `lucide-react`, `clsx`, `tailwind-merge` deps | Not used by the design screens. |

---

## Data model: extend `deals`, don't fork it

Keep the `deals` table. Add the ALAT-specific columns Jerry's `transactions`
table has (this is a small `alter table`, script it in `lib/deals/schema.sql`):

```sql
alter table public.deals
  add column if not exists alat_virtual_account   text,        -- buyer's one-time collection account
  add column if not exists alat_account_expires_at timestamptz, -- our tighter ~10-min window
  add column if not exists alat_transaction_id     text,        -- ALATPay id, for status re-query
  add column if not exists payout_ref              text,        -- Merchant Payout reference
  add column if not exists partial_refund_amount   numeric,     -- for split rulings
  add column if not exists seller_payout           jsonb;       -- { bank_code, account_number, account_name, verified }
```

- **Seller bank/KYC for payout:** Jerry's `users.bvn_nin_verified` + bank fields
  are needed to *pay* a seller. For now we collect the seller's payout
  details at release time and store them in `deals.seller_payout` (a jsonb) —
  no separate `users`/KYC table needed. (If a full `users` table is wanted
  later, that's a follow-up call.)
- We already have `handover_code`, `auto_release_at`, `dispute`, `trust`,
  `timeline`, `reference` — these cover his `release_method`, `tracking_number`,
  `disputes`, `trust_score`/`risk_*`, and `transaction_ref`.

### Status mapping (his enum → our `DealStatus`)

| Jerry's `transactions.status` | Our `deals.status` |
| ----------------------------- | ------------------ |
| `PENDING_PAYMENT` | `created` |
| `FUNDED` | `funded` |
| `SHIPPED` | `shipped` |
| `DELIVERED` | `shipped` + a `timeline` "delivered" event |
| `CONFIRMED` / `RELEASED` | `completed` |
| `DISPUTED` | `disputed` |
| `REFUNDED` | `refunded` |
| `PARTIALLY_REFUNDED` | `resolved` (split) |

---

## Wiring: how each ALAT call plugs into the deal lifecycle

The app already has these lifecycle functions in `lib/deals/store.ts`
(`createDeal`, `shipDeal`, `releaseWithCode`, `runAutoReleases`,
`openAndJudgeDispute`) and they're what the screens call. Jerry's routes should
go **through the store**, not raw SQL, so status/timeline stay consistent.

1. **Fund → collect.** On the payment screen, "Pay" calls `POST /api/escrow`
   (Jerry's `generateVirtualAccount`). Store the account + expiry on the deal
   (new `setCollectionAccount(dealId, …)` store method). Show the account/USSD to
   the buyer.
2. **Money lands → funded.** `POST /api/webhooks/alatpay` verifies (callback +
   re-query, as Jerry built) and then calls **`setDealStatus(dealId, "funded")`**
   instead of updating a `transactions` row. *(The Trust Score already ran at
   deal creation and is shown before payment, so the webhook doesn't need to
   re-run it.)*
3. **Release → payout.** `releaseWithCode` (handover code) and `runAutoReleases`
   (timer) call **`POST /api/payout`** (Jerry's Merchant Payout) to the seller's
   `seller_payout` account, store `payout_ref`, then mark `completed`.
4. **Dispute → refund/split.** `openAndJudgeDispute` maps the AI ruling to money:
   `refund_buyer` → `POST /api/refund` (full), `split` →
   refund `partial_refund_amount` → `resolved`, `release_to_seller` → payout as in (3).
5. **Receipt.** `GET /api/receipt/[id]` reads the deal; the `/receipt` screen renders it.

H2O adds the thin store methods (`setCollectionAccount`, `recordPayout`,
`recordRefund`); Jerry's routes call those instead of `supabase.from("transactions")`.

---

## Toolchain & env reconciliation

- **Keep our `package.json`.** Add nothing from his scaffold except what the ALAT
  fetch calls need (they use `fetch` — so likely **no new deps**). Do **not** add
  `openai`.
- **Keep our `globals.css`** (the design styling). Discard the Tailwind version.
- **Env vars** — final set:
  ```
  ANTHROPIC_API_KEY=            # AI (keep — not OpenAI)
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=    # server-only
  ALATPAY_API_KEY=              # ALATPay collection (Ocp-Apim-Subscription-Key)
  ALATPAY_BUSINESS_ID=
  ALAT_PAYOUT_API_KEY=          # Merchant Payout (Wema portal)
  ```
  Drop `OPENAI_API_KEY`.

---

## Repo hygiene

- **Do not merge Jerry's `main` as-is.** It has two unrelated root histories and
  won't build.
- Work on a fresh branch off the **current** `claude/h2o-o24xwd` (it has the
  newest work: reputation, seller standing, passwordless auth — none of which is
  on `main` yet).
- **Copy** Jerry's kept files onto that branch (plain file copy / cherry-pick the
  blobs), adapt them per the wiring above.
- **Remove the stray `TrustSolve` submodule gitlink** (`git rm --cached TrustSolve`).
- Result: one linear history, one PR to `main`.

---

## Division of labour & suggested order

1. **H2O** — extend `deals` schema + add the thin store methods
   (`setCollectionAccount`, `recordPayout`, `recordRefund`), on a new branch off
   the current one. *(Small.)*
2. **Jerry** — move his ALAT lib + routes onto that branch under `lib/payments/`,
   swap every `supabase.from("transactions")` call for the store methods, delete
   `lib/ai.ts` / `lib/trust-score.ts` / `lib/supabase.ts`.
3. **Together** — reconcile `package.json` + env, remove the stray gitlink, run
   `npm run build` + `npm run eval:ai`, then test the money path against the
   ALAT sandbox.
4. Open **one** clean PR to `main`.

The screens don't change — they already show the amount, the trust/scam banner,
the seller standing, and the risk gate. Jerry's job is to make the money real
behind those exact steps; ours is to hand him clean store methods to call.

*(Companion doc: [`docs/payments-alat.md`](payments-alat.md) — which ALAT API maps to each step.)*
