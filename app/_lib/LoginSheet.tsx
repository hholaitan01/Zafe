"use client";

/* LoginSheet — the passwordless sign-in surface as a bottom sheet that slides up
   over whatever launched it (the onboarding screen). Same auth as /login
   (Continue with Google, or an emailed one-time link), just presented as a
   pop-up instead of a full route. Portaled to <body> so it sits above the page.

   Auth logic mirrors app/login: demo mode signs in directly; live mode either
   redirects (Google) or emails a link (shows the "check your inbox" state). */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/_lib/States";
import { sendMagicLink, signInWithGoogle, type AuthResult } from "@/lib/auth";

function Busy({ children, light = true }: { children: React.ReactNode; light?: boolean }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner light={light} size={15} />{children}</span>;
}

export default function LoginSheet({ open, onClose, next }: { open: boolean; onClose: () => void; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  function applyResult(result: AuthResult, failMessage: string): boolean {
    if (result.redirectUrl) { window.location.href = result.redirectUrl; return true; }
    if (result.ok && result.magicLinkSent) { setSentTo(email.trim()); }
    else if (result.ok) { router.push(next || "/dashboard"); return true; }
    else { setError(result.error ?? failMessage); }
    return false;
  }

  async function handleGoogle() {
    if (loading) return;
    setError(null); setLoading(true);
    try {
      const keep = applyResult(await signInWithGoogle(next), "Google sign-in failed. Please try again.");
      if (!keep) setLoading(false);
    } catch { setError("Couldn't start Google sign-in. Please try again."); setLoading(false); }
  }

  function validEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  async function handleLink() {
    if (loading) return;
    if (!validEmail(email)) {
      setEmailError(email.trim() ? "That email doesn't look right. Check for typos." : "Enter your email to get a login link.");
      return;
    }
    setEmailError(null); setError(null); setLoading(true);
    try {
      const keep = applyResult(await sendMagicLink(email, next), "Couldn't send the link. Please try again.");
      if (!keep) setLoading(false);
    } catch { setError("Couldn't reach the server. Please try again."); setLoading(false); }
  }

  if (!mounted) return null;

  return createPortal(
    <div className={`ls-scrim${open ? " is-open" : ""}`} onClick={() => !loading && onClose()} aria-hidden={!open}>
      <style>{css}</style>
      <div className="ls-sheet" role="dialog" aria-modal="true" aria-label="Sign in to Zafe" onClick={(e) => e.stopPropagation()}>
        <div className="ls-grip" />
        <button className="ls-x" aria-label="Close" onClick={() => !loading && onClose()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        {sentTo ? (
          <>
            <div className="ls-mailic" aria-hidden><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3 7 9 6 9-6" /></svg></div>
            <h2 className="ls-title">Check your inbox</h2>
            <p className="ls-sub">We sent a login link to <b>{sentTo}</b>. Tap it on this device to sign in. It expires shortly and works once.</p>
            <button className="ls-btn ls-primary" onClick={handleLink} disabled={loading}>{loading ? <Busy>Sending…</Busy> : "Send another link"}</button>
            <button className="ls-btn ls-ghost" onClick={() => { setSentTo(null); setError(null); }}>Use a different email</button>
            {error && <p className="ls-error" role="alert">{error}</p>}
          </>
        ) : (
          <>
            <h2 className="ls-title">Welcome to Zafe</h2>
            <p className="ls-sub">Sign in to protect a deal, release funds, or open a dispute. No password needed.</p>

            <button className="ls-btn ls-google" onClick={handleGoogle} disabled={loading}>
              <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.6 17.6 9.5 24 9.5z" /><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" /><path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" /><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-4.1-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z" /></svg>
              {loading ? <Busy light={false}>Please wait…</Busy> : "Continue with Google"}
            </button>

            <div className="ls-divider"><span>or with your email</span></div>

            <label htmlFor="ls-email" className="ls-label">Email address</label>
            <input
              id="ls-email"
              type="email"
              className={`ls-input${emailError ? " is-invalid" : ""}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              autoComplete="email"
              enterKeyHint="go"
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "ls-email-error" : undefined}
            />
            {emailError && (
              <p id="ls-email-error" className="ls-field-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                {emailError}
              </p>
            )}
            <button className="ls-btn ls-primary" onClick={handleLink} disabled={loading}>{loading ? <Busy>Sending…</Busy> : "Email me a login link"}</button>
            {error && <p className="ls-error" role="alert">{error}</p>}

            <p className="ls-terms">By continuing you agree to Zafe&apos;s <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

const css = `
.ls-scrim{ position:fixed; inset:0; z-index:80; background:rgba(8,15,30,.55);
  backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
  display:flex; align-items:flex-end; justify-content:center;
  opacity:0; pointer-events:none; transition:opacity .28s cubic-bezier(.22,1,.36,1);
  font-family:'Plus Jakarta Sans',system-ui,sans-serif }
.ls-scrim.is-open{ opacity:1; pointer-events:auto }
.ls-scrim *{ box-sizing:border-box }
.ls-sheet{ position:relative; width:100%; max-width:460px; background:#fff; color:#0F172A;
  border-radius:26px 26px 0 0; padding:12px 22px calc(24px + env(safe-area-inset-bottom,0px));
  box-shadow:0 -22px 50px -20px rgba(8,15,30,.5);
  transform:translateY(100%); transition:transform .34s cubic-bezier(.22,1,.36,1) }
.ls-scrim.is-open .ls-sheet{ transform:none }
.ls-grip{ width:40px; height:5px; border-radius:999px; background:#E2E8F0; margin:0 auto 10px }
.ls-x{ position:absolute; top:14px; right:16px; width:34px; height:34px; border:none; border-radius:50%;
  background:#F1F5F9; color:#334155; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .16s ease }
.ls-x:hover{ background:#E2E8F0 }

.ls-title{ font-size:23px; font-weight:800; letter-spacing:-.02em; margin-top:6px }
.ls-sub{ margin-top:7px; font-size:14.5px; line-height:1.55; color:#64748B } .ls-sub b{ color:#0F172A; font-weight:600 }

.ls-btn{ width:100%; height:52px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; gap:10px;
  font-family:inherit; font-weight:700; font-size:15.5px; cursor:pointer; border:1px solid transparent;
  transition:transform .12s cubic-bezier(.22,1,.36,1), background .18s ease, border-color .18s ease }
.ls-btn:active{ transform:scale(.985) } .ls-btn:disabled{ opacity:.55; cursor:not-allowed; transform:none }
.ls-primary{ background:#059669; color:#fff; box-shadow:0 12px 24px -12px rgba(5,150,105,.55); margin-top:14px }
.ls-primary:hover:not(:disabled){ background:#047857 }
.ls-google{ background:#fff; color:#0F172A; border-color:#E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); margin-top:18px }
.ls-google:hover:not(:disabled){ border-color:#CBD5E1 }
.ls-ghost{ background:transparent; color:#334155; border-color:#E6EAF0; margin-top:10px; font-weight:600 }
.ls-ghost:hover{ border-color:#CBD5E1 }

.ls-divider{ display:flex; align-items:center; gap:14px; margin:18px 0 14px; color:#94A3B8; font-size:12.5px }
.ls-divider::before,.ls-divider::after{ content:""; flex:1; height:1px; background:#E6EAF0 }
.ls-label{ display:block; font-size:13px; font-weight:600; color:#334155; margin-bottom:7px }
.ls-input{ width:100%; height:52px; border-radius:13px; background:#fff; border:1px solid #E6EAF0; padding:0 15px;
  font-family:inherit; font-size:16px; color:#0F172A; outline:none; transition:border-color .15s ease, box-shadow .15s ease }
.ls-input::placeholder{ color:#94A3B8 }
.ls-input:focus{ border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,.15) }
.ls-input.is-invalid{ border-color:#DC2626 } .ls-input.is-invalid:focus{ box-shadow:0 0 0 3px rgba(220,38,38,.14) }
.ls-field-error{ display:flex; align-items:center; gap:6px; margin-top:8px; font-size:13px; font-weight:600; color:#DC2626 }
.ls-field-error svg{ flex-shrink:0 }
.ls-error{ margin-top:13px; font-size:13.5px; line-height:1.5; color:#DC2626; font-weight:500 }
.ls-mailic{ width:52px; height:52px; border-radius:14px; background:#ECFDF5; display:flex; align-items:center; justify-content:center; margin:8px 0 14px }
.ls-terms{ margin-top:16px; font-size:12.5px; line-height:1.55; color:#64748B; text-align:center }
.ls-terms a{ color:#059669; font-weight:600 }

@media (prefers-reduced-motion:reduce){
  .ls-scrim, .ls-sheet{ transition:none }
}
@media (min-width:560px){
  .ls-scrim{ align-items:center }
  .ls-sheet{ border-radius:22px; max-width:420px; padding:20px 24px 26px;
    transform:translateY(12px) scale(.98); opacity:0; transition:transform .3s cubic-bezier(.22,1,.36,1), opacity .3s ease }
  .ls-scrim.is-open .ls-sheet{ transform:none; opacity:1 }
  .ls-grip{ display:none }
}
`;
