"use client";

/* ==========================================================================
   Waitlist — pre-launch sign-up with a referral queue. Public, no auth.

   Dark, centred layout. Two states:
     • Join: brand, a live "N on the waitlist" count, name + email form.
     • On the list: your place in line, your referral link (copy + share), and
       a nudge that referring friends moves you up.

   All assets are self-hosted / inline SVG, so the strict CSP is satisfied
   without change. The form posts same-origin to /api/waitlist; share buttons
   are ordinary target=_blank links (top-level navigation, not fetch).
   ========================================================================== */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Spinner } from "@/app/_lib/States";

interface Result { code?: string; position?: number; total?: number; referrals?: number }

export default function WaitlistScreen() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState(""); // honeypot: must stay empty
  const [ref, setRef] = useState<string | undefined>(undefined);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  // Read a referrer code from the URL, capture the origin for share links, and
  // fetch the current head-count for social proof.
  useEffect(() => {
    setOrigin(window.location.origin);
    const r = new URLSearchParams(window.location.search).get("ref");
    if (r) setRef(r.trim().slice(0, 64));
    fetch("/api/waitlist").then((res) => res.json()).then((d: { count?: number }) => {
      if (typeof d.count === "number") setCount(d.count);
    }).catch(() => {});
  }, []);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const shareUrl = result?.code ? `${origin}/waitlist?ref=${result.code}` : "";
  const shareText = "I just joined the Zafe waitlist. Escrow that keeps your money safe when you buy from strangers online. Join me:";

  async function submit() {
    if (loading || !valid) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, source: "waitlist", ref, company }),
      });
      const data = (await res.json().catch(() => ({}))) as Result & { ok?: boolean; error?: string };
      if (res.ok && data.ok) setResult({ code: data.code, position: data.position, total: data.total, referrals: data.referrals });
      else setError(data.error || "Could not join the waitlist. Please try again.");
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked; the field is selectable as a fallback */ }
  }

  return (
    <main className="wl">
      <style>{css}</style>
      <div className="wl-glow" aria-hidden="true" />

      <div className="wl-inner">
        <Link href="/" className="wl-brand" aria-label="Zafe home">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M8.5 10.5H23.5" stroke="#F8FAFC" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#F8FAFC" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="#10B981" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
          <span>Zafe</span>
        </Link>

        {result ? (
          /* ---- On the list ---- */
          <div className="wl-card wl-enter">
            <div className="wl-check" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0A0F1C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h1 className="wl-h1">You&apos;re on the waitlist!</h1>
            {result.position != null && (
              <div className="wl-place">
                <div className="wl-place-label">Your place in line</div>
                <div className="wl-place-num tf-mono">#{result.position.toLocaleString()}</div>
                {result.total != null && <div className="wl-place-of">of {result.total.toLocaleString()} waiting</div>}
              </div>
            )}
            <p className="wl-sub">Skip ahead by referring friends. Every person who joins with your link moves you up the line.{result.referrals ? ` You've referred ${result.referrals} so far.` : ""}</p>

            <div className="wl-reflink">
              <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} aria-label="Your referral link" />
              <button className="wl-copy" onClick={copy} aria-label="Copy link">
                {copied
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0F1C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0A0F1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2.5" /><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" /></svg>}
              </button>
            </div>

            <div className="wl-share">
              <a className="wl-sh wl-sh-wa" href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.34-.5.05-.98.24-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.12-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.97-2.31.24-.26.53-.32.71-.32.18 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.82 2 .89 2.14.07.14.12.31.02.49-.09.18-.14.29-.28.45-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.18-.21.69-.8.87-1.08.18-.28.36-.23.6-.14.24.09 1.55.73 1.81.86.26.14.44.21.5.32.07.11.07.64-.17 1.32Z" /></svg>
              </a>
              <a className="wl-sh wl-sh-x" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2.5h3.3l-7.2 8.2 8.5 11.3h-6.7l-5.2-6.9-6 6.9H1.5l7.7-8.8L1 2.5h6.8l4.7 6.3 5.4-6.3Zm-1.2 17.6h1.8L7.3 4.4H5.4l12.3 15.7Z" /></svg>
              </a>
              <a className="wl-sh wl-sh-fb" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" /></svg>
              </a>
              <a className="wl-sh wl-sh-mail" href={`mailto:?subject=${encodeURIComponent("Join me on the Zafe waitlist")}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`} aria-label="Share by email">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3 7 9 6 9-6" /></svg>
              </a>
            </div>
          </div>
        ) : (
          /* ---- Join ---- */
          <div className="wl-card wl-enter">
            <h1 className="wl-h1">Join the waitlist</h1>
            <p className="wl-sub">Zafe holds a buyer&apos;s money safe until they confirm delivery. Be first to get access when we go live on Nigerian rails.</p>

            {count != null && count > 0 && (
              <div className="wl-count"><span className="wl-dot" />{count.toLocaleString()} {count === 1 ? "person" : "people"} already on the waitlist</div>
            )}

            <label htmlFor="wl-name" className="wl-label">Name <span className="wl-opt">(optional)</span></label>
            <input id="wl-name" className="wl-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" maxLength={80} />

            <label htmlFor="wl-email" className="wl-label">Email address</label>
            <input id="wl-email" type="email" inputMode="email" className="wl-input" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="you@example.com" autoComplete="email" enterKeyHint="go" maxLength={254} />

            <div className="wl-hp" aria-hidden="true">
              <label htmlFor="wl-company">Company</label>
              <input id="wl-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>

            <button className="wl-btn" onClick={submit} disabled={loading || !valid}>
              {loading ? <span className="wl-busy"><Spinner light size={15} />Joining…</span> : "Join the waitlist"}
            </button>

            <p className="wl-status" role="status" aria-live="polite">{error}</p>
            <p className="wl-consent">No spam. We only email you about the launch, and you can opt out anytime.</p>
          </div>
        )}
      </div>
    </main>
  );
}

