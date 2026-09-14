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

      {/* Blown-up brand photo (a package delivered safely at a green door),
          held under a heavy emerald wash so it reads as depth, not a stock shot,
          and white content stays legible. */}
      <div className="sp-bg" aria-hidden />
      <div className="sp-wash" aria-hidden />

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
  position:fixed; inset:0; z-index:50; overflow:hidden;
  background:#047857;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:24px; cursor:pointer; user-select:none;
  transition:opacity .26s var(--ease);
}
.sp-leaving{ opacity:0 }

/* Full-bleed photo, blown up past the frame and drifting in slowly for depth. */
.sp-bg{
  position:absolute; inset:0; z-index:0;
  background:url('/images/splash-bg.jpg') center/cover no-repeat;
  transform:scale(1.12);
  animation:sp-drift 9s ease-out both;
}
/* Emerald wash: strong enough that the screen stays brand-emerald + white, with
   a darker foot so the wordmark and loading dots keep contrast. */
.sp-wash{
  position:absolute; inset:0; z-index:1;
  background:
    radial-gradient(90% 55% at 50% 60%, rgba(4,95,70,.52), transparent 60%),
    linear-gradient(170deg, rgba(5,150,105,.40) 0%, rgba(4,110,80,.50) 55%, rgba(3,72,54,.74) 100%);
}

.sp-center{ position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; text-align:center }

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

.sp-foot{ position:absolute; z-index:2; bottom:38px; left:0; right:0; display:flex; justify-content:center }
.sp-dots{ display:flex; gap:6px; opacity:0; animation:sp-fade .5s var(--ease) .6s forwards }
.sp-dots i{ width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.55); animation:sp-blink 1.1s var(--ease) infinite }
.sp-dots i:nth-child(2){ animation-delay:.18s } .sp-dots i:nth-child(3){ animation-delay:.36s }

@keyframes sp-pop{ to{ opacity:1; transform:scale(1) translateY(0) } }
@keyframes sp-rise{ to{ opacity:1; transform:translateY(0) } }
@keyframes sp-fade{ to{ opacity:1 } }
@keyframes sp-blink{ 0%,100%{ opacity:.35 } 50%{ opacity:1 } }
@keyframes sp-drift{ from{ transform:scale(1.18) } to{ transform:scale(1.12) } }

@media (prefers-reduced-motion:reduce){
  .sp-tile,.sp-word,.sp-tag,.sp-dots{ animation-duration:.01ms; opacity:1; transform:none }
  .sp-dots i{ animation:none }
  .sp-bg{ animation:none; transform:scale(1.12) }
}
`;
