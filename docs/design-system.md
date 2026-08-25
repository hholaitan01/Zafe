# Zafe — design system

The single source of truth for spacing, color, radius, type, and motion. Every
new screen or component **references these tokens** — don't invent one-off
values. Inconsistency is the main tell of vibe-coded UI.

---

## v2 — "Trust fintech" language (active redesign)

The product is moving from the dark/pink look to a premium, light **trust
fintech** language (grounded in the ui-ux-pro-max fintech dataset). The landing
page (`app/page.tsx`) is the reference implementation. App screens are being
rebuilt against these tokens; the legacy dark tokens below still describe the
not-yet-migrated screens.

**Color (v2)**

| Token | Value | Use |
| ----- | ----- | --- |
| `ink` | `#0F172A` | primary text, primary buttons, the navy "trust" anchor |
| `ink-2` | `#334155` | secondary text |
| `muted` | `#64748B` | tertiary text, captions |
| `bg` | `#F8FAFC` | page background |
| `card` | `#FFFFFF` | cards / surfaces |
| `border` | `#E6EAF0` | hairline borders |
| `safe` | `#059669` | the one brand emerald: "money held safe", success, escrow, verified |
| `safe-2` | `#047857` | a darker shade of the same emerald, for depth / hover only |
| `safe-tint` | `#ECFDF5` | safe backgrounds, badges, icon wells |
| `blue` | `#1E3A8A` | secondary info accents |
| `gold` | `#A16207` | premium seal, used **sparingly** (one accent per view) |
| `danger` | `#DC2626` | risk / disputes / errors |

Emerald is a single hue. Use `#059669` (with `#047857` for depth); never pair it
with a brighter mint/teal green such as the old `#10B981` or `#34D399`. One green
only, no two-green mixes. On dark surfaces, prominent text and primary actions go
neutral (white/ink); emerald stays a sparing accent (marks, dots, focus rings).

Navy is the trust anchor; emerald carries the core "your money is safe"
message; gold is a rare premium accent. Primary CTAs are navy; the highest-intent
"safe" CTA (Get started) may be emerald.

**Type (v2):** IBM Plex Sans (400/500/600/700) — financial, trustworthy. Headings
600–700 with tight tracking (`-0.03em`); body 400 at 1.5–1.6 line-height. Tabular
figures for money and IDs.

**Depth (v2):** soft, layered shadows on a light canvas (no skeuomorphism / neumorphism).
`--shadow-sm` hairline lift, `--shadow` for cards, `--shadow-lg` for hero/CTA. Radius 11–24.

**Motion (v2):** same easing token `cubic-bezier(.22,1,.36,1)`; fade-up reveals
(opacity + ≤14px), ≤2px hover lift, all reduced-motion guarded.

---

## Legacy (dark) tokens — screens not yet migrated

## Color

| Token | Value | Use |
| ----- | ----- | --- |
| `brand` | `#E4144F` | primary actions, focus, active nav |
| `brand-2` | `#7C3AED` | the one brand gradient (`brand → brand-2`), sparingly |
| `safe` | `#34D07E` | success / low-risk / verified |
| `caution` | `#E0A23C` | caution / pending |
| `danger` | `#FF4D4D` | risky / disputes / errors |
| `bg` | `#0B0B0D` | app background |
| `surface` | `#141416` | cards |
| `surface-2` | `#17171A` | subtle buttons / chips |
| `input` | `#1A1A1D` | form fields |
| `line` | `#202024` / `#26262B` / `#33333A` | borders (card / control / outline) |
| `text` | `#FFFFFF` | primary text |
| `text-2` | `#9A9AA0` | secondary text, labels |
| `text-3` | `#6D6D74` | tertiary, placeholders |

Purple is brand here (it's in the logo gradient) — use it only as `brand → brand-2`,
never as a generic decorative gradient. No rainbow/AI gradients.

## Radius — pick from these only

| Token | Value | Use |
| ----- | ----- | --- |
| `r-control` | `12px` | inputs, small buttons |
| `r-btn` | `14–16px` | primary buttons, list rows |
| `r-card` | `18–20px` | cards |
| `r-hero` | `24px` | the one hero card |
| `r-pill` | `999px` | pills / chips |
| `r-device` | `42px` | the phone frame only |

## Spacing

- **Screen gutter: 22px** on both sides (every screen). Section gap **22px**.
- Card padding **16px**; inner gaps **10–14px**.
- Use these; avoid arbitrary 13/17/19px values.

## Type scale

| Role | Size / weight |
| ---- | ------------- |
| Display (score) | 52 / 800 |
| H1 (landing) | 30 / 800 |
| H2 (screen title) | 20 / 800 |
| Card title | 16–17 / 700 |
| Body | 15 / 400–600 |
| Label / caption | 12–13 / 600, `text-2` |
| Micro | 11–12 |

Weights: **800** headings, **700** buttons/titles, **600** labels, **400** body.
No ultra-thin body under oversized headings. Body line-height **1.4–1.6**.

## Icons

- SVG, stroke `1.8–2.2`. Header icons ~**18–22px**, inline ~**14–16px** — sized
  relative to adjacent text.
- Emoji only as **item-category chips** (📱 💻 🎧) — never in headings or as UI
  affordances. No decorative sparkles. No non-functional social icons.

## Motion

- Easing: **`cubic-bezier(.22, 1, .36, 1)`** (standard ease-out). Use it everywhere.
- Durations: micro/hover **150ms**, screen transition **~340ms**, score dial **1.5s**.
- Press feedback: **`scale(0.98)`** + slight brightness. **No large glow hovers**;
  the pink shadow on primary buttons is the only glow, and it's static (brand), not a hover effect.
- Every animation must serve a purpose (state change, arrival, progress).

## Component conventions

- Same element in the same place across screens: back arrow **top-left**, screen
  title beside it, primary action as a full-width `r-btn` button.
- Async actions show a state: buttons go **"Saving…" / "Please wait…"**, lists
  show a **loading placeholder**, forms **disable their submit until valid**.
- Copy: plain and specific. Avoid em-dash overuse (prefer periods / colons),
  and avoid vague hype ("build your dreams", "launch faster"). No fake
  testimonials, no placeholder names like "Sarah Chen".
