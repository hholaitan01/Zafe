"use client";

/* Splash / launch screen — the first thing the installed app shows. The Zafe
   mark inside its app tile, the wordmark, and one line of promise, on the brand
   emerald. Holds for a beat, then routes on: dashboard when signed in, login
   otherwise. Tap anywhere to skip the wait. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function SplashPage() {
  const router = useRouter();
  const done = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const dest = useRef("/login");

  useEffect(() => {
    let alive = true;
    // Resolve where to go while the animation plays: signed in → home; first
    // visit → onboarding; otherwise straight to sign in.
    let onboarded = false;
    try { onboarded = localStorage.getItem("zafe.onboarded") === "1"; } catch { /* storage blocked */ }
    getCurrentUser()
      .then((u) => { if (alive) dest.current = u ? "/dashboard" : onboarded ? "/login" : "/onboarding"; })
      .catch(() => { dest.current = onboarded ? "/login" : "/onboarding"; });

    const t = setTimeout(() => go(), 1900);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    // let the fade-out play, then navigate
    setTimeout(() => router.replace(dest.current), 260);
  };

  return (
    <main className={`sp-root${leaving ? " sp-leaving" : ""}`} onClick={go} role="button" aria-label="Enter Zafe">
      <style>{css}</style>

      <div className="sp-center">
        <div className="sp-tile" aria-hidden>
          <svg width="46" height="46" viewBox="0 0 32 32" fill="none">
            <path d="M8.5 10.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="sp-word">Zafe</div>
        <div className="sp-tag">Escrow that keeps your money safe.</div>
      </div>

      <div className="sp-foot" aria-hidden>
        <span className="sp-dots"><i /><i /><i /></span>
      </div>
    </main>
  );
}

const css = `
.sp-root{
  position:fixed; inset:0; z-index:50;
  background:linear-gradient(160deg,#059669 0%,#047857 100%);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:24px; cursor:pointer; user-select:none;
  transition:opacity .26s var(--ease);
}
.sp-leaving{ opacity:0 }

.sp-center{ display:flex; flex-direction:column; align-items:center; text-align:center }

.sp-tile{
  width:88px; height:88px; border-radius:24px; background:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 24px 50px -18px rgba(4,120,87,.55), 0 6px 16px -8px rgba(2,44,34,.4);
  opacity:0; transform:scale(.86) translateY(6px);
  animation:sp-pop .7s var(--ease) forwards;
}
.sp-word{
  margin-top:22px; color:#fff; font-size:40px; font-weight:800; letter-spacing:-.03em; line-height:1;
  opacity:0; transform:translateY(8px);
  animation:sp-rise .6s var(--ease) .16s forwards;
}
.sp-tag{
  margin-top:12px; color:rgba(255,255,255,.86); font-size:14.5px; font-weight:500; letter-spacing:.01em;
  opacity:0; transform:translateY(8px);
  animation:sp-rise .6s var(--ease) .3s forwards;
}

.sp-foot{ position:absolute; bottom:38px; left:0; right:0; display:flex; justify-content:center }
.sp-dots{ display:flex; gap:6px; opacity:0; animation:sp-fade .5s var(--ease) .6s forwards }
.sp-dots i{ width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.55); animation:sp-blink 1.1s var(--ease) infinite }
.sp-dots i:nth-child(2){ animation-delay:.18s } .sp-dots i:nth-child(3){ animation-delay:.36s }

@keyframes sp-pop{ to{ opacity:1; transform:scale(1) translateY(0) } }
@keyframes sp-rise{ to{ opacity:1; transform:translateY(0) } }
@keyframes sp-fade{ to{ opacity:1 } }
@keyframes sp-blink{ 0%,100%{ opacity:.35 } 50%{ opacity:1 } }

@media (prefers-reduced-motion:reduce){
  .sp-tile,.sp-word,.sp-tag,.sp-dots{ animation-duration:.01ms; opacity:1; transform:none }
  .sp-dots i{ animation:none }
}
`;
