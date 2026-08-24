"use client";

/* Trust check — the AI's read on the seller before the buyer funds. Rebuilt in
   the v2 light language, responsive (a focused centred column). It loads the
   current deal and drives the real score, verdict, and headline; the dial and
   accents recolour to the verdict. Reached before /fund. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentDealId, getDeal } from "@/lib/client";
import type { TrustVerdict } from "@/lib/ai/types";

const THEME: Record<TrustVerdict, { ring: string; fg: string; tint: string; bd: string; label: string; safe: boolean }> = {
  safe: { ring: "#059669", fg: "#047857", tint: "#ECFDF5", bd: "#C7F0DE", label: "Low risk", safe: true },
  caution: { ring: "#E89914", fg: "#A16207", tint: "#FEF3C7", bd: "#FCE4A6", label: "Caution", safe: false },
  risky: { ring: "#DC2626", fg: "#B91C1C", tint: "#FEE2E2", bd: "#FCA5A5", label: "High risk", safe: false },
};

const SIGNALS = ["Seller history on Zafe", "Account age & verification", "Conversation tone", "Price against the market"];

export default function TrustDetail({ fallback = "safe" }: { fallback?: TrustVerdict }) {
  const router = useRouter();
  const [score, setScore] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<TrustVerdict>(fallback);
  const [headline, setHeadline] = useState<string>("");
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    getDeal(id).then((d) => {
      if (alive && d.trust) { setScore(d.trust.score); setVerdict(d.trust.verdict); setHeadline(d.trust.headline); }
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // count the dial up to the real score (both the number and the ring read off
  // `display`, so they rise together). Respect reduced-motion: snap, don't count.
  useEffect(() => {
    if (score == null) return;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDisplay(score); return; }
    let raf = 0; const start = performance.now(); const dur = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setDisplay(Math.round(score * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const th = THEME[verdict];

  return (
    <main className="ts">
      <style>{css}</style>
      <div className="ts-inner">
        <div className="ts-topbar">
          <Link href="/new-escrow" className="ts-back" aria-label="Back"><svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></Link>
          <h1>Trust check</h1>
        </div>

        <div className="ts-dialwrap">
          <div className="ts-dial" style={{ background: `conic-gradient(${th.ring} ${display * 3.6}deg, #EEF2F6 0)` }}>
            <div className="ts-dial-hole">
              <div className="ts-score">{score == null ? "—" : display}</div>
              <div className="ts-score-sub">out of 100</div>
            </div>
          </div>
          <div className="ts-verdict" style={{ background: th.tint, borderColor: th.bd, color: th.fg }}>
            {th.safe
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>}
            {th.label}
          </div>
        </div>

        <div className="ts-headline" style={{ background: th.tint, borderColor: th.bd }}>
          <p>{headline || (th.safe ? "This seller looks safe. Established history and a calm conversation, so you can go ahead." : "We found risk signals here. Read them carefully before you send any money.")}</p>
        </div>

        <div className="ts-signals">
          <div className="ts-signals-head">What the AI reviewed</div>
          {SIGNALS.map((s) => (
            <div key={s} className="ts-signal">
              <span className="ts-signal-ic" style={{ background: th.tint, color: th.fg }}>
                {th.safe
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5M12 16h.01" /><circle cx="12" cy="12" r="9" /></svg>}
              </span>
              {s}
            </div>
          ))}
        </div>

        <button className="ts-cta" style={th.safe ? undefined : { background: th.fg }} onClick={() => router.push("/fund")}>
          {th.safe ? "Proceed to fund escrow" : "Review, then decide on payment"}
        </button>
      </div>
    </main>
  );
}

const css = `
.ts{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC; --card:#fff;
  --line:#E6EAF0; --line-2:#EEF2F6; --safe:#059669; --ease:cubic-bezier(.22,1,.36,1);
  font-family:'IBM Plex Sans',system-ui,sans-serif; color:var(--ink); background:var(--bg); min-height:100dvh;
  display:flex; justify-content:center; padding:16px 20px 40px; -webkit-font-smoothing:antialiased }
.ts *{ box-sizing:border-box }
.ts-inner{ width:100%; max-width:520px }
.ts-topbar{ display:flex; align-items:center; gap:14px; padding:8px 0 4px }
.ts-back{ width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid var(--line); box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center; color:var(--ink) }
.ts-back:hover{ border-color:#CBD5E1 }
.ts-topbar h1{ font-size:20px; font-weight:700; letter-spacing:-.02em }

.ts-dialwrap{ display:flex; flex-direction:column; align-items:center; margin-top:22px }
.ts-dial{ width:200px; height:200px; border-radius:50%; display:flex; align-items:center; justify-content:center }
.ts-dial-hole{ width:164px; height:164px; border-radius:50%; background:#fff; box-shadow:inset 0 2px 10px rgba(15,23,42,.06); display:flex; flex-direction:column; align-items:center; justify-content:center }
.ts-score{ font-size:60px; font-weight:700; letter-spacing:-.05em; line-height:1; font-variant-numeric:tabular-nums }
.ts-score-sub{ font-size:13px; color:var(--faint); margin-top:2px }
.ts-verdict{ margin-top:18px; display:inline-flex; align-items:center; gap:8px; padding:8px 16px; border-radius:999px; border:1px solid; font-size:14px; font-weight:700; letter-spacing:.02em }

.ts-headline{ margin-top:22px; padding:16px; border-radius:16px; border:1px solid } .ts-headline p{ font-size:14.5px; line-height:1.55; color:var(--ink-2); font-weight:500 }

.ts-signals{ margin-top:22px }
.ts-signals-head{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--faint); margin-bottom:8px }
.ts-signal{ display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:1px solid var(--line-2); font-size:14px; color:var(--ink-2) }
.ts-signal:last-child{ border-bottom:none }
.ts-signal-ic{ width:28px; height:28px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0 }

.ts-cta{ margin-top:24px; width:100%; height:56px; border-radius:14px; background:var(--safe); color:#fff; border:none; font-family:inherit; font-weight:600; font-size:16px; cursor:pointer; transition:transform .12s var(--ease), filter .18s var(--ease) }
.ts-cta:hover{ filter:brightness(1.04) } .ts-cta:active{ transform:scale(.99) }
`;
