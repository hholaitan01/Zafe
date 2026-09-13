"use client";

/* Onboarding — a swipeable 3-slide carousel, modelled on the "reliable every
   step" delivery-app onboarding. Each slide is a dense collage of tilted photo
   tiles fading into a white content area, with a headline and one line. A
   shared footer carries the page dots and the primary action; swipe, tap a dot,
   or press the button to advance. The last slide hands off to sign in.

   Each slide's tiles read from public/images/onboarding/slideN/01.jpg … 14.jpg.
   Replace any file at the same name to update the mosaic (see the README). */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// One tile arrangement, reused for every slide. Tuned to a dense, staggered,
// bleeding-off-the-edges collage like the reference.
const LAYOUT: { pos: string; rot: number; tall?: boolean }[] = [
  { pos: "50% 40%", rot: -4 },
  { pos: "50% 45%", rot: 3, tall: true },
  { pos: "45% 40%", rot: 5 },
  { pos: "55% 50%", rot: -5 },
  { pos: "40% 55%", rot: 4 },
  { pos: "60% 45%", rot: -3 },
  { pos: "50% 35%", rot: -4 },
  { pos: "50% 55%", rot: 4, tall: true },
  { pos: "45% 45%", rot: 5 },
  { pos: "55% 40%", rot: -4 },
  { pos: "40% 50%", rot: 3 },
  { pos: "60% 55%", rot: -5 },
  { pos: "50% 45%", rot: 4 },
  { pos: "50% 40%", rot: -3 },
];

const SLIDES = [
  { dir: "slide1", title: "Buy from anyone", sub: "Shop from any seller on WhatsApp, Instagram, or Telegram, without the fear of getting scammed." },
  { dir: "slide2", title: "Your money stays safe", sub: "You pay into escrow, not the seller. Zafe holds the money until the deal is done." },
  { dir: "slide3", title: "Reliable every step", sub: "Your money is released only when you confirm the item arrived. Safe, the whole way." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === i ? prev : i));
  }, []);

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const finish = () => {
    try { localStorage.setItem("zafe.onboarded", "1"); } catch { /* storage blocked */ }
    router.push("/login");
  };

  const onPrimary = () => (index < SLIDES.length - 1 ? goTo(index + 1) : finish());
  const last = index === SLIDES.length - 1;

  return (
    <main className="ob">
      <style>{css}</style>

      <div className="ob-track" ref={trackRef} onScroll={onScroll}>
        {SLIDES.map((s) => (
          <section className="ob-slide" key={s.dir}>
            <div className="ob-mosaic" aria-hidden>
              <div className="ob-grid">
                {LAYOUT.map((t, i) => (
                  <div key={i} className={`ob-tile${t.tall ? " ob-tile--tall" : ""}`} style={{ transform: `rotate(${t.rot}deg)` }}>
                    <span className="ob-photo" style={{ backgroundImage: `url(/images/onboarding/${s.dir}/${String(i + 1).padStart(2, "0")}.jpg)`, backgroundPosition: t.pos }} />
                  </div>
                ))}
              </div>
              <div className="ob-fade" />
            </div>
            <div className="ob-slidebody">
              <h1 className="ob-title">{s.title}</h1>
              <p className="ob-sub">{s.sub}</p>
            </div>
          </section>
        ))}
      </div>

      <div className="ob-foot">
        <div className="ob-dots" role="tablist" aria-label="Onboarding steps">
          {SLIDES.map((_, i) => (
            <button key={i} className={`ob-dot${i === index ? " is-on" : ""}`} aria-label={`Go to step ${i + 1}`} aria-selected={i === index} onClick={() => goTo(i)} />
          ))}
        </div>
        <button className="ob-cta" onClick={onPrimary}>{last ? "Get started" : "Continue"}</button>
        <button className="ob-alt" onClick={finish}>{last ? "I already have an account" : "Skip"}</button>
      </div>
    </main>
  );
}

const css = `
.ob{ position:fixed; inset:0; display:flex; flex-direction:column; background:var(--card,#fff); color:var(--ink,#0F172A);
  font-family:var(--font,'Plus Jakarta Sans',system-ui,sans-serif); -webkit-font-smoothing:antialiased }
.ob *{ box-sizing:border-box }

/* swipeable track */
.ob-track{ flex:1 1 auto; min-height:0; display:flex; overflow-x:auto; overflow-y:hidden;
  scroll-snap-type:x mandatory; scroll-behavior:smooth; -webkit-overflow-scrolling:touch }
.ob-track::-webkit-scrollbar{ display:none } .ob-track{ scrollbar-width:none }
.ob-slide{ flex:0 0 100%; scroll-snap-align:start; display:flex; flex-direction:column; overflow:hidden }

/* mosaic — dense, tilted, bleeding off the top and sides */
.ob-mosaic{ position:relative; flex:1 1 auto; min-height:0; overflow:hidden; background:#EEF2F6 }
.ob-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:11px;
  padding:calc(20px + env(safe-area-inset-top)) 16px 0; transform:scale(1.12); transform-origin:top center }
.ob-tile{ position:relative; aspect-ratio:1; border-radius:20px; overflow:hidden; background:#E2E8F0;
  box-shadow:0 14px 30px -18px rgba(15,23,42,.45) }
.ob-tile--tall{ aspect-ratio:auto; grid-row:span 2 }
.ob-photo{ position:absolute; inset:0; background-size:cover; background-repeat:no-repeat }
.ob-fade{ position:absolute; left:0; right:0; bottom:0; height:190px; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--card,#fff) 84%) }

/* per-slide text */
.ob-slidebody{ flex:0 0 auto; padding:2px 28px 8px; text-align:center }
.ob-title{ font-size:28px; font-weight:800; letter-spacing:-.03em; line-height:1.08 }
.ob-sub{ margin:11px auto 0; max-width:32ch; font-size:14.5px; line-height:1.55; color:var(--muted,#64748B) }

/* shared footer: dots + actions */
.ob-foot{ flex:0 0 auto; padding:14px 28px calc(26px + env(safe-area-inset-bottom)) }
.ob-dots{ display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:16px }
.ob-dot{ width:8px; height:8px; padding:0; border:none; border-radius:999px; background:var(--line,#E6EAF0); cursor:pointer;
  transition:width .25s var(--ease,cubic-bezier(.22,1,.36,1)), background .25s ease }
.ob-dot.is-on{ width:26px; background:var(--safe,#059669) }
.ob-cta{ width:100%; height:56px; border:none; border-radius:16px; cursor:pointer;
  background:var(--safe,#059669); color:#fff; font-family:inherit; font-size:16px; font-weight:700;
  box-shadow:0 16px 30px -14px rgba(5,150,105,.6); transition:transform .12s var(--ease,cubic-bezier(.22,1,.36,1)), background .18s ease }
.ob-cta:active{ transform:scale(.985) }
@media (hover:hover) and (pointer:fine){ .ob-cta:hover{ background:var(--safe-2,#047857) } }
.ob-alt{ margin-top:10px; width:100%; height:42px; background:none; border:none; cursor:pointer;
  font-family:inherit; font-size:14px; font-weight:600; color:var(--ink-2,#334155) }
.ob-alt:hover{ color:var(--ink,#0F172A) }

@media (min-width:560px){
  .ob{ max-width:440px; margin:0 auto; border-left:1px solid var(--line,#E6EAF0); border-right:1px solid var(--line,#E6EAF0) }
}
`;