const css = `
.wl{ --bg:#0A0F1C; --text:#F8FAFC; --muted:rgba(255,255,255,.62); --faint:rgba(255,255,255,.42);
  --panel:rgba(255,255,255,.045); --line:rgba(255,255,255,.10); --safe:#10B981; --safe-2:#34D399; --danger:#FCA5A5;
  --ease:cubic-bezier(.22,1,.36,1);
  position:relative; overflow:hidden; min-height:100dvh; display:flex; align-items:center; justify-content:center;
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; color:var(--text);
  background:radial-gradient(120% 90% at 50% -10%, #12203A 0%, #0A0F1C 55%); -webkit-font-smoothing:antialiased; padding:32px 22px }
.wl *{ box-sizing:border-box }
.wl a{ text-decoration:none; color:inherit }
.tf-mono{ font-family:ui-monospace,'SF Mono',Menlo,monospace; font-variant-numeric:tabular-nums }
.wl-glow{ position:absolute; top:-160px; left:50%; transform:translateX(-50%); width:520px; height:520px; border-radius:50%;
  background:radial-gradient(circle at 50% 50%, rgba(16,185,129,.22), transparent 62%); filter:blur(6px); pointer-events:none }

.wl-inner{ position:relative; width:100%; max-width:460px; display:flex; flex-direction:column; align-items:center; text-align:center }
.wl-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:18px; letter-spacing:-.02em; margin-bottom:26px }

.wl-card{ width:100%; background:var(--panel); border:1px solid var(--line); border-radius:22px; padding:30px 26px;
  box-shadow:0 30px 70px -30px rgba(0,0,0,.6); backdrop-filter:blur(6px) }
.wl-enter{ animation:wlIn .5s var(--ease) both }
@keyframes wlIn{ from{ opacity:0; transform:translateY(10px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .wl-enter{ animation:none } }

.wl-h1{ font-size:27px; font-weight:700; letter-spacing:-.02em; line-height:1.15 }
.wl-sub{ margin-top:11px; font-size:14.5px; line-height:1.6; color:var(--muted) }

.wl-count{ display:inline-flex; align-items:center; gap:8px; margin-top:18px; padding:7px 14px; border-radius:999px;
  background:rgba(16,185,129,.10); border:1px solid rgba(16,185,129,.28); color:var(--safe-2); font-size:13px; font-weight:600 }
.wl-dot{ width:7px; height:7px; border-radius:50%; background:var(--safe); box-shadow:0 0 0 0 rgba(16,185,129,.7); animation:wlPulse 2s infinite }
@keyframes wlPulse{ 0%{ box-shadow:0 0 0 0 rgba(16,185,129,.55) } 70%{ box-shadow:0 0 0 7px rgba(16,185,129,0) } 100%{ box-shadow:0 0 0 0 rgba(16,185,129,0) } }
@media (prefers-reduced-motion:reduce){ .wl-dot{ animation:none } }

.wl-label{ display:block; text-align:left; font-size:13px; font-weight:600; color:var(--text); margin:18px 0 7px }
.wl-opt{ color:var(--faint); font-weight:400 }
.wl-input{ width:100%; height:52px; border-radius:13px; background:rgba(255,255,255,.05); border:1px solid var(--line); padding:0 15px;
  font-family:inherit; font-size:16px; color:var(--text); outline:none; transition:border-color .15s var(--ease), box-shadow .15s var(--ease) }
.wl-input::placeholder{ color:var(--faint) }
.wl-input:focus{ border-color:var(--safe); box-shadow:0 0 0 3px rgba(16,185,129,.18) }
.wl-hp{ position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden }

.wl-btn{ width:100%; height:52px; margin-top:20px; border-radius:13px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:inherit; font-weight:700; font-size:15.5px; cursor:pointer; border:none; color:#04110B; background:var(--safe);
  box-shadow:0 12px 26px -12px rgba(16,185,129,.7); transition:transform .12s var(--ease), background .18s var(--ease), box-shadow .18s var(--ease) }
.wl-btn:active{ transform:scale(.985) }
.wl-btn:disabled{ opacity:.5; cursor:not-allowed; transform:none; box-shadow:none }
@media (hover:hover) and (pointer:fine){ .wl-btn:not(:disabled):hover{ background:var(--safe-2); transform:translateY(-1px) } }
.wl-busy{ display:inline-flex; align-items:center; gap:8px; color:#04110B }
.wl-status{ min-height:18px; margin-top:12px; font-size:13.5px; line-height:1.5; color:var(--danger); font-weight:500 }
.wl-consent{ margin-top:4px; font-size:12.5px; line-height:1.55; color:var(--faint) }

/* success */
.wl-check{ width:56px; height:56px; margin:0 auto 8px; border-radius:16px; background:var(--safe); display:flex; align-items:center; justify-content:center;
  box-shadow:0 12px 26px -10px rgba(16,185,129,.7) }
.wl-place{ margin-top:22px; padding:18px; border-radius:16px; background:rgba(255,255,255,.04); border:1px solid var(--line) }
.wl-place-label{ font-size:11px; font-weight:600; letter-spacing:.10em; text-transform:uppercase; color:var(--faint) }
.wl-place-num{ font-size:46px; font-weight:700; letter-spacing:-.03em; line-height:1.05; margin-top:4px; color:var(--safe-2) }
.wl-place-of{ font-size:12.5px; color:var(--muted); margin-top:2px }

.wl-reflink{ display:flex; gap:8px; margin-top:20px }
.wl-reflink input{ flex:1; min-width:0; height:48px; border-radius:12px; background:rgba(255,255,255,.05); border:1px solid var(--line);
  padding:0 14px; font-family:ui-monospace,'SF Mono',Menlo,monospace; font-size:13px; color:var(--muted); outline:none }
.wl-reflink input:focus{ border-color:var(--safe) }
.wl-copy{ width:48px; height:48px; flex-shrink:0; border:none; border-radius:12px; background:var(--safe); cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:transform .12s var(--ease), background .18s var(--ease) }
.wl-copy:active{ transform:scale(.92) } .wl-copy:hover{ background:var(--safe-2) }

.wl-share{ display:flex; justify-content:center; gap:11px; margin-top:16px }
.wl-sh{ width:46px; height:46px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; color:#fff;
  border:1px solid var(--line); transition:transform .14s var(--ease), filter .18s var(--ease) }
.wl-sh:active{ transform:scale(.92) } .wl-sh:hover{ filter:brightness(1.12) }
.wl-sh-wa{ background:#25D366; color:#04110B; border-color:transparent }
.wl-sh-x{ background:#000; border-color:rgba(255,255,255,.2) }
.wl-sh-fb{ background:#1877F2; border-color:transparent }
.wl-sh-mail{ background:rgba(255,255,255,.08); color:var(--text) }
`;
