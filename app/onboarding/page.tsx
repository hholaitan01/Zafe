"use client";

/* Onboarding — the first-run welcome. A collage of tilted commerce/trust tiles
   fills the top; below, one promise and a single primary action. Modelled on the
   "reliable every step" delivery-app onboarding, in Zafe's green + white.
   Shown once (splash routes here when there's no session and no onboarded flag);
   "Get started" marks it seen and hands off to sign in. */

import { useRouter } from "next/navigation";

/** Small product / trust glyphs for the non-photo tiles. */
function Glyph({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const d: Record<string, React.ReactNode> = {
    shield: <><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
    phone: <><rect x="7" y="2" width="10" height="20" rx="2.2" /><path d="M11 18.5h2" /></>,
    box: <><path d="m3 8 9-5 9 5v8l-9 5-9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>,
    laptop: <><rect x="3" y="5" width="18" height="12" rx="1.6" /><path d="M2 20h20" /></>,
    check: <path d="M20 6 9 17l-5-5" strokeWidth="2.4" />,
    tag: <><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
  };
  return <svg width="30" height="30" viewBox="0 0 24 24" {...common}>{d[name]}</svg>;
}

// The mosaic, top-left to bottom-right. Photo tiles reuse the two real assets at
// different crops; the rest are brand tiles so the collage needs no stock library.
type Tile =
  | { kind: "photo"; src: string; pos: string; tall?: boolean; rot: number }
  | { kind: "brand"; glyph: string; rot: number }
  | { kind: "tint"; glyph: string; rot: number }
  | { kind: "mark"; rot: number };

const TILES: Tile[] = [
  { kind: "tint", glyph: "phone", rot: -4 },
  { kind: "photo", src: "/images/commerce.jpg", pos: "50% 30%", tall: true, rot: 3 },
  { kind: "brand", glyph: "shield", rot: 5 },
  { kind: "photo", src: "/images/money.jpg", pos: "50% 50%", rot: -5 },
  { kind: "mark", rot: 4 },
  { kind: "tint", glyph: "box", rot: -3 },
  { kind: "brand", glyph: "check", rot: -4 },
  { kind: "photo", src: "/images/commerce.jpg", pos: "20% 70%", rot: 4 },
  { kind: "tint", glyph: "laptop", rot: 5 },
  { kind: "photo", src: "/images/money.jpg", pos: "70% 40%", tall: true, rot: -4 },
  { kind: "tint", glyph: "tag", rot: 3 },
  { kind: "brand", glyph: "box", rot: -5 },
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
          {TILES.map((t, i) => (
            <div key={i} className={`ob-tile ob-tile--${t.kind}${"tall" in t && t.tall ? " ob-tile--tall" : ""}`} style={{ transform: `rotate(${t.rot}deg)` }}>
              {t.kind === "photo" && <span className="ob-photo" style={{ backgroundImage: `url(${t.src})`, backgroundPosition: t.pos }} />}
              {t.kind === "mark" && (
                <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
                  <path d="M8.5 10.5H23.5" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" />
                  <path d="M8.5 21.5H23.5" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" />
                  <path d="M23.5 10.5L8.5 21.5" stroke="rgba(255,255,255,.5)" strokeWidth="4.2" strokeLinecap="round" />
                </svg>
              )}
              {(t.kind === "brand" || t.kind === "tint") && <Glyph name={t.glyph} />}
            </div>
          ))}
        </div>
        <div className="ob-fade" />
      </div>

      <div className="ob-body">
        <h1 className="ob-title">Reliable every step</h1>
        <p className="ob-sub">Your money stays in escrow from payment to delivery. Release it only when you have what you paid for.</p>
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

/* mosaic */
.ob-mosaic{ position:relative; flex:1 1 auto; min-height:0; overflow:hidden; background:#F4F7FA }
.ob-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px;
  padding:calc(26px + env(safe-area-inset-top)) 22px 0;
  transform:scale(1.06); transform-origin:top center }
.ob-tile{ position:relative; aspect-ratio:1; border-radius:20px; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 14px 30px -18px rgba(15,23,42,.4); animation:obIn .6s var(--ease,cubic-bezier(.22,1,.36,1)) both }
.ob-tile--tall{ aspect-ratio:auto; grid-row:span 2 }
.ob-tile--photo{ background:#E2E8F0 }
.ob-photo{ position:absolute; inset:0; background-size:cover; background-repeat:no-repeat }
.ob-tile--brand{ background:linear-gradient(150deg,#059669,#047857); color:#fff }
.ob-tile--tint{ background:#ECFDF5; color:#059669 }
.ob-tile--mark{ background:linear-gradient(150deg,#0F172A,#0B1220) }
.ob-tile:nth-child(3n){ animation-delay:.05s } .ob-tile:nth-child(3n+1){ animation-delay:.11s } .ob-tile:nth-child(3n+2){ animation-delay:.17s }
@keyframes obIn{ from{ opacity:0; transform:translateY(14px) scale(.92) } }

/* the collage fades into the white content area */
.ob-fade{ position:absolute; left:0; right:0; bottom:0; height:180px; pointer-events:none;
  background:linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--card,#fff) 82%) }

/* body */
.ob-body{ flex:0 0 auto; padding:6px 26px calc(30px + env(safe-area-inset-bottom)); text-align:center }
.ob-title{ font-size:30px; font-weight:800; letter-spacing:-.03em; line-height:1.05 }
.ob-sub{ margin:12px auto 0; max-width:34ch; font-size:15px; line-height:1.55; color:var(--muted,#64748B) }
.ob-cta{ margin-top:24px; width:100%; height:56px; border:none; border-radius:16px; cursor:pointer;
  background:var(--safe,#059669); color:#fff; font-family:inherit; font-size:16px; font-weight:700;
  box-shadow:0 16px 30px -14px rgba(5,150,105,.6); transition:transform .12s var(--ease,cubic-bezier(.22,1,.36,1)), background .18s ease }
.ob-cta:active{ transform:scale(.985) }
@media (hover:hover) and (pointer:fine){ .ob-cta:hover{ background:var(--safe-2,#047857) } }
.ob-alt{ margin-top:12px; width:100%; height:44px; background:none; border:none; cursor:pointer;
  font-family:inherit; font-size:14px; font-weight:600; color:var(--ink-2,#334155) }
.ob-alt:hover{ color:var(--ink,#0F172A) }

@media (prefers-reduced-motion:reduce){ .ob-tile{ animation:none } }

@media (min-width:560px){
  .ob{ max-width:440px; margin:0 auto; border-left:1px solid var(--line,#E6EAF0); border-right:1px solid var(--line,#E6EAF0) }
}
`;
