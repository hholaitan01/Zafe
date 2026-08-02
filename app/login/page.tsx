"use client";

/* ==========================================================================
   Sign in — passwordless. Continue with Google, or get a one-time email link.
   No bank details here — those come later, only when a payout/refund is due.

   Redesigned in the v2 language: a navy "vault" header carrying the brand and
   promise, with the auth card lifted over it. Auth logic unchanged.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendMagicLink, signInWithGoogle, type AuthResult } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function applyResult(result: AuthResult, failMessage: string): boolean {
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return true; // navigating away — keep the spinner up
    }
    if (result.ok && result.magicLinkSent) {
      setSentTo(email.trim());
    } else if (result.ok) {
      router.push("/dashboard"); // demo mode signs in directly
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
      const keepLoading = applyResult(await signInWithGoogle(), "Google sign-in failed. Please try again.");
      if (!keepLoading) setLoading(false);
    } catch {
      setError("Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  async function handleLink() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await sendMagicLink(email), "Couldn't send the link. Please try again.");
      if (!keepLoading) setLoading(false);
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="device lg">
      <style>{css}</style>

      {/* navy vault header: brand + promise */}
      <div className="lg-hero">
        <div className="lg-mark">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#fff" fillOpacity="0.1" stroke="#fff" strokeOpacity="0.25" />
            <path d="M11 16.2 14.6 20 21.5 12.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>TrustFlow</span>
        </div>
        <h1>{sentTo ? "Check your inbox" : "Sign in. Your money stays protected."}</h1>
      </div>

      <div className="lg-body">
        <div className="lg-card lg-enter">
          {sentTo ? (
            <>
              <div className="lg-mailicon" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <p className="lg-sub">
                We sent a login link to <b>{sentTo}</b>. Tap it on this device to sign in. It expires shortly and works once.
              </p>
              <button className="lg-btn lg-btn-primary" onClick={handleLink} disabled={loading}>
                {loading ? "Sending…" : "Send another link"}
              </button>
              <button
                className="lg-btn lg-btn-ghost"
                onClick={() => {
                  setSentTo(null);
                  setError(null);
                }}
              >
                Use a different email
              </button>
              {error && <p className="lg-error" role="alert">{error}</p>}
              <p className="lg-hint">No email after a minute? Check spam, or send a new link.</p>
            </>
          ) : (
            <>
              <button className="lg-btn lg-btn-google" onClick={handleGoogle} disabled={loading}>
                <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.6 17.6 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
                  <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-4.1-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
                </svg>
                {loading ? "Please wait…" : "Continue with Google"}
              </button>

              <div className="lg-divider"><span>or with your email</span></div>

              <label htmlFor="email" className="lg-label">Email address</label>
              <input
                id="email"
                type="email"
                className="lg-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLink()}
                autoComplete="email"
                enterKeyHint="go"
              />
              <button className="lg-btn lg-btn-primary" onClick={handleLink} disabled={loading || !email.trim()}>
                {loading ? "Sending…" : "Email me a login link"}
              </button>

              {error && <p className="lg-error" role="alert">{error}</p>}
            </>
          )}
        </div>

        <p className="lg-foot">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" aria-hidden="true"><path d="M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /></svg>
          No passwords, ever. We never ask for bank details here.
        </p>
      </div>
    </main>
  );
}

const css = `
.lg{ background:var(--bg) }
.lg-hero{ position:relative; overflow:hidden; padding:26px 26px 64px;
  background:radial-gradient(120% 130% at 88% 0%, #14304A 0%, #0F172A 58%); }
.lg-hero::after{ content:""; position:absolute; top:-50px; right:-30px; width:170px; height:170px; border-radius:50%;
  background:radial-gradient(circle at 40% 40%, rgba(16,185,129,.30), transparent 70%) }
.lg-mark{ position:relative; display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:17px; letter-spacing:-.02em; color:#fff }
.lg-hero h1{ position:relative; margin-top:26px; font-size:26px; font-weight:700; letter-spacing:-.03em; line-height:1.18; color:#fff; max-width:15ch }

.lg-body{ flex:1; padding:0 22px 34px; margin-top:-40px; display:flex; flex-direction:column; gap:16px }
.lg-card{ background:var(--card); border:1px solid var(--line); border-radius:22px; box-shadow:var(--shadow-lg); padding:22px 20px }
.lg-enter{ animation:lgIn .5s var(--ease) both }
@keyframes lgIn{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .lg-enter{ animation:none } }

.lg-sub{ font-size:15px; line-height:1.55; color:var(--muted) }
.lg-sub b{ color:var(--ink); font-weight:600 }

.lg-btn{ width:100%; height:52px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; gap:10px; font-family:inherit; font-weight:600; font-size:15.5px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), box-shadow .18s var(--ease), background .18s var(--ease), border-color .18s var(--ease) }
.lg-btn:active{ transform:scale(.985) }
.lg-btn:disabled{ opacity:.5; cursor:not-allowed; transform:none }
.lg-btn:focus-visible{ outline:2px solid var(--safe); outline-offset:2px }
.lg-btn-primary{ background:var(--ink); color:#fff; box-shadow:0 10px 22px -12px rgba(15,23,42,.55) }
.lg-btn-primary:not(:disabled):hover{ transform:translateY(-1px); box-shadow:0 14px 26px -12px rgba(15,23,42,.6) }
.lg-btn-google{ background:#fff; color:var(--ink); border-color:var(--line); box-shadow:var(--shadow-sm) }
.lg-btn-google:not(:disabled):hover{ border-color:#cbd5e1; transform:translateY(-1px) }
.lg-btn-ghost{ background:transparent; color:var(--ink-2); border-color:var(--line) }
.lg-btn-ghost:hover{ border-color:#cbd5e1 }
.lg-card .lg-btn + .lg-btn{ margin-top:11px }
.lg-btn-primary{ margin-top:14px }

.lg-divider{ display:flex; align-items:center; gap:14px; margin:20px 0 16px; color:#94a3b8; font-size:12.5px }
.lg-divider::before,.lg-divider::after{ content:""; flex:1; height:1px; background:var(--line) }

.lg-label{ display:block; font-size:13px; font-weight:600; color:var(--ink-2); margin-bottom:7px }
.lg-input{ width:100%; height:52px; border-radius:13px; background:#fff; border:1px solid var(--line); padding:0 15px; font-family:inherit; font-size:16px; color:var(--ink); outline:none; transition:border-color .15s var(--ease), box-shadow .15s var(--ease) }
.lg-input::placeholder{ color:#94a3b8 }
.lg-input:focus{ border-color:var(--safe); box-shadow:0 0 0 3px rgba(5,150,105,.15) }

.lg-error{ margin-top:13px; font-size:13.5px; line-height:1.5; color:var(--danger); font-weight:500 }
.lg-hint{ margin-top:14px; font-size:13px; line-height:1.55; color:var(--muted) }
.lg-mailicon{ width:52px; height:52px; border-radius:14px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; margin-bottom:16px }

.lg-foot{ display:flex; align-items:flex-start; gap:8px; font-size:13px; line-height:1.5; color:var(--muted); padding:0 4px }
.lg-foot svg{ flex-shrink:0; margin-top:1px }
`;
