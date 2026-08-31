"use client";

/* ==========================================================================
   Landing page — the product's front door.

   Trust-first fintech language (preserved from the app): light canvas, navy
   ink (#0F172A), a single emerald accent for the "money held safe" story, IBM
   Plex Sans, soft elevation. One accent, one radius scale, restrained motion
   that only reveals content as you reach it. Scoped under `.lp`.

   Icons are the app's own consistent inline set (1.8 stroke) so the marketing
   page and the product speak the same visual language. No em-dashes anywhere.
   ========================================================================== */

import Link from "next/link";
import { useEffect, useState } from "react";
import { LandingStructuredData } from "./_lib/StructuredData";
import { FAQS } from "./_lib/site";

function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8.5 10.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M8.5 21.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M23.5 10.5L8.5 21.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  );
}

const I = {
  lock: "M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
  ship: "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6",
  check: "M20 6 9 17l-5-5",
  scan: "M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M7 12h10",
  shield: "M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z",
  bank: "M4 10h16M5 10 12 4l7 6M6 10v8m4-8v8m4-8v8m4-8v8M3 21h18",
  scale: "M12 3v18M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0zM7 7h10",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chevron: "M6 9l6 6 6-6",
};
// Only show the waitlist count once it reads as real social proof. Below this,
// a tiny number ("1 person") undersells the product, so we hide it entirely.
const WAITLIST_MIN_TO_SHOW = 50;

