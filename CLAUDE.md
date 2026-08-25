# Zafe — project memory

AI-powered escrow for peer-to-peer trades. Next.js 15 (App
Router) · React 19 · TypeScript · Supabase · deployed on Vercel.

**Visual language (redesign in progress):** moving to a premium light "trust
fintech" look — navy ink `#0F172A`, emerald `#059669` for the "money held safe"
story, gold `#A16207` sparingly, IBM Plex Sans, soft depth on a `#F8FAFC` canvas.
Reference: the landing page (`app/page.tsx`) + `docs/design-system.md` §v2. The
in-app screens are being torn down and rebuilt against this; until then they
still use the legacy dark/pink tokens.

## Architecture (how the app is wired)

- Screens are the Figma design markup rendered by **`app/_lib/screen-html.tsx`**
  (`ScreenHtml`). Wiring hooks: `data-nav` (navigate), `data-action` (call a
  handler), `data-field` (input, collected + prefilled), `data-bind` (text),
  `data-html` (inject a list), `data-photo` (avatar image), `data-money` (comma
  formatting), `data-requires="a,b"` (disable a button until those fields fill).
- Every backend area has a **live/demo seam**: real service when its keys are
  set, a deterministic stand-in otherwise. Never hard-block on a key.
  - `lib/ai` (Claude), `lib/auth` (Supabase, passwordless), `lib/deals`,
    `lib/reputation`, `lib/sellers`, `lib/profiles`, `lib/payments` (ALAT),
    `lib/fraud`. Client API in `lib/client`.
- Supabase tables: `deals`, `reputations`, `sellers`, `profiles` (RLS on, no
  policies → server uses the service-role key; the browser anon key sees
  nothing). SQL lives next to each lib (`lib/*/schema.sql`).
- Money-moves only reach `funded`/`completed`/`refunded` through verified/checked
  paths — never let a client set those directly (see `app/api/deals/[id]`).

## Design system — FOLLOW IT (docs/design-system.md)

Reference the tokens in `docs/design-system.md` for **every** spacing, color,
radius, weight, and animation value. Design system first; no one-off values.

### Avoid vibe-coded / AI patterns (apply consistently)

**Color & visual** — no generic/rainbow gradients (purple is brand only, as
`#E4144F → #7C3AED`, used sparingly). No sparkles or emojis in headings. No
generic glowing hover effects.

**Typography** — one weight hierarchy (800 headings / 700 buttons / 600 labels /
400 body); no oversized heading + ultra-thin body. Uniform line-height and
spacing. Stick to the type scale.

**Layout & components** — identical component placement across pages (back arrow
top-left, title beside it, full-width primary action). 2–3 border-radius values
max (see tokens). Subtle hover/press only (≤2–4px lift / `scale(0.98)`). Icons
sized proportionally to adjacent text. No non-functional social icons.

**Animation** — real easing (`cubic-bezier(.22,1,.36,1)`), intentional stagger,
every animation serves a purpose.

**UX behaviors** — loading states for all async actions, progress/label on
buttons ("Saving…"), functional toggles/interactions (nothing decorative that
doesn't work), skeleton/placeholder for data-heavy sections.

**Copywriting** — no em-dash overuse (prefer periods/colons). No vague hype
("launch faster", "build your dreams"). No fake testimonials. No generic AI
faces or placeholder names ("Sarah Chen").

**Breathing room — avoid congestion at all cost** — this is a hard rule, not a
preference. A screen should carry one message and let it breathe. Do not stack an
eyebrow, a headline, a long paragraph, a stat card, and a form all in one viewport.
Cut before you add: fewer elements, shorter copy, more whitespace. Every element
must earn its place; if it does not serve the screen's one job, remove it. Keep it
simple and brief, and make sure what remains clearly carries the message it exists
to pass on. When a screen feels full, the fix is subtraction, never smaller type or
tighter spacing.

**Core principle** — inconsistency signals vibe-coding more than any single
element. When adding UI, match an existing pattern rather than inventing one.

## Working agreements

- Develop on the designated feature branch; commit + push when work is complete.
- Keep secrets out of the repo (`.env.local` is git-ignored). Never put keys in
  chat or commits.
