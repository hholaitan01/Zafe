"use client";

/* ==========================================================================
   Landing page — implements the Claude Design "TrustFlow" export.

   Language: warm cream "paper" canvas (#F6F3EC), deep navy ink (#0A1F3D),
   verify-green + Naira-green accents, Inter display type, and Geist Mono for
   all technical/numeric data (transaction IDs, amounts, timers, trust scores).
   The signature is the navy live-transaction card with monospace details.

   Self-contained (scoped .tf styles) so it stands on its own; the in-app
   screens migrate to these tokens in following passes. CTAs route to /login.
   ========================================================================== */

import Link from "next/link";
import { useEffect } from "react";

function Mark({ size = 30 }: { size?: number }) {
  return (
    <span className="tf-logo" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" fill="none" stroke="#00B86B" strokeWidth="1.7" />
        <path d="M9 12.2 11.2 14.5 15.4 9.6" stroke="#00B86B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
function Icon({ d, s = 20, c = "#0A1F3D", w = 1.7 }: { d: string; s?: number; c?: string; w?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const P = {
  shield: "M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z",
  play: "M8 5v14l11-7z",
  vault: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm11 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  scan: "M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M7 12h10",
  hand: "M3 12h4l2 3 4-8 2 5h6",
};

export default function Landing() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".tf-reveal"));
    if (reduce || !("IntersectionObserver" in window)) return els.forEach((el) => el.classList.add("tf-in"));
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("tf-in"), io.unobserve(e.target))),
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="tf">
      <style>{css}</style>

      {/* nav */}
      <header className="tf-nav">
        <div className="tf-wrap tf-navrow">
          <a className="tf-brand" href="#top"><Mark /><span>TrustFlow</span></a>
          <nav className="tf-navlinks" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#problem">For sellers</a>
            <a href="#problem">Pricing</a>
            <a href="#how">Help</a>
          </nav>
          <div className="tf-navcta">
            <Link href="/login" className="tf-link">Sign in</Link>
            <Link href="/login" className="tf-btn tf-btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="tf-hero" id="top">
        <div className="tf-wrap tf-herogrid">
          <div className="tf-herocopy tf-reveal">
            <div className="tf-eyebrow">Escrow for P2P commerce in Nigeria</div>
            <h1>Send money. Receive your goods. Or get every Naira back.</h1>
            <p className="tf-sub">
              Nigeria moves $48.2 million a day in P2P crypto with escrow protection. TrustFlow brings the
              same protection to laptops on WhatsApp, restocks on Telegram, and phones on Instagram.
            </p>
            <div className="tf-herobtns">
              <Link href="/login" className="tf-btn tf-btn-primary tf-btn-lg"><Icon d={P.shield} s={17} c="#fff" w={1.9} />Protect a transaction</Link>
              <a href="#how" className="tf-btn tf-btn-quiet tf-btn-lg"><Icon d={P.play} s={16} c="#0A1F3D" w={1.6} />See how it works</a>
            </div>
            <div className="tf-caption">Built on Squad payment rails · Sandbox mode active</div>
          </div>

          {/* live transaction card (navy + mono) */}
          <div className="tf-txncard tf-reveal">
            <div className="tf-txn-top"><span>LIVE TRANSACTION</span><span>TF_9X4K2P7N3W</span></div>
            <div className="tf-txn-label">HELD IN ESCROW</div>
            <div className="tf-txn-amt">₦150,000</div>
            <div className="tf-txn-rows">
              <div><span>Item</span><span>MacBook Air M2</span></div>
              <div><span>Seller Trust Score</span><span>87 / 100 · LOW RISK</span></div>
              <div><span>Releases</span><span>On buyer confirm</span></div>
            </div>
            <div className="tf-txn-foot"><span className="tf-txn-pill"><i />FUNDED</span><span className="tf-txn-time">00:02:14 ago</span></div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="tf-band" id="how">
        <div className="tf-wrap">
          <div className="tf-kicker tf-reveal">How it works</div>
          <h2 className="tf-h2 tf-reveal">Three steps. Money stays put until both sides are happy.</h2>
          <div className="tf-steps">
            {[
              { n: "01", d: P.vault, t: "Buyer pays into escrow", b: "Money goes into a Squad-powered virtual account. Not to the seller, yet. Card, bank transfer, or USSD." },
              { n: "02", d: P.scan, t: "AI generates a Trust Score", b: "Before the seller ships, TrustFlow reads transaction history, chat context, and account age. Outputs a 0–100 score with plain-language reasoning." },
              { n: "03", d: P.hand, t: "Buyer confirms, seller is paid", b: "Funds release the moment the buyer taps Confirm. If something goes wrong, the AI mediates the dispute with the evidence on file." },
            ].map((s, i) => (
              <div className="tf-step tf-reveal" key={s.n} style={{ transitionDelay: `${i * 70}ms` }}>
                <div className="tf-step-n">STEP {s.n}</div>
                <div className="tf-step-ic"><Icon d={s.d} s={22} c="#0A1F3D" w={1.7} /></div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* the problem */}
      <section className="tf-section" id="problem">
        <div className="tf-wrap tf-problemgrid">
          <div className="tf-reveal">
            <div className="tf-kicker">The problem</div>
            <blockquote className="tf-quote">“The buyer sends money. The seller blocks them on WhatsApp. Money is gone. No recourse.”</blockquote>
            <p className="tf-sub tf-sub-tight">
              22 million Nigerians hold crypto, mostly under 30, because P2P trust infrastructure works. For
              physical goods on Instagram, Telegram, and WhatsApp, that infrastructure does not exist.
              TrustFlow is that infrastructure.
            </p>
          </div>
          <div className="tf-compare tf-reveal">
            {[
              { k: "Bank transfers", v: "Irreversible. Once sent, no protection." },
              { k: "Pay-on-delivery", v: "Only Jumia / Konga. Not WhatsApp sellers." },
              { k: "Manual escrow", v: "Your friend can't mediate 100 transactions." },
              { k: "Squad / Paystack alone", v: "Move money, don't assess risk." },
            ].map((r) => (
              <div className="tf-crow" key={r.k}><span className="tf-ck">{r.k}</span><span className="tf-cv">{r.v}</span></div>
            ))}
            <div className="tf-crow tf-crow-win"><span className="tf-ck">TrustFlow</span><span className="tf-cv">Escrow + Trust Score + AI dispute resolution.</span></div>
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="tf-cta">
        <div className="tf-wrap tf-ctacard tf-reveal">
          <h2>Protect your next deal.</h2>
          <p>Set up an escrow in under a minute. No password to remember, no bank details until a payout is due.</p>
          <Link href="/login" className="tf-btn tf-btn-verify tf-btn-lg">Get started free</Link>
          <div className="tf-caption tf-caption-center">Sandbox mode active · No real money moves yet</div>
        </div>
      </section>

      <footer className="tf-footer">
        <div className="tf-wrap tf-footrow">
          <a className="tf-brand" href="#top"><Mark size={26} /><span>TrustFlow</span></a>
          <span className="tf-foot-note">AI-powered escrow for peer-to-peer trades. Built for Wema Hackaholics 7.0.</span>
        </div>
      </footer>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
.tf *{ box-sizing:border-box }
.tf{
  --ink:#0A1F3D; --ink-2:#2E4A7A; --ink-3:#4A6391; --ink-4:#7388B0; --ink-5:#A6B5D0;
  --paper:#F6F3EC; --paper-deep:#EDE8DC; --surface:#FFFFFF; --surface-sunken:#F8F6F1;
  --line:rgba(10,31,61,.10); --line-2:rgba(10,31,61,.16);
  --verify:#009659; --verify-2:#00B86B; --verify-50:#ECFAF2; --verify-100:#D6F4E4;
  --naira:#008751; --caution:#E89914; --risk:#D14343;
  --mono:'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --ease:cubic-bezier(0.22,0.61,0.36,1);
  --sh-2:0 1px 2px rgba(10,31,61,.04), 0 4px 12px rgba(10,31,61,.06);
  --sh-3:0 2px 4px rgba(10,31,61,.05), 0 12px 32px rgba(10,31,61,.10);
  font-family:'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  color:var(--ink); background:var(--paper); min-height:100dvh; line-height:1.45; -webkit-font-smoothing:antialiased;
}
.tf a{ text-decoration:none } .tf a:not(.tf-btn){ color:inherit }
.tf-wrap{ width:100%; max-width:1140px; margin:0 auto; padding:0 28px }
.tf-reveal{ opacity:0; transform:translateY(14px); transition:opacity .6s var(--ease), transform .6s var(--ease) }
.tf-reveal.tf-in{ opacity:1; transform:none }
@media (prefers-reduced-motion:reduce){ .tf-reveal{ opacity:1; transform:none; transition:none } }

/* nav */
.tf-nav{ position:sticky; top:0; z-index:40; background:rgba(246,243,236,.85); backdrop-filter:blur(12px); border-bottom:1px solid var(--line) }
.tf-navrow{ display:flex; align-items:center; gap:24px; height:64px }
.tf-brand{ display:inline-flex; align-items:center; gap:10px; font-weight:700; font-size:18px; letter-spacing:-.02em }
.tf-logo{ display:inline-flex; align-items:center; justify-content:center; background:var(--ink); border-radius:8px }
.tf-navlinks{ display:flex; gap:26px; margin-left:6px; font-size:14.5px; font-weight:500; color:var(--ink-3) }
.tf-navlinks a:hover{ color:var(--ink) }
.tf-navcta{ margin-left:auto; display:flex; align-items:center; gap:16px }
.tf-link{ font-size:14.5px; font-weight:600; color:var(--ink) }

/* buttons */
.tf-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 18px; border-radius:12px; font-family:inherit; font-weight:600; font-size:14.5px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), background .18s var(--ease), border-color .18s var(--ease), box-shadow .18s var(--ease); white-space:nowrap }
.tf-btn-lg{ height:52px; padding:0 22px; font-size:15.5px; border-radius:14px }
.tf-btn-primary{ background:var(--ink); color:#fff }
.tf-btn-primary:hover{ background:#06152A; transform:translateY(-2px) }
.tf-btn-verify{ background:var(--verify); color:#fff }
.tf-btn-verify:hover{ background:var(--verify-600, #007A48); transform:translateY(-2px); box-shadow:var(--sh-3) }
.tf-btn-quiet{ background:transparent; color:var(--ink) }
.tf-btn-quiet:hover{ background:rgba(10,31,61,.05) }
.tf-btn:focus-visible{ outline:none; box-shadow:0 0 0 4px rgba(0,184,107,.22) }

/* hero */
.tf-hero{ padding:76px 0 68px }
.tf-herogrid{ display:grid; grid-template-columns:1.15fr .85fr; gap:56px; align-items:center }
.tf-eyebrow{ font-family:var(--mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-4); font-weight:500 }
.tf-herocopy h1{ margin-top:20px; font-size:64px; line-height:1.02; letter-spacing:-.035em; font-weight:600; color:var(--ink) }
.tf-sub{ margin-top:24px; font-size:18px; line-height:1.6; color:var(--ink-3); max-width:36ch }
.tf-sub-tight{ margin-top:18px; max-width:44ch; font-size:16px }
.tf-herobtns{ margin-top:32px; display:flex; gap:14px; flex-wrap:wrap }
.tf-caption{ margin-top:24px; font-family:var(--mono); font-size:12.5px; color:var(--ink-4) }
.tf-caption-center{ margin-top:18px; text-align:center }

/* live transaction card */
.tf-txncard{ background:var(--ink); border-radius:20px; padding:26px 26px 22px; box-shadow:var(--sh-3); color:#fff }
.tf-txn-top{ display:flex; align-items:center; justify-content:space-between; font-family:var(--mono); font-size:11px; letter-spacing:.1em; color:rgba(255,255,255,.42) }
.tf-txn-label{ margin-top:20px; font-family:var(--mono); font-size:11px; letter-spacing:.12em; color:rgba(255,255,255,.5) }
.tf-txn-amt{ margin-top:4px; font-size:52px; font-weight:600; letter-spacing:-.03em; font-variant-numeric:tabular-nums }
.tf-txn-rows{ margin-top:22px; padding-top:18px; border-top:1px solid rgba(255,255,255,.12); display:flex; flex-direction:column; gap:13px }
.tf-txn-rows > div{ display:flex; justify-content:space-between; align-items:center; gap:12px }
.tf-txn-rows span:first-child{ font-size:13px; color:rgba(255,255,255,.55) }
.tf-txn-rows span:last-child{ font-family:var(--mono); font-size:13px; color:#fff }
.tf-txn-foot{ margin-top:22px; display:flex; align-items:center; justify-content:space-between }
.tf-txn-pill{ display:inline-flex; align-items:center; gap:7px; font-family:var(--mono); font-size:12px; font-weight:500; letter-spacing:.06em; color:#6EE7B7; background:rgba(0,184,107,.12); border:1px solid rgba(0,184,107,.28); padding:5px 11px; border-radius:999px }
.tf-txn-pill i{ width:6px; height:6px; border-radius:50%; background:#00B86B }
.tf-txn-time{ font-family:var(--mono); font-size:12px; color:rgba(255,255,255,.4) }

/* bands / headings */
.tf-band{ background:var(--paper-deep); padding:72px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line) }
.tf-section{ padding:76px 0 }
.tf-kicker{ font-family:var(--mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-4); font-weight:500 }
.tf-h2{ margin-top:16px; font-size:38px; line-height:1.12; letter-spacing:-.03em; font-weight:600; max-width:20ch }

/* steps */
.tf-steps{ margin-top:44px; display:grid; grid-template-columns:repeat(3,1fr); gap:20px }
.tf-step{ background:var(--surface); border:1px solid var(--line); border-radius:16px; padding:24px; box-shadow:var(--sh-2) }
.tf-step-n{ font-family:var(--mono); font-size:12px; letter-spacing:.08em; color:var(--verify) }
.tf-step-ic{ margin-top:16px; width:44px; height:44px; border-radius:12px; background:var(--verify-50); display:flex; align-items:center; justify-content:center }
.tf-step h3{ margin-top:16px; font-size:19px; font-weight:600; letter-spacing:-.01em }
.tf-step p{ margin-top:9px; font-size:14.5px; line-height:1.6; color:var(--ink-3) }

/* problem */
.tf-problemgrid{ display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:start }
.tf-quote{ margin-top:18px; font-size:30px; line-height:1.22; letter-spacing:-.02em; font-style:italic; font-weight:500; color:var(--ink) }
.tf-compare{ display:flex; flex-direction:column }
.tf-crow{ display:grid; grid-template-columns:.8fr 1.2fr; gap:20px; padding:16px 0; border-bottom:1px dashed var(--line-2); align-items:baseline }
.tf-ck{ font-size:14px; font-weight:600; color:var(--ink) }
.tf-cv{ font-size:14.5px; color:var(--ink-3); line-height:1.5 }
.tf-crow-win{ border-bottom:none } .tf-crow-win .tf-cv{ color:var(--verify); font-weight:600 }

/* final cta */
.tf-cta{ padding:20px 0 84px }
.tf-ctacard{ text-align:center; background:var(--ink); border-radius:24px; padding:60px 32px; box-shadow:var(--sh-3) }
.tf-ctacard h2{ font-size:36px; letter-spacing:-.03em; font-weight:600; color:#fff }
.tf-ctacard p{ margin:14px auto 26px; font-size:17px; color:rgba(255,255,255,.6); max-width:46ch; line-height:1.6 }
.tf-ctacard .tf-caption{ color:rgba(255,255,255,.4) }

/* footer */
.tf-footer{ border-top:1px solid var(--line); padding:30px 0 }
.tf-footrow{ display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap }
.tf-foot-note{ font-size:13px; color:var(--ink-4) }

/* responsive */
@media (max-width:920px){
  .tf-herogrid{ grid-template-columns:1fr; gap:44px }
  .tf-herocopy h1{ font-size:48px }
  .tf-sub{ max-width:none }
  .tf-problemgrid{ grid-template-columns:1fr; gap:32px }
  .tf-steps{ grid-template-columns:1fr }
  .tf-navlinks{ display:none }
}
@media (max-width:560px){
  .tf-hero{ padding:44px 0 40px }
  .tf-herocopy h1{ font-size:38px }
  .tf-h2{ font-size:28px } .tf-quote{ font-size:24px } .tf-ctacard h2{ font-size:28px }
  .tf-txn-amt{ font-size:42px }
  .tf-navcta .tf-link{ display:none }
  .tf-ctacard{ padding:44px 22px }
}
`;
