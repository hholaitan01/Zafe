"use client";

/* Onboarding — the first-run welcome, modelled on the "reliable every step"
   delivery-app onboarding: a collage of tilted, rounded photo tiles fills the
   top and fades into a white content area with one promise and a single action.

   The 12 tiles read from /public/images/onboarding/01.jpg … 12.jpg. Drop real
   photos in at those names (see the README there for the shot list) and the
   mosaic becomes fully photographic with no code change. Shown once: the splash
   routes here only when there's no session and no "zafe.onboarded" flag. */

import { useRouter } from "next/navigation";

// Each tile: which image slot, how it's cropped, its tilt, and whether it spans
// two rows. Tuned to the reference's staggered, overlapping density.
const TILES: { n: string; pos: string; rot: number; tall?: boolean }[] = [
  { n: "01", pos: "50% 35%", rot: -4 },
  { n: "02", pos: "50% 40%", rot: 3, tall: true },
  { n: "03", pos: "40% 50%", rot: 5 },
  { n: "04", pos: "60% 50%", rot: -5 },
  { n: "05", pos: "50% 30%", rot: 4 },
  { n: "06", pos: "30% 60%", rot: -3 },
  { n: "07", pos: "50% 55%", rot: -4 },
  { n: "08", pos: "50% 45%", rot: 4, tall: true },
  { n: "09", pos: "70% 40%", rot: 5 },
  { n: "10", pos: "40% 40%", rot: -4 },
  { n: "11", pos: "55% 60%", rot: 3 },
  { n: "12", pos: "45% 35%", rot: -5 },
];

export default function OnboardingPage() {
  const router = useRouter();

  const go = () => {
    try { localStorage.setItem("zafe.onboarded", "1"); } catch { /* storage blocked */ }
    router.push("/login");
  };

  return (
    <main className="ob">
      <style>{css}</style>

      <div className="ob-mosaic" aria-hidden>
        <div className="ob-grid">
          {TILES.map((t) => (
            <div key={t.n} className={`ob-tile${t.tall ? " ob-tile--tall" : ""}`} style={{ transform: `rotate(${t.rot}deg)` }}>
              <span className="ob-photo" style={{ backgroundImage: `url(/images/onboarding/${t.n}.jpg)`, backgroundPosition: t.pos }} />
            </div>
          ))}
        </div>
        <div className="ob-fade" />
      </div>

      <div className="ob-body">
        <h1 className="ob-title">Reliable every step</h1>
        <p className="ob-sub">Shop confidently: your money is held safe from payment to delivery, and released only when you have what you paid for.</p>
        <button className="ob-cta" onClick={go}>Get started</button>
        <button className="ob-alt" onClick={go}>I already have an account</button>
      </div>
    </main>
  );
}

const css = `
.ob{ position:fixed; inset:0; display:flex; flex-direction:column; background:var(--card,#fff); color:var(--ink,#0F172A);
  font-family:var(--font,'Plus Jakarta Sans',system-ui,sans-serif); -webkit-font-smoothing:antialiased }
.ob *{ box-sizing:border-box }

/* mosaic — bleeds off the top and sides like the reference */
.ob-mosaic{ position:relative; flex:1 1 auto; min-height:0; overflow:hidden; background:#EEF2F6 }
.ob-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px;
  padding:calc(22px + env(safe-area-inset-top)) 18px 0;
  transform:scale(1.1); transform-origin:top center }
.ob-tile{ position:relative; aspect-ratio:1; border-radius:22px; overflow:hidden; background:#E2E8F0;
  box-shadow:0 16px 32px -18px rgba(15,23,42,.45); animation:obIn .6s var(--ease,cubic-bezier(.22,1,.36,1)) both }
.ob-tile--tall{ aspect-ratio:auto; grid-row:span 2 }
.ob-photo{ position:absolute; inset:0; background-size:cover; background-repeat:no-repeat }
.ob-tile:nth-child(3n){ animation-delay:.04s } .ob-tile:nth-child(3n+1){ animation-delay:.1s } .ob-tile:nth-child(3n+2){ animation-delay:.16s }
@keyframes obIn{ from{ opacity:0; transform:translateY(14px) scale(.92) } }

/* fade the collage into the white content area */
.ob-fade{ position:absolute; left:0; right:0; bottom:0; height:200px; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--card,#fff) 84%) }

/* body */
.ob-body{ flex:0 0 auto; padding:4px 28px calc(30px + env(safe-area-inset-bottom)); text-align:center }
.ob-title{ font-size:29px; font-weight:800; letter-spacing:-.03em; line-height:1.08 }
.ob-sub{ margin:12px auto 0; max-width:33ch; font-size:14.5px; line-height:1.55; color:var(--muted,#64748B) }
.ob-cta{ margin-top:22px; width:100%; height:56px; border:none; border-radius:16px; cursor:pointer;
  background:var(--safe,#059669); color:#fff; font-family:inherit; font-size:16px; font-weight:700;
  box-shadow:0 16px 30px -14px rgba(5,150,105,.6); transition:transform .12s var(--ease,cubic-bezier(.22,1,.36,1)), background .18s ease }
.ob-cta:active{ transform:scale(.985) }
@media (hover:hover) and (pointer:fine){ .ob-cta:hover{ background:var(--safe-2,#047857) } }
.ob-alt{ margin-top:10px; width:100%; height:42px; background:none; border:none; cursor:pointer;
  font-family:inherit; font-size:14px; font-weight:600; color:var(--ink-2,#334155) }
.ob-alt:hover{ color:var(--ink,#0F172A) }

@media (prefers-reduced-motion:reduce){ .ob-tile{ animation:none } }

@media (min-width:560px){
  .ob{ max-width:440px; margin:0 auto; border-left:1px solid var(--line,#E6EAF0); border-right:1px solid var(--line,#E6EAF0) }
}
`;
