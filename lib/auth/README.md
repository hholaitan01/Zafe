# Auth (H2O)

Sign-in for the Login screen, using **Supabase** — **passwordless**. Two ways
in, no passwords to phish, leak, or brute force:

- **Continue with Google** (OAuth), and
- a **one-time email login link** (Supabase magic link): type your email, we
  send a link, tapping it signs you in.

Includes a **demo-mode fallback** so the flow works on stage before Supabase
keys land.

## Two modes

- **Live** — set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (see `.env.example`). Real Supabase auth: Google OAuth + email magic links,
  cookie-based sessions refreshed by `middleware.ts`.
- **Demo** — no keys set. A lightweight local session stands in: "Continue with
  Google" and the email link both carry a user straight through to the
  dashboard (there's no mail server in demo, so the email path signs in
  directly). Not real auth — it vanishes the moment real keys are added.

## The API (`lib/auth`)

```ts
import { signInWithGoogle, sendMagicLink, getCurrentUser, signOut } from "@/lib/auth";

await signInWithGoogle();   // → { redirectUrl } in live mode; navigate to it
await sendMagicLink(email); // → { magicLinkSent: true }; tell the user to check their inbox
await getCurrentUser();     // → TrustUser | null
await signOut();
```

Every call returns `{ ok, mode, user?, error?, redirectUrl?, magicLinkSent? }`.
The Login screen (`app/login/page.tsx`) already calls these and shows loading /
error / "check your inbox" states.

## How the link signs you in

`sendMagicLink` calls `signInWithOtp({ email, options: { emailRedirectTo:
"<origin>/auth/callback" } })`. The emailed link goes through Supabase, which
redirects to `/auth/callback?code=…`; that route exchanges the code for a
session cookie — **the same callback OAuth uses**. Links are single-use and
short-lived, and must be opened on the device that requested them (PKCE).

## Files

```
lib/auth/
├── config.ts    # reads the public env, authConfigured()
├── browser.ts   # Supabase browser client (null in demo mode)
├── server.ts    # reads the signed-in user from the session cookie (server-only)
├── index.ts     # sendMagicLink / signInWithGoogle / getCurrentUser / signOut
├── demo.ts      # local demo-session store
└── types.ts     # TrustUser, AuthResult
app/auth/callback/route.ts  # code → session, then → /dashboard (OAuth + magic link)
middleware.ts               # refreshes the session cookie (no-op in demo mode)
```

## Going live (Jerry)

1. Create a Supabase project; copy the URL + anon key into `.env.local`.
2. In Supabase → Auth → Providers, enable **Google** and add the OAuth client.
3. In Supabase → Auth → Providers → **Email**, keep it enabled (magic links are
   on by default). No SMTP setup is needed for the built-in email in testing.
4. Add the redirect URL `https://<your-app>/auth/callback` (and the localhost
   one) under Auth → URL Configuration, and set the **Site URL**.

No app code changes needed — the same screen switches from demo to live purely
on the presence of the env vars.
