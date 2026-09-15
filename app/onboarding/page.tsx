"use client";

/* Onboarding — a swipeable 3-slide carousel, modelled on the "reliable every
   step" delivery-app onboarding. Each slide is a dense collage of tilted photo
   tiles fading into a white content area, with a headline and one line. A
   shared footer carries the page dots and the primary action; swipe, tap a dot,
   or press the button to advance. The last slide hands off to sign in.

   Each slide's tiles read from public/images/onboarding/slideN/01.jpg … 14.jpg.
   Replace any file at the same name to update the mosaic (see the README). */

import { useCallback, useRef, useState } from "react";
import LoginSheet from "@/app/_lib/LoginSheet";

// The mosaic is ONE uniformly-tilted grid (the whole grid rotates as a plane,
// like the reference), not tiles at random angles. 24 equal tiles fill it; each
// slide has 14 source photos, spread by a coprime stride so the first 14 tiles
// are all unique and any repeat lands rows away, with a varied crop.
const TILE_COUNT = 24;
const IMG_PER_SLIDE = 14;
const POSITIONS = ["50% 40%", "42% 52%", "58% 44%", "46% 58%", "54% 38%", "50% 50%", "40% 46%", "60% 54%"];
const imgIndex = (i: number) => ((i * 5) % IMG_PER_SLIDE) + 1; // stride 5, coprime with 14

const SLIDES = [
  { dir: "slide1", title: "Buy from anyone", sub: "Shop from any seller on WhatsApp, Instagram, or Telegram, without the fear of getting scammed." },
  { dir: "slide2", title: "Your money stays safe", sub: "You pay into escrow, not the seller. Zafe holds the money until the deal is done." },
  { dir: "slide3", title: "Reliable every step", sub: "Your money is released only when you confirm the item arrived. Safe, the whole way." },
];

export default function OnboardingPage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);

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

  // Both footer actions open the sign-in sheet over this screen. Reaching for it
  // means onboarding is done, so we set the flag now (so splash won't send them
  // back here); the sheet itself handles the actual sign-in + routing.
  const openAuth = () => {
    try { localStorage.setItem("zafe.onboarded", "1"); } catch { /* storage blocked */ }
    setAuthOpen(true);
  };

  return (
    <main className="ob">
      <style>{css}</style>

      <div className="ob-track" ref={trackRef} onScroll={onScroll}>
        {SLIDES.map((s) => (
          <section className="ob-slide" key={s.dir}>
            <div className="ob-mosaic" aria-hidden>
              <div className="ob-grid">
                {Array.from({ length: TILE_COUNT }).map((_, i) => (
                  <div className="ob-tile" key={i}>
                    <span className="ob-photo" style={{ backgroundImage: `url(/images/onboarding/${s.dir}/${String(imgIndex(i)).padStart(2, "0")}.jpg)`, backgroundPosition: POSITIONS[i % POSITIONS.length] }} />
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
        <button className="ob-cta" onClick={openAuth}>Get started</button>
        <button className="ob-alt" onClick={openAuth}>Login</button>
      </div>

      <LoginSheet open={authOpen} onClose={() => setAuthOpen(false)} />
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

/* mosaic — ONE uniformly-tilted grid, bleeding off every edge, like the reference */
.ob-mosaic{ position:relative; flex:1 1 auto; min-height:0; overflow:hidden; background:#EEF2F6 }
.ob-grid{ position:absolute; top:-15%; left:-27%; width:154%;
  display:grid; grid-template-columns:repeat(4,1fr); gap:9px;
  transform:rotate(-7deg); transform-origin:center center }
.ob-tile{ position:relative; aspect-ratio:1; border-radius:15px; overflow:hidden; background:#E2E8F0;
  box-shadow:0 12px 26px -18px rgba(15,23,42,.4) }
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
.ob-alt{ margin-top:10px; width:100%; height:52px; border-radius:16px; cursor:pointer;
  background:var(--card,#fff); border:1px solid var(--line,#E6EAF0);
  font-family:inherit; font-size:15.5px; font-weight:700; color:var(--ink,#0F172A);
  transition:border-color .18s ease, transform .12s var(--ease,cubic-bezier(.22,1,.36,1)) }
.ob-alt:active{ transform:scale(.985) }
@media (hover:hover) and (pointer:fine){ .ob-alt:hover{ border-color:#CBD5E1 } }

@media (min-width:560px){
  .ob{ max-width:440px; margin:0 auto; border-left:1px solid var(--line,#E6EAF0); border-right:1px solid var(--line,#E6EAF0) }
}
`;