function Icon({ d, color = "#0F172A", size = 22 }: { d: string; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Landing() {
  // Reveal content as it enters the viewport (storytelling), opacity/transform
  // only, and instant for anyone who asked for reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".lp-reveal, .lp-draw"));
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("lp-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("lp-in"), io.unobserve(e.target))),
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // A live waitlist count for social proof under the hero CTAs.
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d: { count?: number }) => typeof d.count === "number" && setCount(d.count))
      .catch(() => {});
  }, []);

  return (
    <div className="lp">
      <style>{css}</style>
      <LandingStructuredData />

      {/* ---- Nav ---- */}
      <header className="lp-nav">
        <div className="lp-wrap lp-navrow">
          <a className="lp-brand" href="#top" aria-label="Zafe home"><Mark /><span>Zafe</span></a>
          <nav className="lp-navlinks" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#ai">The AI</a>
            <a href="#trust">Trust Score</a>
            <a href="#safety">Safety</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-navcta">
            <Link href="/seller" className="lp-link lp-link-sell">Become a seller</Link>
            <Link href="/login" className="lp-link">Sign in</Link>
            <Link href="/waitlist" className="lp-btn lp-btn-primary">Join the waitlist</Link>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="lp-hero" id="top">
        <div className="lp-wrap lp-herocenter">
          <div className="lp-herocopy lp-reveal">
            <h1>Buy from strangers.<br />Keep your money safe.</h1>
            <p className="lp-herosub">Pay into escrow, not the seller. An AI checks the deal for scams and your money is released only when you confirm the item arrived.</p>
            <div className="lp-herobtns">
              <Link href="/waitlist" className="lp-btn lp-btn-primary lp-btn-lg">Join the waitlist</Link>
              <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">See how it works</a>
            </div>
            {count != null && count >= WAITLIST_MIN_TO_SHOW && (
              <div className="lp-livecount"><span className="lp-livedot" />{count.toLocaleString()} people already on the waitlist</div>
            )}
          </div>

          {/* Hero visual: a real screenshot of the app "locked" screen, captured
              from the running product, shown on a phone. */}
          <div className="lp-herovis lp-reveal">
            <div className="lp-phone">
              <span className="lp-phone-island" aria-hidden="true" />
              <div className="lp-phone-screen">
                <img className="lp-shot" src="/demo/locked-mobile.png" width={660} height={1388} alt="The Zafe app showing ₦450,000 locked safely in escrow until the buyer confirms delivery" />
                <div className="lp-status-overlay" aria-hidden="true">
                  <span className="lp-status-time">9:41</span>
                  <span className="lp-status-icons">
                    <svg width="18" height="11" viewBox="0 0 18 11" fill="#fff"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="6" rx="1" /><rect x="10" y="2.5" width="3" height="8.5" rx="1" /><rect x="15" y="0" width="3" height="11" rx="1" /></svg>
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M2 4.2a9 9 0 0 1 12 0M4.4 6.7a5.5 5.5 0 0 1 7.2 0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /><circle cx="8" cy="9.6" r="1.1" fill="#fff" /></svg>
                    <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="#fff" strokeOpacity="0.5" /><rect x="2" y="2" width="18" height="8" rx="1.5" fill="#fff" /><rect x="23" y="4" width="2" height="4" rx="1" fill="#fff" fillOpacity="0.5" /></svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Trust band (moved out of the hero) ---- */}
      <section className="lp-wrap lp-band lp-reveal">
        <span><Icon d={I.lock} color="#059669" size={18} />Money held in escrow</span>
        <span><Icon d={I.scan} color="#059669" size={18} />AI scam checks before you pay</span>
        <span><Icon d={I.bank} color="#059669" size={18} />Payments verified at the bank</span>
      </section>

      {/* ---- How it works ---- */}
      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <h2>Four steps. No trust required.</h2>
            <p>The escrow does the trusting for you, so a deal with a stranger works like a deal with a friend.</p>
          </div>
          <div className="lp-flow">
            <div className="lp-flowline lp-draw" aria-hidden="true" />
            {[
              { n: "1", d: I.scan, t: "Agree the deal", b: "Enter the item, the price, and the seller. Paste the chat and the AI checks it for scams." },
              { n: "2", d: I.lock, t: "Pay into escrow", b: "Your money is held safe. The seller sees it is there but cannot touch it yet." },
              { n: "3", d: I.ship, t: "Seller ships", b: "They send the item knowing the money is real and waiting for them." },
              { n: "4", d: I.check, t: "You confirm", b: "Got what you paid for? Release the money. Something wrong? Open a dispute." },
            ].map((s, i) => (
              <div className="lp-flowcard lp-reveal" key={s.n} style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="lp-flownum">{s.n}</div>
                <div className="lp-flowicon"><Icon d={s.d} color="#059669" size={20} /></div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- AI in action ---- */}
      <section className="lp-section lp-aiwrap" id="ai">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <h2>An AI reads the deal before your money moves.</h2>
            <p>Most fraud happens in the chat, before anyone pays. Paste the conversation and Zafe flags the pressure tactics and off-platform tricks. If it is risky, you cannot pay until you have seen why.</p>
          </div>

          {/* A real screenshot of the app "Trust check" page, captured from the
              running product on desktop, shown inside a browser window. */}
          <div className="lp-window lp-window-wide lp-reveal">
            <div className="lp-window-bar" aria-hidden="true">
              <span className="lp-window-dots"><i /><i /><i /></span>
              <span className="lp-window-url"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" /></svg>getzafe.vercel.app/trust-score</span>
              <span className="lp-window-spacer" />
            </div>
            <div className="lp-window-screen">
              <img className="lp-shot" src="/demo/trust-desktop.png" width={2080} height={1760} alt="The Zafe Trust check page flagging a deal as high risk with a score of 4 out of 100" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Trust Score ---- */}
      <section className="lp-section lp-trust" id="trust">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <h2>Every seller carries a Trust Score.</h2>
            <p>One number from 0 to 100, built from the things that actually predict a safe deal. You see it before you pay, so you are never trusting a stranger blind.</p>
          </div>
          <div className="lp-trustgrid">
            <div className="lp-trustdial lp-reveal" aria-hidden="true">
              <div className="lp-dial">
                <div className="lp-dial-num">87</div>
                <div className="lp-dial-of">/ 100</div>
              </div>
              <div className="lp-dial-verdict"><span className="lp-dial-dot" />Safe to deal</div>
              <div className="lp-dial-bands">
                <span><i style={{ background: "var(--safe)" }} />70 and up. Safe</span>
                <span><i style={{ background: "#A16207" }} />40 to 69. Caution</span>
                <span><i style={{ background: "var(--danger)" }} />Under 40. Risky</span>
              </div>
            </div>
            <ul className="lp-trustfactors lp-reveal">
              {[
                { d: I.shield, t: "Verified identity", b: "A seller who passed BVN or NIN checks lifts the score. A banned scammer cannot just reappear." },
                { d: I.check, t: "Completed deals", b: "A real track record of finished deals on Zafe counts for more than any promise in the chat." },
                { d: I.scale, t: "Past disputes", b: "Deals that ended in a dispute pull the score down. Repeat trouble is a clear warning." },
                { d: I.bank, t: "Account age", b: "A brand-new account gets less benefit of the doubt than one that has been trading for months." },
              ].map((f, i) => (
                <li className="lp-trustfactor lp-reveal" key={f.t} style={{ transitionDelay: `${i * 60}ms` }}>
                  <div className="lp-featicon"><Icon d={f.d} color="#059669" size={20} /></div>
                  <div><h3>{f.t}</h3><p>{f.b}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Safety ---- */}
      <section className="lp-section lp-safety" id="safety">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <h2 className="lp-safety-h">Safety that works before the money moves.</h2>
            <p className="lp-safety-p">Peer-to-peer fraud lives in the gap between "send me the money" and "where is my item?" Zafe closes that gap on both sides.</p>
          </div>
          <div className="lp-features">
            {[
              { d: I.scan, t: "AI scam detection", b: "The chat is read for pressure tactics and off-platform tricks before you pay a naira." },
              { d: I.bank, t: "No fake receipts", b: "We confirm money at the bank, not from a screenshot. A doctored receipt gets you nowhere." },
              { d: I.shield, t: "Verified sellers", b: "Payouts only reach identity-verified accounts, so the person getting paid is real." },
              { d: I.scale, t: "Fair disputes", b: "If a deal goes wrong, an AI judge weighs the evidence and releases or refunds accordingly." },
            ].map((f, i) => (
              <div className="lp-feature lp-reveal" key={f.t} style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="lp-featicon"><Icon d={f.d} color="#059669" size={20} /></div>
                <div><h3>{f.t}</h3><p>{f.b}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-faqwrap">
          <div className="lp-head lp-reveal"><h2>Questions, answered plainly.</h2></div>
          <div className="lp-faq">
            {FAQS.map((f) => (
              <details className="lp-faqitem lp-reveal" key={f.q}>
                <summary>{f.q}<span className="lp-faqchev" aria-hidden="true"><Icon d={I.chevron} color="#64748B" size={18} /></span></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="lp-cta lp-reveal">
        <div className="lp-wrap lp-ctacard">
          <h2>Your next deal, protected.</h2>
          <p>Zafe is launching soon. Join the waitlist to get early access the moment we go live.</p>
          <Link href="/waitlist" className="lp-btn lp-btn-safe lp-btn-lg">Join the waitlist<Icon d={I.arrow} color="#fff" size={18} /></Link>
          <p className="lp-cta-sell">Selling instead? <Link href="/seller">Become a verified seller</Link></p>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footrow">
          <a className="lp-brand" href="#top" aria-label="Zafe home"><Mark size={24} /><span>Zafe</span></a>
          <nav className="lp-footlinks" aria-label="Legal">
            <Link href="/guides">Guides</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/seller">Become a seller</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

const css = `
.lp *{box-sizing:border-box}
.lp{
  --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8;
  --bg:#F8FAFC; --card:#FFFFFF; --border:#E6EAF0; --line-2:#EEF2F6;
  --navy:#0F172A; --safe:#059669; --safe-2:#047857; --safe-tint:#ECFDF5; --danger:#DC2626;
  --ease:cubic-bezier(.22,1,.36,1);
  --sh-sm:0 1px 2px rgba(15,23,42,.06); --sh:0 12px 30px -14px rgba(15,23,42,.22);
  --sh-lg:0 30px 60px -24px rgba(15,23,42,.30);
  --r-card:20px; --r-btn:12px;
  font-family:"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color:var(--ink); background:var(--bg); min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5;
}
.lp a:not(.lp-btn){color:inherit} .lp a{text-decoration:none}
.lp-wrap{width:100%; max-width:1120px; margin:0 auto; padding:0 24px}

.lp-reveal{opacity:0; transform:translateY(22px); transition:opacity .7s var(--ease), transform .7s var(--ease)}
.lp-reveal.lp-in{opacity:1; transform:none}
.lp-draw{transform:scaleX(0); transform-origin:left center; transition:transform 1s var(--ease)}
.lp-draw.lp-in{transform:scaleX(1)}
@media (prefers-reduced-motion:reduce){.lp-reveal{opacity:1; transform:none; transition:none}
  .lp-draw{transform:none; transition:none}
  .lp-hero::before,.lp-phone,.lp-livedot{animation:none}}

/* nav */
.lp-nav{position:sticky; top:0; z-index:40; background:rgba(248,250,252,.82); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border)}
.lp-navrow{display:flex; align-items:center; gap:24px; height:66px}
.lp-brand{display:inline-flex; align-items:center; gap:10px; font-weight:700; font-size:18px; letter-spacing:-.02em}
.lp-navlinks{display:flex; gap:26px; margin-left:8px; font-size:14.5px; font-weight:500; color:var(--ink-2)}
.lp-navlinks a:hover{color:var(--ink)}
.lp-navcta{margin-left:auto; display:flex; align-items:center; gap:14px}
.lp-link{font-size:14.5px; font-weight:600; color:var(--ink-2); white-space:nowrap} .lp-link:hover{color:var(--ink)}
.lp-cta-sell{margin-top:18px; font-size:14.5px; color:var(--muted)} .lp-cta-sell a{color:var(--safe); font-weight:700; border-bottom:1px solid transparent; transition:border-color .2s var(--ease)} .lp-cta-sell a:hover{border-color:var(--safe)}

/* buttons — one radius, one accent */
.lp-btn{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 18px; border-radius:var(--r-btn); font-weight:600; font-size:14.5px; cursor:pointer; transition:transform .12s var(--ease), box-shadow .18s var(--ease), background .18s var(--ease); border:1px solid transparent; white-space:nowrap}
.lp-btn-lg{height:52px; padding:0 24px; font-size:16px}
.lp-btn-primary{background:var(--navy); color:#fff; box-shadow:0 8px 20px -10px rgba(15,23,42,.5)}
.lp-btn-safe{background:var(--safe); color:#fff; box-shadow:0 10px 24px -10px rgba(5,150,105,.6)}
.lp-btn-ghost{background:#fff; color:var(--ink); border-color:var(--border); box-shadow:var(--sh-sm)}
.lp-btn:active{transform:scale(.985)}
.lp-btn:focus-visible{outline:2px solid var(--safe); outline-offset:2px}
@media (hover:hover) and (pointer:fine){
  .lp-btn-primary:hover{transform:translateY(-1px); box-shadow:0 12px 26px -10px rgba(15,23,42,.55)}
  .lp-btn-safe:hover{transform:translateY(-1px); box-shadow:0 14px 30px -10px rgba(5,150,105,.65)}
  .lp-btn-ghost:hover{transform:translateY(-1px); border-color:#cbd5e1}
}

/* eyebrow — no decorative dot */
.lp-eyebrow{display:inline-flex; align-items:center; font-size:12.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--safe); background:var(--safe-tint); border:1px solid #C7F0DE; padding:6px 12px; border-radius:999px}

/* hero */
.lp-hero{position:relative; overflow:hidden; padding:64px 0 40px; background:radial-gradient(90% 60% at 100% -10%, #EAF7F0 0%, rgba(234,247,240,0) 55%)}
.lp-hero::before{content:""; position:absolute; inset:-30% -10% auto -10%; height:640px; pointer-events:none; z-index:0;
  background:radial-gradient(42% 55% at 26% 24%, rgba(5,150,105,.13), transparent 62%), radial-gradient(40% 52% at 82% 6%, rgba(5,150,105,.10), transparent 60%);
  animation:lpAurora 16s ease-in-out infinite alternate}
.lp-hero .lp-wrap{position:relative; z-index:1}
@keyframes lpAurora{0%{transform:translate3d(-2%,0,0) scale(1)}100%{transform:translate3d(4%,2%,0) scale(1.08)}}
.lp-livecount{margin-top:22px; display:inline-flex; align-items:center; gap:9px; font-size:13.5px; font-weight:600; color:var(--ink-2)}
.lp-livedot{width:8px; height:8px; border-radius:50%; background:var(--safe); box-shadow:0 0 0 0 rgba(5,150,105,.6); animation:lpPulseDot 2s infinite}
@keyframes lpPulseDot{0%{box-shadow:0 0 0 0 rgba(5,150,105,.5)}70%{box-shadow:0 0 0 8px rgba(5,150,105,0)}100%{box-shadow:0 0 0 0 rgba(5,150,105,0)}}

/* hero: two columns on desktop (copy left, product shot right) */
.lp-herocenter{display:grid; grid-template-columns:1.12fr .88fr; gap:52px; align-items:center}
.lp-herocopy h1{margin:0; font-size:44px; line-height:1.08; letter-spacing:-.03em; font-weight:700}
.lp-herosub{margin:20px 0 0; max-width:46ch; font-size:17px; line-height:1.6; color:var(--muted)}
.lp-herobtns{margin-top:28px; display:flex; gap:12px; flex-wrap:wrap}

/* hero visual */
.lp-herovis{position:relative; width:328px; max-width:100%; margin:0 auto}
.lp-card{background:var(--card); border:1px solid var(--border); border-radius:var(--r-card); box-shadow:var(--sh)}

/* phone frame — a real device: true 19.5:9 screen at native proportions */
.lp-phone{position:relative; z-index:2; width:328px; max-width:100%; padding:13px; border-radius:48px; background:linear-gradient(160deg,#1E293B,#0F172A); box-shadow:var(--sh-lg), inset 0 0 0 2px rgba(255,255,255,.04); animation:lpFloat 7s ease-in-out infinite}
@keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
.lp-phone-island{position:absolute; top:24px; left:50%; transform:translateX(-50%); width:88px; height:24px; border-radius:999px; background:#0B1220; z-index:3}
.lp-phone-screen{position:relative; border-radius:38px; overflow:hidden; background:#0A1524}

/* iOS-style status bar overlaid on the captured screen (the app hides its own,
   expecting the real OS bar) so the phone reads as a genuine device */
.lp-status-overlay{position:absolute; top:0; left:0; right:0; height:52px; display:flex; align-items:center; justify-content:space-between; padding:15px 22px 0 28px; color:#fff; z-index:2}
.lp-status-time{font-size:15px; font-weight:600; letter-spacing:.02em; font-variant-numeric:tabular-nums}
.lp-status-icons{display:inline-flex; align-items:center; gap:6px}

/* trust band */
.lp-band{display:flex; flex-wrap:wrap; gap:14px 32px; margin-top:30px; padding:22px 24px; border-top:1px solid var(--border); border-bottom:1px solid var(--border)}
.lp-band span{display:inline-flex; align-items:center; gap:9px; font-size:14.5px; font-weight:600; color:var(--ink-2)}

/* sections */
.lp-section{padding:76px 0}
.lp-head{max-width:640px; margin:0 auto; text-align:center}
.lp-head h2{font-size:37px; line-height:1.1; letter-spacing:-.03em; font-weight:700}
.lp-head p{margin-top:14px; font-size:17px; color:var(--muted); line-height:1.6}

/* how — a connected flow, not four loose cards */
.lp-flow{position:relative; margin-top:46px; display:grid; grid-template-columns:repeat(4,1fr); gap:18px}
.lp-flowline{position:absolute; top:42px; left:12%; right:12%; height:2px; background:linear-gradient(90deg,var(--safe-tint),#CFEEDD,var(--safe-tint)); z-index:0}
.lp-flowcard{position:relative; z-index:1; background:var(--card); border:1px solid var(--border); border-radius:var(--r-card); box-shadow:var(--sh-sm); padding:24px 20px; transition:transform .24s var(--ease), box-shadow .24s var(--ease)}
.lp-flowcard:hover{transform:translateY(-4px); box-shadow:var(--sh)}
.lp-flownum{position:absolute; top:-14px; left:22px; width:28px; height:28px; border-radius:50%; background:var(--navy); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700}
.lp-flowicon{width:44px; height:44px; border-radius:12px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; margin-top:8px}
.lp-flowcard h3{margin-top:16px; font-size:17px; font-weight:600; letter-spacing:-.01em}
.lp-flowcard p{margin-top:8px; font-size:14.5px; color:var(--muted); line-height:1.55}

/* AI in action */
.lp-aiwrap{background:linear-gradient(180deg,#fff, #F4F8FB)}

/* desktop browser window — a real, wide desktop screenshot of the product */
.lp-window{position:relative; border-radius:16px; overflow:hidden; background:var(--card); border:1px solid var(--border); box-shadow:var(--sh-lg)}
.lp-window-bar{display:flex; align-items:center; gap:14px; padding:12px 16px; background:#F1F5F9; border-bottom:1px solid var(--border)}
.lp-window-dots{display:inline-flex; gap:8px; flex-shrink:0} .lp-window-dots i{width:12px; height:12px; border-radius:50%; background:#CBD5E1} .lp-window-dots i:first-child{background:#F87171} .lp-window-dots i:nth-child(2){background:#FBBF24} .lp-window-dots i:nth-child(3){background:var(--safe)}
.lp-window-url{display:inline-flex; align-items:center; gap:8px; max-width:340px; width:100%; margin:0 auto; font-size:13px; color:var(--muted); background:#fff; border:1px solid var(--border); border-radius:8px; padding:7px 14px; justify-content:center; font-variant-numeric:tabular-nums}
.lp-window-spacer{width:44px; flex-shrink:0}
.lp-window-wide{max-width:960px; margin:48px auto 0}
.lp-window-screen{background:var(--bg); font-size:0}

/* real captured screenshots fill their frames */
.lp-shot{display:block; width:100%; height:auto}

/* trust score */
.lp-trustgrid{margin-top:46px; display:grid; grid-template-columns:.82fr 1.18fr; gap:32px; align-items:center}
.lp-trustdial{background:var(--card); border:1px solid var(--border); border-radius:var(--r-card); box-shadow:var(--sh); padding:32px 28px; display:flex; flex-direction:column; align-items:center; text-align:center}
.lp-dial{position:relative; width:172px; height:172px; border-radius:50%; display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:conic-gradient(var(--safe) 0 87%, var(--line-2) 87% 100%)}
.lp-dial::before{content:""; position:absolute; inset:14px; border-radius:50%; background:var(--card)}
.lp-dial-num{position:relative; font-size:52px; font-weight:800; line-height:1; letter-spacing:-.03em; color:var(--ink)}
.lp-dial-of{position:relative; margin-top:4px; font-size:14px; font-weight:600; color:var(--faint)}
.lp-dial-verdict{margin-top:20px; display:inline-flex; align-items:center; gap:8px; font-size:14.5px; font-weight:600; color:var(--safe-2); background:var(--safe-tint); border:1px solid #C7F0DE; padding:7px 14px; border-radius:999px}
.lp-dial-dot{width:8px; height:8px; border-radius:50%; background:var(--safe)}
.lp-dial-bands{margin-top:20px; display:flex; flex-direction:column; gap:8px; font-size:13px; color:var(--muted); text-align:left}
.lp-dial-bands span{display:inline-flex; align-items:center; gap:9px}
.lp-dial-bands i{width:9px; height:9px; border-radius:2px; flex-shrink:0}
.lp-trustfactors{list-style:none; margin:0; padding:0; display:grid; grid-template-columns:1fr 1fr; gap:16px}
.lp-trustfactor{display:flex; gap:14px; background:var(--card); border:1px solid var(--border); border-radius:16px; box-shadow:var(--sh-sm); padding:18px; transition:transform .24s var(--ease), box-shadow .24s var(--ease)}
.lp-trustfactor:hover{transform:translateY(-4px); box-shadow:var(--sh)}
.lp-trustfactor h3{font-size:16px; font-weight:600; letter-spacing:-.01em}
.lp-trustfactor p{margin-top:6px; font-size:14px; color:var(--muted); line-height:1.55}

/* safety */
.lp-safety{position:relative;
  background:
    linear-gradient(180deg, rgba(15,23,42,.90) 0%, rgba(15,23,42,.94) 100%),
    url("/images/money.jpg") center 30% / cover no-repeat,
    var(--navy);
  color:#fff}
.lp-safety-h{color:#fff} .lp-safety-p{color:#9FB0C7}
.lp-features{margin-top:46px; display:grid; grid-template-columns:1fr 1fr; gap:16px}
.lp-feature{display:flex; gap:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); border-radius:16px; padding:18px; transition:transform .24s var(--ease), background .24s var(--ease), border-color .24s var(--ease)}
.lp-feature:hover{transform:translateY(-4px); background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.16)}
.lp-featicon{width:40px; height:40px; border-radius:11px; background:rgba(5,150,105,.14); display:flex; align-items:center; justify-content:center; flex-shrink:0}
.lp-feature h3{font-size:16px; font-weight:600}
.lp-feature p{margin-top:6px; font-size:14px; color:#9FB0C7; line-height:1.55}

/* faq */
.lp-faqwrap{max-width:760px}
.lp-faq{margin-top:40px; display:flex; flex-direction:column; gap:12px}
.lp-faqitem{background:var(--card); border:1px solid var(--border); border-radius:14px; box-shadow:var(--sh-sm); overflow:hidden; transition:border-color .2s var(--ease), box-shadow .2s var(--ease)}
.lp-faqitem:hover{border-color:#CFEEDD; box-shadow:var(--sh)}
.lp-faqitem summary{list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; font-size:16px; font-weight:600}
.lp-faqitem summary::-webkit-details-marker{display:none}
.lp-faqchev{transition:transform .2s var(--ease); display:inline-flex}
.lp-faqitem[open] .lp-faqchev{transform:rotate(180deg)}
.lp-faqitem p{padding:0 20px 18px; font-size:15px; color:var(--muted); line-height:1.6}

/* final cta */
.lp-cta{padding:24px 0 84px}
.lp-ctacard{text-align:center; position:relative; overflow:hidden;
  background:
    linear-gradient(160deg, rgba(15,23,42,.86) 0%, rgba(20,35,63,.90) 100%),
    url("/images/commerce.jpg") center / cover no-repeat,
    #0F172A;
  border-radius:24px; padding:56px 32px; box-shadow:var(--sh-lg)}
.lp-ctacard h2{font-size:34px; letter-spacing:-.03em; font-weight:700; color:#fff}
.lp-ctacard p{margin:14px auto 26px; font-size:17px; color:#9FB0C7; max-width:46ch; line-height:1.6}

/* footer */
.lp-footer{border-top:1px solid var(--border); padding:32px 0}
.lp-footrow{display:flex; flex-direction:column; align-items:flex-start; gap:16px}
.lp-footnote{font-size:13.5px; color:var(--muted)}
.lp-footlinks{display:flex; gap:20px; font-size:13.5px; font-weight:600} .lp-footlinks a{color:var(--ink-2)} .lp-footlinks a:hover{color:var(--safe)}

/* responsive */
@media (max-width:900px){
  .lp-herocenter{grid-template-columns:1fr; gap:40px; justify-items:center; text-align:center}
  .lp-herocopy h1{font-size:42px}
  .lp-herosub{margin-left:auto; margin-right:auto}
  .lp-herobtns{justify-content:center}
  .lp-livecount{justify-content:center}
  .lp-window-wide{margin-top:36px}
  .lp-features{grid-template-columns:1fr}
  .lp-flow{grid-template-columns:1fr 1fr} .lp-flowline{display:none}
  .lp-trustgrid{grid-template-columns:1fr; gap:28px; max-width:520px; margin-left:auto; margin-right:auto}
  .lp-navlinks{display:none}
}
@media (max-width:560px){
  .lp-hero{padding:44px 0 24px}
  .lp-herocopy h1{font-size:34px}
  .lp-herosub{font-size:16px}
  .lp-herovis{margin-top:40px}
  .lp-band{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding:18px 14px}
  .lp-band span{flex-direction:column; align-items:center; text-align:center; gap:7px; font-size:11.5px; line-height:1.25}
  .lp-flow{grid-template-columns:1fr}
  .lp-trustfactors{grid-template-columns:1fr}
  .lp-head h2,.lp-ctacard h2{font-size:28px}
  .lp-navcta{gap:12px} .lp-navcta .lp-link-sell{display:none}
  .lp-window-url{max-width:none} .lp-window-spacer{display:none}
  .lp-ctacard{padding:40px 22px}
}
`;
