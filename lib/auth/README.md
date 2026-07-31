# Auth (H2O)

Sign-in for the Login screen, using **Supabase** — **Google and Apple OAuth as
the primary path**, with email/password kept as a secondary option behind a
toggle. Includes a **demo-mode fallback** so the flow works on stage before
Supabase keys land.

## Two modes

- **Live** — set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (see `.env.example`). Real Supabase auth: email/password and Google OAuth,
  cookie-based sessions refreshed by `middleware.ts`.
- **Demo** — no keys set. A lightweight local session stands in so "Continue"
  and "Continue with Google" carry a user through to the dashboard. Not real
  auth — it vanishes the moment real keys are added.

## The API (`lib/auth`)

```ts
import { signInWithGoogle, signInWithApple, signInOrUp, getCurrentUser, signOut } from "@/lib/auth";

await signInWithGoogle();          // primary — → { redirectUrl } in live mode; navigate to it
await signInWithApple();           // primary — same shape
await signInOrUp(email, password); // secondary — signs in, or creates the account if new
await getCurrentUser();            // → TrustUser | null
await signOut();
```

Every call returns `{ ok, mode, user?, error?, redirectUrl?, needsEmailConfirmation? }`.
The Login screen (`app/login/page.tsx`) already calls these and shows loading /
error / "check your email" states.

## Files

```
lib/auth/
├── config.ts    # reads the public env, authConfigured()
├── browser.ts   # Supabase browser client (null in demo mode)
├── index.ts     # signInOrUp / signInWithGoogle / getCurrentUser / signOut
├── demo.ts      # local demo-session store
└── types.ts     # TrustUser, AuthResult
app/auth/callback/route.ts  # OAuth code → session, then → /dashboard
middleware.ts               # refreshes the session cookie (no-op in demo mode)
```

## Going live (Jerry)

1. Create a Supabase project; copy the URL + anon key into `.env.local`.
2. In Supabase → Auth → Providers, enable **Google** and **Apple** and add each
   OAuth client. (Apple requires an Apple Developer account + a Services ID;
   Google is the quicker one to stand up for the demo.)
3. Add the redirect URL `https://<your-app>/auth/callback` (and the localhost one).
4. For a frictionless demo, turn **off** "Confirm email" so email sign-up logs
   in immediately (otherwise new users get the "check your email" notice).

No app code changes needed — the same screen switches from demo to live purely
on the presence of the env vars.
