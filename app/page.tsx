"use client";

/* ==========================================================================
   Landing page — the product's marketing front door.

   New visual language (a full departure from the in-app dark/pink):
   a premium "trust fintech" look grounded in the ui-ux-pro-max fintech data.
   Light canvas, navy ink (#0F172A), emerald for the "money held safe" story,
   gold used sparingly as a premium seal, IBM Plex Sans throughout, soft
   elevation and generous whitespace.

   Self-contained: all styling lives in the scoped <style> below (prefixed .lp)
   so it doesn't disturb the app screens, which get torn down separately.
   ========================================================================== */

import Link from "next/link";
import { useEffect } from "react";

/* Brand mark — a shield with a check, in the new navy/emerald palette. */
function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#0F172A" />
      <path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="url(#mg)" fillOpacity="0.18" />
      <path d="M11 16.2 14.6 20 21.5 12.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="mg" x1="5" y1="2" x2="27" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Small inline icons (no emoji as icons — consistent 1.8 stroke). */
const I = {
  handshake: "M8 11 5.5 8.5a2 2 0 0 1 2.8-2.8L12 9l3.7-3.3a2 2 0 0 1 2.8 2.8L16 11m-8 0 2.5 2.5a2 2 0 0 0 2.8 0L16 11m-8 0 4 4 4-4",
  lock: "M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
  ship: "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6",
  check: "M20 6 9 17l-5-5",
  scan: "M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M7 12h10",
  shield: "M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z",
  bank: "M4 10h16M5 10 12 4l7 6M6 10v8m4-8v8m4-8v8m4-8v8M3 21h18",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
};
function Icon({ d, color = "#0F172A", size = 22 }: { d: string; color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Landing() {
  // Tasteful scroll reveal — opacity/transform only, disabled for reduced motion.
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".lp-reveal"));
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

  return (
    <div className="lp">
      <style>{css}</style>

      {/* ---- Nav ---- */}
      <header className="lp-nav">
        <div className="lp-wrap lp-navrow">
          <a className="lp-brand" href="#top" aria-label="TrustFlow home">
            <Mark />
            <span>TrustFlow</span>
          </a>
          <nav className="lp-navlinks" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#safety">Safety</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="lp-navcta">
            <Link href="/login" className="lp-link">Log in</Link>
            <Link href="/login" className="lp-btn lp-btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="lp-hero" id="top">
        <div className="lp-wrap lp-herogrid">
          <div className="lp-herocopy lp-reveal">
            <span className="lp-eyebrow"><span className="lp-dot" />AI escrow for peer-to-peer trades</span>
            <h1>Buy and sell with strangers. Keep your money safe.</h1>
            <p className="lp-sub">
              TrustFlow holds the money until you confirm you got what you paid for. Our AI reads the
              chat for scam signals before you send a naira, and no fake receipt ever gets past us.
            </p>
            <div className="lp-herobtns">
              <Link href="/login" className="lp-btn lp-btn-primary lp-btn-lg">Start a protected deal</Link>
              <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">See how it works</a>
            </div>
            <div className="lp-trustrow">
              <span><Icon d={I.lock} color="#059669" size={16} /> Money held in escrow</span>
              <span><Icon d={I.scan} color="#059669" size={16} /> AI scam checks</span>
              <span><Icon d={I.bank} color="#059669" size={16} /> Bank-verified payments</span>
            </div>
          </div>

          {/* Hero visual: an escrow status card */}
          <div className="lp-herovis lp-reveal">
            <div className="lp-card lp-escrow">
              <div className="lp-escrow-top">
                <span className="lp-badge lp-badge-safe"><Icon d={I.shield} color="#059669" size={14} /> In escrow</span>
                <span className="lp-escrow-id">TF-4821</span>
              </div>
              <div className="lp-escrow-amt">₦450,000</div>
              <div className="lp-escrow-label">held safely until you confirm delivery</div>
              <div className="lp-escrow-steps">
                <div className="lp-step done"><span className="lp-tick"><Icon d={I.check} color="#fff" size={12} /></span>Buyer paid into escrow</div>
                <div className="lp-step done"><span className="lp-tick"><Icon d={I.check} color="#fff" size={12} /></span>Seller shipped the item</div>
                <div className="lp-step now"><span className="lp-tick lp-tick-now" />Waiting for you to confirm</div>
              </div>
              <div className="lp-escrow-cta">Confirm &amp; release</div>
            </div>
            <div className="lp-floatchip lp-chip1"><Icon d={I.scan} color="#A16207" size={16} /> No scam signals found</div>
            <div className="lp-floatchip lp-chip2"><Icon d={I.bank} color="#1E3A8A" size={16} /> Payment verified at the bank</div>
          </div>
        </div>
      </section>

      {/* ---- Stat strip ---- */}
      <section className="lp-wrap lp-stats lp-reveal">
        <div className="lp-stat"><strong>Zero</strong><span>fake receipts. We confirm real, arrived money.</span></div>
        <div className="lp-stat"><strong>AI-read</strong><span>chats, scored for scam tactics before you pay.</span></div>
        <div className="lp-stat"><strong>Held, not sent</strong><span>the seller is only paid when you say so.</span></div>
      </section>

      {/* ---- How it works ---- */}
      <section className="lp-section" id="how">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <h2>Four steps. No trust required.</h2>
            <p>The escrow does the trusting for you, so a deal with a stranger works like a deal with a friend.</p>
          </div>
          <div className="lp-steps4">
            {[
              { n: "1", d: I.handshake, t: "Agree the deal", b: "Enter the item, the price, and the seller's phone, email or @username." },
              { n: "2", d: I.lock, t: "Pay into escrow", b: "Your money is held safe. The seller can see it's there, but can't touch it yet." },
              { n: "3", d: I.ship, t: "Seller ships", b: "They send the item knowing the money is real and waiting for them." },
              { n: "4", d: I.check, t: "You confirm", b: "Got what you paid for? Release the money. Something wrong? Open a dispute." },
            ].map((s, i) => (
              <div className="lp-card lp-stepcard lp-reveal" key={s.n} style={{ transitionDelay: `${i * 60}ms` }}>
                <div className="lp-stepnum">{s.n}</div>
                <div className="lp-stepicon"><Icon d={s.d} color="#0F172A" size={22} /></div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Safety ---- */}
      <section className="lp-section lp-safety" id="safety">
        <div className="lp-wrap lp-safetygrid">
          <div className="lp-head lp-left lp-reveal">
            <span className="lp-eyebrow lp-eyebrow-dark"><span className="lp-dot" />Built to stop the common scams</span>
            <h2>Safety that works before the money moves.</h2>
            <p>Most peer-to-peer fraud happens in the gap between "send me the money" and "where's my item?" TrustFlow closes that gap.</p>
          </div>
          <div className="lp-features">
            {[
              { d: I.scan, t: "AI scam detection", b: "Paste the chat and our AI flags pressure tactics, off-platform tricks and fake urgency before you pay." },
              { d: I.bank, t: "No fake receipts", b: "We confirm money at the bank, not from a screenshot. A doctored receipt gets you nowhere here." },
              { d: I.shield, t: "Verified sellers", b: "Payouts only reach identity-verified accounts, so the person getting paid is real." },
              { d: I.bolt, t: "Fair dispute resolution", b: "If a deal goes wrong, an AI judge weighs the evidence and the money is released or refunded accordingly." },
            ].map((f, i) => (
              <div className="lp-feature lp-reveal" key={f.t} style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="lp-featicon"><Icon d={f.d} color="#059669" size={20} /></div>
                <div>
                  <h3>{f.t}</h3>
                  <p>{f.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="lp-section" id="faq">
        <div className="lp-wrap lp-faqwrap">
          <div className="lp-head lp-reveal">
            <h2>Questions, answered plainly.</h2>
          </div>
          <div className="lp-faq">
            {[
              { q: "Is my money actually safe?", a: "Yes. Once you pay, the money sits in escrow. The seller cannot withdraw it. It only moves when you confirm delivery, or when a dispute is resolved." },
              { q: "What if the seller never ships?", a: "You open a dispute. If the item never arrives, the money is refunded to you. The seller is only paid for a deal they actually completed." },
              { q: "Do I need a Wema account?", a: "No. You can pay from any bank. We detect the transfer automatically. No receipt to upload, no screenshot to send." },
              { q: "What does it cost?", a: "You set up a protected deal for free. Escrow fees apply only when a deal completes, so trying it costs you nothing." },
            ].map((f) => (
              <details className="lp-faqitem lp-reveal" key={f.q}>
                <summary>{f.q}<span className="lp-faqchev" aria-hidden="true"><Icon d="M6 9l6 6 6-6" color="#64748B" size={18} /></span></summary>
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
          <p>Set up your first escrow in under a minute. No password to remember, no bank details until a payout is due.</p>
          <Link href="/login" className="lp-btn lp-btn-safe lp-btn-lg">Get started free</Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footrow">
          <a className="lp-brand" href="#top" aria-label="TrustFlow home"><Mark size={26} /><span>TrustFlow</span></a>
          <p className="lp-footnote">AI-powered escrow for peer-to-peer trades. Built for Wema Hackaholics 7.0.</p>
        </div>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
.lp *{box-sizing:border-box}
.lp{
  --ink:#0F172A; --ink-2:#334155; --muted:#64748B;
  --bg:#F8FAFC; --card:#FFFFFF; --border:#E6EAF0;
  --safe:#059669; --safe-2:#10B981; --safe-tint:#ECFDF5;
  --navy:#0F172A; --blue:#1E3A8A; --gold:#A16207;
  --ease:cubic-bezier(.22,1,.36,1);
  --shadow-sm:0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04);
  --shadow:0 12px 30px -14px rgba(15,23,42,.22), 0 4px 10px -6px rgba(15,23,42,.08);
  --shadow-lg:0 30px 60px -24px rgba(15,23,42,.30), 0 10px 24px -14px rgba(15,23,42,.12);
  font-family:"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color:var(--ink); background:var(--bg); min-height:100dvh;
  -webkit-font-smoothing:antialiased; line-height:1.5;
}
.lp a:not(.lp-btn){color:inherit}
.lp a{text-decoration:none}
.lp-wrap{width:100%; max-width:1120px; margin:0 auto; padding:0 24px}

/* reveal */
.lp-reveal{opacity:0; transform:translateY(14px); transition:opacity .6s var(--ease), transform .6s var(--ease)}
.lp-reveal.lp-in{opacity:1; transform:none}
@media (prefers-reduced-motion:reduce){.lp-reveal{opacity:1; transform:none; transition:none}}

/* nav */
.lp-nav{position:sticky; top:0; z-index:40; background:rgba(248,250,252,.82); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border)}
.lp-navrow{display:flex; align-items:center; gap:24px; height:64px}
.lp-brand{display:inline-flex; align-items:center; gap:10px; font-weight:700; font-size:18px; letter-spacing:-.02em}
.lp-navlinks{display:flex; gap:26px; margin-left:8px; font-size:14.5px; font-weight:500; color:var(--ink-2)}
.lp-navlinks a:hover{color:var(--ink)}
.lp-navcta{margin-left:auto; display:flex; align-items:center; gap:14px}
.lp-link{font-size:14.5px; font-weight:600; color:var(--ink-2)}
.lp-link:hover{color:var(--ink)}

/* buttons */
.lp-btn{display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 18px; border-radius:11px; font-weight:600; font-size:14.5px; cursor:pointer; transition:transform .12s var(--ease), box-shadow .18s var(--ease), background .18s var(--ease); border:1px solid transparent; white-space:nowrap}
.lp-btn-lg{height:52px; padding:0 24px; font-size:16px; border-radius:13px}
.lp-btn-primary{background:var(--navy); color:#fff; box-shadow:0 8px 20px -10px rgba(15,23,42,.5)}
.lp-btn-primary:hover{transform:translateY(-1px); box-shadow:0 12px 26px -10px rgba(15,23,42,.55)}
.lp-btn-safe{background:var(--safe); color:#fff; box-shadow:0 10px 24px -10px rgba(5,150,105,.6)}
.lp-btn-safe:hover{transform:translateY(-1px); box-shadow:0 14px 30px -10px rgba(5,150,105,.65)}
.lp-btn-ghost{background:#fff; color:var(--ink); border-color:var(--border); box-shadow:var(--shadow-sm)}
.lp-btn-ghost:hover{transform:translateY(-1px); border-color:#cbd5e1}
.lp-btn:focus-visible{outline:2px solid var(--safe); outline-offset:2px}

/* eyebrow */
.lp-eyebrow{display:inline-flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:var(--safe); background:var(--safe-tint); border:1px solid #C7F0DE; padding:6px 12px; border-radius:999px}
.lp-eyebrow-dark{color:var(--ink-2); background:#fff; border-color:var(--border)}
.lp-dot{width:7px; height:7px; border-radius:50%; background:var(--safe-2); box-shadow:0 0 0 3px rgba(16,185,129,.18)}

/* hero */
.lp-hero{padding:72px 0 40px; background:radial-gradient(120% 80% at 85% -10%, #EEF4FF 0%, rgba(238,244,255,0) 55%), radial-gradient(90% 60% at 0% 0%, #ECFDF5 0%, rgba(236,253,245,0) 50%)}
.lp-herogrid{display:grid; grid-template-columns:1.05fr .95fr; gap:56px; align-items:center}
.lp-herocopy h1{margin:18px 0 0; font-size:52px; line-height:1.05; letter-spacing:-.035em; font-weight:700}
.lp-sub{margin-top:20px; font-size:18px; line-height:1.6; color:var(--muted); max-width:34ch}
.lp-herobtns{margin-top:28px; display:flex; gap:12px; flex-wrap:wrap}
.lp-trustrow{margin-top:26px; display:flex; gap:20px; flex-wrap:wrap; color:var(--ink-2); font-size:13.5px; font-weight:500}
.lp-trustrow span{display:inline-flex; align-items:center; gap:7px}

/* hero visual */
.lp-herovis{position:relative}
.lp-card{background:var(--card); border:1px solid var(--border); border-radius:20px; box-shadow:var(--shadow)}
.lp-escrow{padding:22px; box-shadow:var(--shadow-lg); position:relative; z-index:2}
.lp-escrow-top{display:flex; align-items:center; justify-content:space-between}
.lp-badge{display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; padding:6px 11px; border-radius:999px}
.lp-badge-safe{color:var(--safe); background:var(--safe-tint); border:1px solid #C7F0DE}
.lp-escrow-id{font-size:12.5px; color:var(--muted); font-variant-numeric:tabular-nums; font-weight:500}
.lp-escrow-amt{margin-top:18px; font-size:44px; font-weight:700; letter-spacing:-.03em; font-variant-numeric:tabular-nums}
.lp-escrow-label{margin-top:2px; font-size:14px; color:var(--muted)}
.lp-escrow-steps{margin-top:20px; display:flex; flex-direction:column; gap:12px}
.lp-step{display:flex; align-items:center; gap:11px; font-size:14px; font-weight:500; color:var(--ink-2)}
.lp-tick{width:20px; height:20px; border-radius:50%; background:var(--safe); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0}
.lp-tick-now{background:transparent; border:2px solid var(--gold); box-shadow:0 0 0 3px rgba(161,98,7,.14)}
.lp-step.now{color:var(--ink); font-weight:600}
.lp-escrow-cta{margin-top:22px; height:48px; border-radius:12px; background:var(--navy); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:15px}
.lp-floatchip{position:absolute; display:inline-flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--border); box-shadow:var(--shadow); border-radius:12px; padding:10px 13px; font-size:13px; font-weight:600; z-index:3}
.lp-chip1{top:-18px; left:-22px}
.lp-chip2{bottom:-20px; right:-16px}

/* stats */
.lp-stats{display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:36px; margin-bottom:8px; padding-top:36px; padding-bottom:12px; border-top:1px solid var(--border)}
.lp-stat strong{display:block; font-size:22px; font-weight:700; letter-spacing:-.02em; color:var(--navy)}
.lp-stat span{display:block; margin-top:4px; font-size:14.5px; color:var(--muted); line-height:1.5}

/* sections */
.lp-section{padding:72px 0}
.lp-head{max-width:640px; margin:0 auto; text-align:center}
.lp-head.lp-left{margin:0; text-align:left}
.lp-head h2{font-size:36px; line-height:1.1; letter-spacing:-.03em; font-weight:700}
.lp-head p{margin-top:14px; font-size:17px; color:var(--muted); line-height:1.6}

/* how steps */
.lp-steps4{margin-top:44px; display:grid; grid-template-columns:repeat(4,1fr); gap:18px}
.lp-stepcard{padding:24px 20px; position:relative}
.lp-stepnum{position:absolute; top:20px; right:20px; font-size:13px; font-weight:700; color:#CBD5E1; font-variant-numeric:tabular-nums}
.lp-stepicon{width:44px; height:44px; border-radius:12px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center}
.lp-stepcard h3{margin-top:16px; font-size:17px; font-weight:600; letter-spacing:-.01em}
.lp-stepcard p{margin-top:8px; font-size:14.5px; color:var(--muted); line-height:1.55}

/* safety */
.lp-safety{background:var(--navy); color:#fff}
.lp-safety .lp-head h2{color:#fff}
.lp-safety .lp-head p{color:#9FB0C7}
.lp-safety .lp-eyebrow-dark{background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.14); color:#CBD5E1}
.lp-safetygrid{display:grid; grid-template-columns:.9fr 1.1fr; gap:56px; align-items:start}
.lp-features{display:grid; grid-template-columns:1fr 1fr; gap:16px}
.lp-feature{display:flex; gap:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); border-radius:16px; padding:18px}
.lp-featicon{width:40px; height:40px; border-radius:11px; background:rgba(16,185,129,.14); display:flex; align-items:center; justify-content:center; flex-shrink:0}
.lp-feature h3{font-size:16px; font-weight:600}
.lp-feature p{margin-top:6px; font-size:14px; color:#9FB0C7; line-height:1.55}

/* faq */
.lp-faqwrap{max-width:760px}
.lp-faq{margin-top:36px; display:flex; flex-direction:column; gap:12px}
.lp-faqitem{background:var(--card); border:1px solid var(--border); border-radius:14px; box-shadow:var(--shadow-sm); overflow:hidden}
.lp-faqitem summary{list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; font-size:16px; font-weight:600}
.lp-faqitem summary::-webkit-details-marker{display:none}
.lp-faqchev{transition:transform .2s var(--ease); display:inline-flex}
.lp-faqitem[open] .lp-faqchev{transform:rotate(180deg)}
.lp-faqitem p{padding:0 20px 18px; font-size:15px; color:var(--muted); line-height:1.6}

/* final cta */
.lp-cta{padding:24px 0 80px}
.lp-ctacard{text-align:center; background:linear-gradient(160deg, #0F172A 0%, #14233F 100%); border-radius:24px; padding:56px 32px; box-shadow:var(--shadow-lg)}
.lp-ctacard h2{font-size:34px; letter-spacing:-.03em; font-weight:700; color:#fff}
.lp-ctacard p{margin:14px auto 26px; font-size:17px; color:#9FB0C7; max-width:46ch; line-height:1.6}

/* footer */
.lp-footer{border-top:1px solid var(--border); padding:32px 0}
.lp-footrow{display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap}
.lp-footnote{font-size:13.5px; color:var(--muted)}

/* responsive */
@media (max-width:900px){
  .lp-herogrid{grid-template-columns:1fr; gap:44px}
  .lp-herocopy h1{font-size:40px}
  .lp-sub{max-width:none}
  .lp-safetygrid{grid-template-columns:1fr; gap:32px}
  .lp-steps4{grid-template-columns:1fr 1fr}
  .lp-navlinks{display:none}
  .lp-chip1{left:0} .lp-chip2{right:0}
}
@media (max-width:560px){
  .lp-hero{padding:48px 0 24px}
  .lp-herocopy h1{font-size:33px}
  .lp-stats{grid-template-columns:1fr; gap:14px}
  .lp-steps4{grid-template-columns:1fr}
  .lp-features{grid-template-columns:1fr}
  .lp-head h2,.lp-ctacard h2{font-size:28px}
  .lp-navcta .lp-link{display:none}
  .lp-floatchip{display:none}
  .lp-ctacard{padding:40px 22px}
}
`;
