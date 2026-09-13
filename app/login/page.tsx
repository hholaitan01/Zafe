"use client";

/* ==========================================================================
   Sign in — passwordless. Continue with Google, or get a one-time email link.
   No bank details here — those come later, only when a payout/refund is due.

   Responsive. Desktop (>=1024px): a split screen — a navy "social proof" panel
   (brand, promise, a live escrow card) beside the auth form. Mobile: the navy
   vault header stacks over the lifted auth card. Auth logic is unchanged.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/app/_lib/States";
import { safeNext, sendMagicLink, signInWithGoogle, type AuthResult } from "@/lib/auth";

/** Button label with a leading spinner while an async action runs. */
function Busy({ children, light = true }: { children: React.ReactNode; light?: boolean }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner light={light} size={15} />{children}</span>;
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  // Where to land after signing in. Set when a gated page (e.g. /seller) sent
  // the user here with ?next=…; empty means the default dashboard.
  const [next, setNext] = useState<string | undefined>(undefined);

  // Read one-time URL params: `next` (post-login destination) and `reason`
  // (the idle-logout notice). Done from window.location — not useSearchParams —
  // so no Suspense boundary is needed. `next` is captured into state first, so
  // stripping the query to clean the address bar can't lose it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nx = safeNext(params.get("next"));
    if (nx) setNext(nx);
    if (params.get("reason") === "timeout") setTimedOut(true);
    if (nx || params.get("reason")) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  function applyResult(result: AuthResult, failMessage: string): boolean {
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return true; // navigating away — keep the spinner up
    }
    if (result.ok && result.magicLinkSent) {
      setSentTo(email.trim());
    } else if (result.ok) {
      router.push(next || "/dashboard"); // demo mode signs in directly
      return true;
    } else {
      setError(result.error ?? failMessage);
    }
    return false;
  }

  async function handleGoogle() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await signInWithGoogle(next), "Google sign-in failed. Please try again.");
      if (!keepLoading) setLoading(false);
    } catch {
      setError("Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  // A specific, inline check tied to the field itself — not a generic banner far
  // from where the mistake was made. Runs before we ask the server for anything.
  function validEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function handleLink() {
    if (loading) return;
    if (!validEmail(email)) {
      setEmailError(email.trim() ? "That email doesn't look right. Check for typos." : "Enter your email to get a login link.");
      return;
    }
    setEmailError(null);
    setError(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await sendMagicLink(email, next), "Couldn't send the link. Please try again.");
      if (!keepLoading) setLoading(false);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <style>{css}</style>

      {/* ---- LEFT / social proof (a header band on mobile) ---- */}
      <section className="auth-aside">
        <div className="auth-mark">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M8.5 10.5H23.5" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="rgba(255,255,255,.55)" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
          <span>Zafe</span>
        </div>

        <div className="auth-aside-mid">
          <div className="auth-eyebrow">Escrow for P2P commerce</div>
          <h1 className="auth-headline">{sentTo ? "Check your inbox." : "Send money. Receive your goods. Or get every Naira back."}</h1>
          <p className="auth-lede">Money is held safe from the moment a buyer pays until they confirm delivery. The same protection P2P crypto traders rely on, for goods sold on WhatsApp, Instagram, and Telegram.</p>

          <div className="auth-live">
            <div className="auth-live-head"><span>Live transaction</span><span className="auth-live-status"><span className="dot" />Funded</span></div>
            <div>
              <div className="auth-eyebrow" style={{ color: "rgba(255,255,255,.55)" }}>Held in escrow</div>
              <div className="auth-live-amt tf-mono"><span>₦</span>150,000</div>
            </div>
            <div className="auth-live-rule" />
            <div className="auth-live-row tf-mono"><span>Item</span><span>MacBook Air M2</span></div>
            <div className="auth-live-row tf-mono"><span>Seller Trust Score</span><span>87 / 100, low risk</span></div>
            <div className="auth-live-row tf-mono"><span>Ref</span><span>TF-9X4K2P7N</span></div>
            <div className="auth-live-verdict"><span className="auth-live-ai">AI</span>No scam signals found in the chat</div>
          </div>
        </div>

        <div className="auth-foot tf-mono">Sandbox mode. No real money moves until live keys are set.</div>
      </section>

      {/* ---- RIGHT / form ---- */}
      <section className="auth-form">
        <div className="auth-card auth-enter">
          {timedOut && !sentTo && (
            <div className="auth-notice" role="status">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
              <span>You were signed out after 5 minutes of inactivity. Sign in to continue.</span>
            </div>
          )}
          {sentTo ? (
            <>
              <div className="auth-mailicon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <h2 className="auth-title">Check your inbox</h2>
              <p className="auth-sub">We sent a login link to <b>{sentTo}</b>. Tap it on this device to sign in. It expires shortly and works once.</p>
              <button className="auth-btn auth-btn-primary" onClick={handleLink} disabled={loading}>{loading ? <Busy>Sending…</Busy> : "Send another link"}</button>
              <button className="auth-btn auth-btn-ghost" onClick={() => { setSentTo(null); setError(null); }}>Use a different email</button>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <p className="auth-hint">No email after a minute? Check spam, or send a new link.</p>
            </>
          ) : (
            <>
              <h2 className="auth-title">Sign in</h2>
              <p className="auth-sub">{next === "/seller"
                ? "Sign in to continue. We'll take you straight to seller verification."
                : "Sign in to protect a deal, release funds, confirm receipt, or open a dispute."}</p>

              <button className="auth-btn auth-btn-google" onClick={handleGoogle} disabled={loading}>
                <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.6 17.6 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
                  <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-4.1-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
                </svg>
                {loading ? <Busy light={false}>Please wait…</Busy> : "Continue with Google"}
              </button>

              <div className="auth-divider"><span>or with your email</span></div>

              <label htmlFor="email" className="auth-label">Email address</label>
              <input
                id="email"
                type="email"
                className={`auth-input${emailError ? " is-invalid" : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleLink()}
                autoComplete="email"
                enterKeyHint="go"
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? "email-error" : undefined}
              />
              {emailError && (
                <p id="email-error" className="auth-field-error" role="alert">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                  {emailError}
                </p>
              )}
              <button className="auth-btn auth-btn-primary" onClick={handleLink} disabled={loading}>{loading ? <Busy>Sending…</Busy> : "Email me a login link"}</button>
              {error && <p className="auth-error" role="alert">{error}</p>}
            </>
          )}

          <p className="auth-terms">
            By continuing you agree to Zafe&apos;s <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
          </p>

          <p className="auth-legal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>
            No passwords, ever. We never ask for bank details here.
          </p>
        </div>
      </section>
    </main>
  );
}

const css = `
.auth{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC;
  --card:#FFFFFF; --line:#E6EAF0; --safe:#059669; --safe-2:#047857; --safe-tint:#ECFDF5; --danger:#DC2626;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:'Plus Jakarta Sans',system-ui,sans-serif; color:var(--ink); background:var(--bg);
  min-height:100dvh; display:flex; flex-direction:column; -webkit-font-smoothing:antialiased }
.auth *{ box-sizing:border-box }
.tf-mono{ font-family:inherit; font-variant-numeric:tabular-nums lining-nums; font-feature-settings:"tnum" 1,"lnum" 1 }

/* ---- aside (mobile: an emerald header band) ---- */
/* The brand emerald carries the panel: one accent, white content on it. A soft
   lighter-emerald glow adds depth without a second hue or a photo. */
.auth-aside{ position:relative; overflow:hidden; padding:26px 24px 64px; color:#fff;
  background:linear-gradient(160deg,#059669 0%,#047857 100%);
  display:flex; flex-direction:column }
.auth-aside::after{ content:""; position:absolute; top:-60px; right:-40px; z-index:0; width:220px; height:220px; border-radius:50%;
  background:radial-gradient(circle at 40% 40%, rgba(255,255,255,.16), transparent 70%) }
.auth-aside > *{ position:relative; z-index:1 }
.auth-mark{ position:relative; display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:17px; letter-spacing:-.02em; color:#fff }
.auth-aside-mid{ position:relative }
.auth-eyebrow{ font-size:11px; font-weight:600; letter-spacing:.10em; text-transform:uppercase; color:rgba(255,255,255,.55) }
.auth-headline{ margin:14px 0 0; font-size:23px; font-weight:700; letter-spacing:-.02em; line-height:1.2; max-width:16ch }
.auth-lede{ display:none }
.auth-live{ position:relative; margin-top:20px; padding:16px; border-radius:16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.10); display:flex; flex-direction:column; gap:11px }
.auth-live-head{ display:flex; align-items:center; justify-content:space-between; font-size:11px; letter-spacing:.10em; text-transform:uppercase; color:rgba(255,255,255,.55) }
.auth-live-status{ display:inline-flex; align-items:center; gap:6px; color:#fff } .auth-live-status .dot{ width:6px; height:6px; border-radius:50%; background:#fff }
.auth-live-amt{ font-size:36px; font-weight:700; letter-spacing:-.03em; line-height:1; margin-top:6px } .auth-live-amt span{ color:rgba(255,255,255,.55); margin-right:2px; font-size:22px }
.auth-live-rule{ height:1px; background:rgba(255,255,255,.10) }
.auth-live-row{ display:flex; justify-content:space-between; font-size:12px; color:rgba(255,255,255,.72) } .auth-live-row span:first-child{ color:rgba(255,255,255,.5) }
.auth-live-verdict{ margin-top:4px; padding-top:11px; border-top:1px solid rgba(255,255,255,.10); display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; color:rgba(255,255,255,.9) }
.auth-live-ai{ background:var(--safe); color:#fff; font-size:10px; font-weight:700; letter-spacing:.06em; padding:2px 6px; border-radius:5px }
.auth-foot{ position:relative; display:none; font-size:12px; color:rgba(255,255,255,.5); letter-spacing:.04em }

/* ---- form panel ---- */
.auth-form{ flex:1; padding:0 22px 34px; margin-top:-40px; display:flex; flex-direction:column; align-items:center; justify-content:flex-start }
.auth-card{ width:100%; max-width:420px; background:var(--card); border:1px solid var(--line); border-radius:22px; box-shadow:0 24px 48px -24px rgba(15,23,42,.35); padding:24px 22px }
.auth-enter{ animation:authIn .5s var(--ease) both }
@keyframes authIn{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .auth-enter{ animation:none } }

.auth-notice{ display:flex; align-items:flex-start; gap:9px; margin-bottom:18px; padding:12px 14px; border-radius:12px;
  background:var(--safe-tint); border:1px solid rgba(5,150,105,.22); color:#065F46; font-size:13.5px; line-height:1.5; font-weight:500 }
.auth-notice svg{ flex-shrink:0; margin-top:1px; color:var(--safe) }

.auth-title{ font-size:24px; font-weight:700; letter-spacing:-.02em }
.auth-sub{ margin-top:6px; font-size:14.5px; line-height:1.55; color:var(--muted) } .auth-sub b{ color:var(--ink); font-weight:600 }

.auth-btn{ width:100%; height:52px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:inherit; font-weight:600; font-size:15.5px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), box-shadow .18s var(--ease), background .18s var(--ease), border-color .18s var(--ease) }
.auth-btn:active{ transform:scale(.985) }
.auth-btn:disabled{ opacity:.5; cursor:not-allowed; transform:none }
.auth-btn:focus-visible{ outline:2px solid var(--safe); outline-offset:2px }
.auth-btn-primary{ background:var(--safe); color:#fff; box-shadow:0 10px 22px -12px rgba(5,150,105,.55); margin-top:14px }
@media (hover:hover) and (pointer:fine){ .auth-btn-primary:not(:disabled):hover{ transform:translateY(-1px); box-shadow:0 14px 26px -12px rgba(5,150,105,.6) } }
.auth-btn-google{ background:#fff; color:var(--ink); border-color:var(--line); box-shadow:0 1px 2px rgba(15,23,42,.05); margin-top:20px }
@media (hover:hover) and (pointer:fine){ .auth-btn-google:not(:disabled):hover{ border-color:#cbd5e1; transform:translateY(-1px) } }
.auth-btn-ghost{ background:transparent; color:var(--ink-2); border-color:var(--line); margin-top:11px }
.auth-btn-ghost:hover{ border-color:#cbd5e1 }

.auth-divider{ display:flex; align-items:center; gap:14px; margin:20px 0 16px; color:var(--faint); font-size:12.5px }
.auth-divider::before,.auth-divider::after{ content:""; flex:1; height:1px; background:var(--line) }

.auth-label{ display:block; font-size:13px; font-weight:600; color:var(--ink-2); margin-bottom:7px }
.auth-input{ width:100%; height:52px; border-radius:13px; background:#fff; border:1px solid var(--line); padding:0 15px; font-family:inherit; font-size:16px; color:var(--ink); outline:none; transition:border-color .15s var(--ease), box-shadow .15s var(--ease) }
.auth-input::placeholder{ color:var(--faint) }
.auth-input:focus{ border-color:var(--safe); box-shadow:0 0 0 3px rgba(5,150,105,.15) }
.auth-input.is-invalid{ border-color:var(--danger) }
.auth-input.is-invalid:focus{ box-shadow:0 0 0 3px rgba(220,38,38,.14) }
/* Inline, field-level error: specific, sits directly under the input it's about. */
.auth-field-error{ display:flex; align-items:center; gap:6px; margin-top:8px; font-size:13px; line-height:1.45; font-weight:600; color:var(--danger) }
.auth-field-error svg{ flex-shrink:0 }

.auth-error{ margin-top:13px; font-size:13.5px; line-height:1.5; color:var(--danger); font-weight:500 }
.auth-hint{ margin-top:14px; font-size:13px; line-height:1.55; color:var(--muted) }
.auth-mailicon{ width:52px; height:52px; border-radius:14px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; margin-bottom:16px }
.auth-terms{ margin-top:16px; font-size:12.5px; line-height:1.55; color:var(--muted); text-align:center }
.auth-terms a{ color:var(--safe); font-weight:600; border-bottom:1px solid transparent; transition:border-color .15s var(--ease) }
.auth-terms a:hover{ border-color:var(--safe) }
.auth-legal{ display:flex; align-items:flex-start; gap:8px; margin-top:16px; padding-top:16px; border-top:1px solid var(--line); font-size:12.5px; line-height:1.5; color:var(--muted) }
.auth-legal svg{ flex-shrink:0; margin-top:1px }

@media (min-width:1024px){
  .auth{ display:grid; grid-template-columns:1.05fr 1fr; min-height:100vh }
  .auth-aside{ padding:52px 52px 44px; justify-content:space-between }
  .auth-headline{ font-size:42px; max-width:15ch; margin-top:26px }
  .auth-lede{ display:block; position:relative; margin-top:18px; font-size:15px; line-height:1.55; color:rgba(255,255,255,.72); max-width:44ch }
  .auth-live{ margin-top:34px; max-width:400px }
  .auth-live-amt{ font-size:44px }
  .auth-foot{ display:block }
  .auth-form{ padding:52px 60px; margin-top:0; justify-content:center }
  .auth-card{ border:none; box-shadow:none; padding:0; max-width:400px }
  .auth-btn-google{ margin-top:22px }
}
`;
