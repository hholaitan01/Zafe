# Deploying to Vercel

TrustFlow is a standard **Next.js 15** app, so Vercel needs **zero config**. Thanks
to the demo-mode design, it deploys to a live URL **even with no environment
variables set** — the AI uses offline heuristics, login uses a demo session, and
deals use the seeded store. Add env vars later to turn each part live.

## Fastest path — Vercel dashboard (recommended)

1. [vercel.com](https://vercel.com) → **Add New → Project**.
2. **Import** the GitHub repo `hholaitan01/TrustSolve`.
3. Framework preset **Next.js** is auto-detected. Root `./`, build command default.
   Leave everything as-is.
4. (Optional) add environment variables — see the table below. **You can skip all
   of them** for a demo-mode deploy.
5. **Deploy.** You get a production URL from `main`, plus an automatic **preview
   URL for every branch/PR**.

> **Want a live URL of the current work before screens merge to `main`?** Once the
> repo is connected, Vercel builds every branch — open the preview deployment for
> `claude/h2o-o24xwd`. Merge to `main` when you want it on the production URL.

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (for
Production + Preview). All optional — omit them and the app runs in demo mode.

| Variable | Kind | Turns on |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Secret | Live Claude for Trust Score / scam / dispute (needs account credits) |
| `TRUSTFLOW_AI_MODEL` | Plain | Optional model override (default `claude-opus-5`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Plain (build-time) | Live auth + deals persistence |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plain (build-time) | Live email/Google/Apple sign-in |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Deals persist to Postgres (see `lib/deals/schema.sql`) |

> ⚠️ **`NEXT_PUBLIC_*` values are inlined at build time.** After adding or changing
> them, **redeploy** (Deployments → ⋯ → Redeploy) — a running deployment won't pick
> them up.

## After deploying with Supabase auth

In **Supabase → Auth → URL Configuration**:
- **Site URL:** your production URL (`https://<app>.vercel.app`)
- **Redirect URLs:** add `https://<app>.vercel.app/auth/callback` (and, for preview
  logins, your preview URL's `/auth/callback`)

Then enable the Google/Apple providers (see `lib/auth/README.md`).

## One caveat: deals persistence on serverless

Each Vercel request runs in a serverless function that can be a **fresh instance**.
The in-memory demo deal store re-seeds per instance, so:
- The **seeded demo deals always show** (good for the pitch), but
- A deal you **create** at runtime may not appear on the next request if it lands on
  a different instance.

For a deployed demo where created deals must stick, set `SUPABASE_SERVICE_ROLE_KEY`
(+ run `schema.sql`) so deals persist to Postgres. The seeded data is fine either way.

## CLI alternative

```bash
npm i -g vercel
vercel          # first run: log in + link the project
vercel --prod   # deploy to production
vercel env add ANTHROPIC_API_KEY   # add secrets one by one
```

## Checklist

- [ ] Import `hholaitan01/TrustSolve` in Vercel (Next.js auto-detected)
- [ ] Deploy — confirm the demo-mode URL works (Landing + Login load)
- [ ] Add env vars as each service comes online, then **redeploy**
- [ ] Add the Vercel `/auth/callback` URL to Supabase redirect URLs
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` so created deals persist
