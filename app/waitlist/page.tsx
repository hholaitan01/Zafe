"use client";

/* ==========================================================================
   Waitlist — pre-launch email capture. Public, no auth.

   Same visual language as the login split screen: a navy "promise" panel (brand,
   the stakes, a live escrow card) beside the join form. All assets are
   self-hosted (the photo lives under /images), so nothing external is loaded and
   the app's strict CSP is satisfied without change.

   The form posts to /api/waitlist (same origin, allowed by form-action 'self'
   and connect-src 'self'). A hidden honeypot field deters bots. The server does
   the real validation and storage; the browser never touches the database.
   ========================================================================== */

import Link from "next/link";
import { useState } from "react";
import { Spinner } from "@/app/_lib/States";

export default function WaitlistScreen() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState(""); // honeypot: must stay empty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function submit() {
    if (loading || !valid) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source: "waitlist", company }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) setDone(true);
      else setError(data.error || "Could not join the waitlist. Please try again.");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wl">
      <style>{css}</style>

      {/* ---- LEFT / promise (a header band on mobile) ---- */}
      <section className="wl-aside">
        <Link href="/" className="wl-mark" aria-label="Zafe home">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M8.5 10.5H23.5" stroke="#F8FAFC" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#F8FAFC" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="#10B981" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
          <span>Zafe</span>
        </Link>

        <div className="wl-aside-mid">
          <div className="wl-eyebrow">Escrow for P2P commerce</div>
          <h1 className="wl-headline">Be first to trade safely.</h1>
          <p className="wl-lede">Zafe holds a buyer&apos;s money safe until they confirm delivery. Join the waitlist to get early access when we go live on Nigerian rails.</p>

          <div className="wl-stat">
            <div className="wl-stat-fig tf-mono">₦25.85<span>bn</span></div>
            <div className="wl-stat-cap">lost to digital payment fraud in Nigeria in 2025 across 67,518 cases. Zafe closes the gap.</div>
          </div>
        </div>

        <div className="wl-foot tf-mono">No spam. We only email you about the launch.</div>
      </section>

      {/* ---- RIGHT / form ---- */}
      <section className="wl-form">
        <div className="wl-card wl-enter">
          {done ? (
            <>
              <div className="wl-check" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 className="wl-title">You&apos;re on the list.</h2>
              <p className="wl-sub">Thanks for joining. We&apos;ll email <b>{email.trim()}</b> the moment early access opens.</p>
              <Link href="/" className="wl-btn wl-btn-ghost">Back to home</Link>
            </>
          ) : (
            <>
              <h2 className="wl-title">Join the waitlist</h2>
              <p className="wl-sub">Get early access when Zafe launches. We&apos;ll reach out to you first.</p>

              <label htmlFor="wl-name" className="wl-label">Name <span className="wl-opt">(optional)</span></label>
              <input id="wl-name" className="wl-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" maxLength={80} />

              <label htmlFor="wl-email" className="wl-label">Email address</label>
              <input
                id="wl-email"
                type="email"
                inputMode="email"
                className="wl-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="you@example.com"
                autoComplete="email"
                enterKeyHint="go"
                maxLength={254}
              />

              {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
              <div className="wl-hp" aria-hidden="true">
                <label htmlFor="wl-company">Company</label>
                <input id="wl-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>

              <button className="wl-btn wl-btn-primary" onClick={submit} disabled={loading || !valid}>
                {loading ? <span className="wl-busy"><Spinner light size={15} />Joining…</span> : "Join the waitlist"}
              </button>

              <p className="wl-status" role="status" aria-live="polite">{error}</p>

              <p className="wl-consent">We&apos;ll only use your email to tell you when Zafe launches. No spam, and you can opt out anytime.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

const css = `
.wl{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC;
  --card:#FFFFFF; --line:#E6EAF0; --safe:#059669; --safe-2:#10B981; --safe-tint:#ECFDF5; --danger:#DC2626;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:'IBM Plex Sans',system-ui,sans-serif; color:var(--ink); background:var(--bg);
  min-height:100dvh; display:flex; flex-direction:column; -webkit-font-smoothing:antialiased }
.wl *{ box-sizing:border-box }
.wl a{ text-decoration:none; color:inherit }
.tf-mono{ font-family:ui-monospace,'SF Mono',Menlo,monospace; font-variant-numeric:tabular-nums }

/* ---- aside (mobile: a navy header band) ---- */
.wl-aside{ position:relative; overflow:hidden; padding:26px 24px 60px; color:#fff; background-color:#0F172A; display:flex; flex-direction:column }
.wl-aside::before{ content:""; position:absolute; inset:0; z-index:0;
  background:
    linear-gradient(180deg, rgba(15,23,42,.84) 0%, rgba(15,23,42,.92) 60%, rgba(15,23,42,.96) 100%),
    url("/images/commerce.jpg") center 22% / cover no-repeat; }
.wl-aside::after{ content:""; position:absolute; top:-50px; right:-30px; z-index:0; width:170px; height:170px; border-radius:50%;
  background:radial-gradient(circle at 40% 40%, rgba(16,185,129,.30), transparent 70%) }
.wl-aside > *{ position:relative; z-index:1 }
.wl-mark{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:17px; letter-spacing:-.02em; color:#fff }
.wl-aside-mid{ margin-top:8px }
.wl-eyebrow{ font-size:11px; font-weight:600; letter-spacing:.10em; text-transform:uppercase; color:rgba(255,255,255,.55) }
.wl-headline{ margin:14px 0 0; font-size:26px; font-weight:700; letter-spacing:-.02em; line-height:1.15; max-width:15ch }
.wl-lede{ margin-top:12px; font-size:14.5px; line-height:1.55; color:rgba(255,255,255,.74); max-width:44ch }
.wl-stat{ margin-top:22px; padding:16px; border-radius:16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.10) }
.wl-stat-fig{ font-size:32px; font-weight:700; letter-spacing:-.03em; line-height:1 } .wl-stat-fig span{ font-size:18px; color:rgba(255,255,255,.6); margin-left:2px }
.wl-stat-cap{ margin-top:8px; font-size:12.5px; line-height:1.5; color:rgba(255,255,255,.72) }
.wl-foot{ position:relative; margin-top:22px; font-size:12px; color:rgba(255,255,255,.5); letter-spacing:.03em; display:none }

/* ---- form panel ---- */
.wl-form{ flex:1; padding:0 22px 34px; margin-top:-38px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start }
.wl-card{ width:100%; max-width:420px; background:var(--card); border:1px solid var(--line); border-radius:22px; box-shadow:0 24px 48px -24px rgba(15,23,42,.35); padding:24px 22px }
.wl-enter{ animation:wlIn .5s var(--ease) both }
@keyframes wlIn{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .wl-enter{ animation:none } }

.wl-title{ font-size:24px; font-weight:700; letter-spacing:-.02em }
.wl-sub{ margin-top:6px; font-size:14.5px; line-height:1.55; color:var(--muted) } .wl-sub b{ color:var(--ink); font-weight:600 }

.wl-label{ display:block; font-size:13px; font-weight:600; color:var(--ink-2); margin:18px 0 7px }
.wl-opt{ color:var(--faint); font-weight:400 }
.wl-input{ width:100%; height:52px; border-radius:13px; background:#fff; border:1px solid var(--line); padding:0 15px; font-family:inherit; font-size:16px; color:var(--ink); outline:none; transition:border-color .15s var(--ease), box-shadow .15s var(--ease) }
.wl-input::placeholder{ color:var(--faint) }
.wl-input:focus{ border-color:var(--safe); box-shadow:0 0 0 3px rgba(5,150,105,.15) }

/* Honeypot: removed from layout and from the accessibility tree. */
.wl-hp{ position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden }

.wl-btn{ width:100%; height:52px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; font-weight:600; font-size:15.5px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), box-shadow .18s var(--ease), background .18s var(--ease), border-color .18s var(--ease) }
.wl-btn:active{ transform:scale(.985) }
.wl-btn:disabled{ opacity:.5; cursor:not-allowed; transform:none }
.wl-btn:focus-visible{ outline:2px solid var(--safe); outline-offset:2px }
.wl-btn-primary{ background:var(--safe); color:#fff; box-shadow:0 10px 22px -12px rgba(5,150,105,.6); margin-top:20px }
@media (hover:hover) and (pointer:fine){ .wl-btn-primary:not(:disabled):hover{ background:#047857; transform:translateY(-1px) } }
.wl-btn-ghost{ background:#fff; color:var(--ink); border-color:var(--line); margin-top:18px }
.wl-btn-ghost:hover{ border-color:#CBD5E1 }
.wl-busy{ display:inline-flex; align-items:center; gap:8px }

.wl-status{ min-height:18px; margin-top:12px; font-size:13.5px; line-height:1.5; color:var(--danger); font-weight:500 }
.wl-consent{ margin-top:6px; font-size:12.5px; line-height:1.55; color:var(--muted) }

.wl-check{ width:52px; height:52px; border-radius:14px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; margin-bottom:16px }

@media (min-width:1024px){
  .wl{ display:grid; grid-template-columns:1.05fr 1fr; min-height:100vh }
  .wl-aside{ padding:52px 52px 44px; justify-content:space-between }
  .wl-headline{ font-size:40px; max-width:14ch; margin-top:24px }
  .wl-lede{ font-size:15px }
  .wl-stat{ margin-top:32px; max-width:400px }
  .wl-stat-fig{ font-size:40px }
  .wl-foot{ display:block }
  .wl-form{ padding:52px 60px; margin-top:0; justify-content:center }
  .wl-card{ border:none; box-shadow:none; padding:0; max-width:400px }
}
/* Transparency off: drop the photo/scrim for a solid navy panel. */
@media (prefers-reduced-transparency:reduce){
  .wl-aside::before{ background:#0F172A }
}
`;
