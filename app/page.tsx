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
import { useEffect } from "react";

function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#0F172A" />
      <path d="M11 16.2 14.6 20 21.5 12.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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
          <a className="lp-brand" href="#top" aria-label="TrustFlow home"><Mark /><span>TrustFlow</span></a>
          <nav className="lp-navlinks" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#ai">The AI</a>
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
            <span className="lp-eyebrow">AI escrow for peer-to-peer trades</span>
            <h1>Buy from strangers.<br />Keep your money safe.</h1>
            <p className="lp-sub">Your money stays locked until you confirm the item arrived. An AI checks the deal for scams before you pay.</p>
            <div className="lp-herobtns">
              <Link href="/login" className="lp-btn lp-btn-primary lp-btn-lg">Start a protected deal</Link>
              <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">See how it works</a>
            </div>
          </div>

          {/* Hero visual: the real escrow surface + the AI verdict that sets it apart */}
          <div className="lp-herovis lp-reveal">
            <div className="lp-card lp-escrow">
              <div className="lp-escrow-top">
                <span className="lp-badge"><Icon d={I.shield} color="#047857" size={14} />In escrow</span>
                <span className="lp-escrow-id">TF-4821</span>
              </div>
              <div className="lp-escrow-amt">₦450,000</div>
              <div className="lp-escrow-label">held safely until you confirm delivery</div>
              <div className="lp-escrow-steps">
                <div className="lp-step done"><span className="lp-tick"><Icon d={I.check} color="#fff" size={12} /></span>Buyer paid into escrow</div>
                <div className="lp-step done"><span className="lp-tick"><Icon d={I.check} color="#fff" size={12} /></span>Seller shipped the item</div>
                <div className="lp-step now"><span className="lp-tick lp-tick-now" />Waiting for you to confirm</div>
              </div>
              <div className="lp-escrow-cta">Confirm and release</div>
            </div>
            <div className="lp-verdict">
              <span className="lp-verdict-chip">AI</span>
              <div><div className="lp-verdict-t">No scam signals found</div><div className="lp-verdict-s">Trust Score 87 of 100</div></div>
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
            <div className="lp-flowline" aria-hidden="true" />
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
        <div className="lp-wrap lp-aigrid">
          <div className="lp-aicopy lp-reveal">
            <span className="lp-eyebrow">The part no other escrow has</span>
            <h2>An AI reads the deal before your money moves.</h2>
            <p>Most fraud happens in the chat, long before anyone pays. Paste the conversation and TrustFlow flags the pressure tactics, the off-platform tricks, and the fake urgency. If it is risky, you cannot pay until you have seen exactly why.</p>
            <div className="lp-ailist">
              <div><Icon d={I.check} color="#059669" size={17} />Names the specific scam tactic in the chat</div>
              <div><Icon d={I.check} color="#059669" size={17} />Scores the seller from their past deals</div>
              <div><Icon d={I.check} color="#059669" size={17} />Settles disputes fairly: pay, refund, or split</div>
            </div>
          </div>
          <div className="lp-aivis lp-reveal">
            <div className="lp-card lp-risk">
              <div className="lp-risk-head"><span className="lp-risk-chip">AI</span>Scam check</div>
              <div className="lp-chat">
                <div className="lp-msg lp-msg-them">Pay into my personal account first, then I ship. Last one left, someone else is asking. Send now.</div>
              </div>
              <div className="lp-risk-verdict">
                <div className="lp-risk-score">23<span>/100</span></div>
                <div className="lp-risk-flags">
                  <span className="lp-flag">High-pressure urgency</span>
                  <span className="lp-flag">Wants payment off escrow</span>
                  <span className="lp-flag">Unverified, brand new</span>
                </div>
              </div>
              <div className="lp-risk-foot">High risk. We would stop you here before you paid.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Safety ---- */}
      <section className="lp-section lp-safety" id="safety">
        <div className="lp-wrap">
          <div className="lp-head lp-reveal">
            <h2 className="lp-safety-h">Safety that works before the money moves.</h2>
            <p className="lp-safety-p">Peer-to-peer fraud lives in the gap between "send me the money" and "where is my item?" TrustFlow closes that gap on both sides.</p>
          </div>
          <div className="lp-features">
            {[
              { d: I.scan, t: "AI scam detection", b: "The chat is read for pressure tactics and off-platform tricks before you pay a naira." },
              { d: I.bank, t: "No fake receipts", b: "We confirm money at the bank, not from a screenshot. A doctored receipt gets you nowhere." },
              { d: I.shield, t: "Verified sellers", b: "Payouts only reach identity-verified accounts, so the person getting paid is real." },
              { d: I.scale, t: "Fair disputes", b: "If a deal goes wrong, an AI judge weighs the evidence and releases or refunds accordingly." },
            ].map((f, i) => (
              <div className="lp-feature lp-reveal" key={f.t} style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="lp-featicon"><Icon d={f.d} color="#10B981" size={20} /></div>
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
            {[
              { q: "Is my money actually safe?", a: "Yes. Once you pay, the money sits in escrow. The seller cannot withdraw it. It only moves when you confirm delivery, or when a dispute is resolved." },
              { q: "What if the seller never ships?", a: "You open a dispute. If the item never arrives, the money is refunded to you. The seller is only paid for a deal they actually completed." },
              { q: "Do I need a Wema account?", a: "No. You can pay from any bank. We detect the transfer automatically, so there is no receipt to upload and no screenshot to send." },
              { q: "What does it cost?", a: "Setting up a protected deal is free. Escrow fees apply only when a deal completes, so trying it costs you nothing." },
            ].map((f) => (
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
          <p>Set up your first escrow in under a minute. No password to remember, no bank details until a payout is due.</p>
          <Link href="/login" className="lp-btn lp-btn-safe lp-btn-lg">Start a protected deal<Icon d={I.arrow} color="#fff" size={18} /></Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footrow">
          <a className="lp-brand" href="#top" aria-label="TrustFlow home"><Mark size={24} /><span>TrustFlow</span></a>
          <p className="lp-footnote">AI-powered escrow for peer-to-peer trades. Money held safe until you confirm.</p>
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
  --navy:#0F172A; --safe:#059669; --safe-2:#10B981; --safe-tint:#ECFDF5; --danger:#DC2626;
  --ease:cubic-bezier(.22,1,.36,1);
  --sh-sm:0 1px 2px rgba(15,23,42,.06); --sh:0 12px 30px -14px rgba(15,23,42,.22);
  --sh-lg:0 30px 60px -24px rgba(15,23,42,.30);
  --r-card:20px; --r-btn:12px;
  font-family:"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color:var(--ink); background:var(--bg); min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5;
}
.lp a:not(.lp-btn){color:inherit} .lp a{text-decoration:none}
.lp-wrap{width:100%; max-width:1120px; margin:0 auto; padding:0 24px}

.lp-reveal{opacity:0; transform:translateY(14px); transition:opacity .6s var(--ease), transform .6s var(--ease)}
.lp-reveal.lp-in{opacity:1; transform:none}
@media (prefers-reduced-motion:reduce){.lp-reveal{opacity:1; transform:none; transition:none}}

/* nav */
.lp-nav{position:sticky; top:0; z-index:40; background:rgba(248,250,252,.82); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border)}
.lp-navrow{display:flex; align-items:center; gap:24px; height:66px}
.lp-brand{display:inline-flex; align-items:center; gap:10px; font-weight:700; font-size:18px; letter-spacing:-.02em}
.lp-navlinks{display:flex; gap:26px; margin-left:8px; font-size:14.5px; font-weight:500; color:var(--ink-2)}
.lp-navlinks a:hover{color:var(--ink)}
.lp-navcta{margin-left:auto; display:flex; align-items:center; gap:14px}
.lp-link{font-size:14.5px; font-weight:600; color:var(--ink-2)} .lp-link:hover{color:var(--ink)}

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
.lp-hero{padding:64px 0 40px; background:radial-gradient(90% 60% at 100% -10%, #EAF7F0 0%, rgba(234,247,240,0) 55%)}
.lp-herogrid{display:grid; grid-template-columns:1.12fr .88fr; gap:52px; align-items:center}
.lp-herocopy h1{margin:18px 0 0; font-size:42px; line-height:1.08; letter-spacing:-.03em; font-weight:700}
.lp-sub{margin-top:20px; font-size:18px; line-height:1.6; color:var(--muted); max-width:40ch}
.lp-herobtns{margin-top:28px; display:flex; gap:12px; flex-wrap:wrap}

/* hero visual */
.lp-herovis{position:relative}
.lp-card{background:var(--card); border:1px solid var(--border); border-radius:var(--r-card); box-shadow:var(--sh)}
.lp-escrow{padding:22px; box-shadow:var(--sh-lg); position:relative; z-index:2}
.lp-escrow-top{display:flex; align-items:center; justify-content:space-between}
.lp-badge{display:inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:600; padding:6px 11px; border-radius:999px; color:#047857; background:var(--safe-tint); border:1px solid #C7F0DE}
.lp-escrow-id{font-size:12.5px; color:var(--muted); font-variant-numeric:tabular-nums; font-weight:500; font-family:ui-monospace,Menlo,monospace}
.lp-escrow-amt{margin-top:18px; font-size:44px; font-weight:700; letter-spacing:-.03em; font-variant-numeric:tabular-nums}
.lp-escrow-label{margin-top:2px; font-size:14px; color:var(--muted)}
.lp-escrow-steps{margin-top:20px; display:flex; flex-direction:column; gap:12px}
.lp-step{display:flex; align-items:center; gap:11px; font-size:14px; font-weight:500; color:var(--ink-2)}
.lp-tick{width:20px; height:20px; border-radius:50%; background:var(--safe); display:inline-flex; align-items:center; justify-content:center; flex-shrink:0}
.lp-tick-now{background:transparent; border:2px solid var(--safe); box-shadow:0 0 0 3px rgba(5,150,105,.14)}
.lp-step.now{color:var(--ink); font-weight:600}
.lp-escrow-cta{margin-top:22px; height:48px; border-radius:var(--r-btn); background:var(--navy); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:15px}
.lp-verdict{position:absolute; bottom:-22px; left:-20px; display:inline-flex; align-items:center; gap:11px; background:#fff; border:1px solid var(--border); box-shadow:var(--sh); border-radius:14px; padding:11px 14px; z-index:3}
.lp-verdict-chip{background:var(--safe); color:#fff; font-size:11px; font-weight:700; letter-spacing:.06em; padding:3px 7px; border-radius:6px}
.lp-verdict-t{font-size:13.5px; font-weight:700}
.lp-verdict-s{font-size:12px; color:var(--muted); margin-top:1px; font-variant-numeric:tabular-nums}

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
.lp-flowcard{position:relative; z-index:1; background:var(--card); border:1px solid var(--border); border-radius:var(--r-card); box-shadow:var(--sh-sm); padding:24px 20px}
.lp-flownum{position:absolute; top:-14px; left:22px; width:28px; height:28px; border-radius:50%; background:var(--navy); color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700}
.lp-flowicon{width:44px; height:44px; border-radius:12px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; margin-top:8px}
.lp-flowcard h3{margin-top:16px; font-size:17px; font-weight:600; letter-spacing:-.01em}
.lp-flowcard p{margin-top:8px; font-size:14.5px; color:var(--muted); line-height:1.55}

/* AI in action */
.lp-aiwrap{background:linear-gradient(180deg,#fff, #F4F8FB)}
.lp-aigrid{display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center}
.lp-aicopy h2{margin-top:16px; font-size:33px; line-height:1.12; letter-spacing:-.03em; font-weight:700; max-width:18ch}
.lp-aicopy p{margin-top:16px; font-size:16.5px; color:var(--muted); line-height:1.65; max-width:52ch}
.lp-ailist{margin-top:22px; display:flex; flex-direction:column; gap:12px}
.lp-ailist div{display:flex; align-items:center; gap:10px; font-size:15px; font-weight:500; color:var(--ink-2)}
.lp-risk{padding:20px; box-shadow:var(--sh-lg); border-color:#F1D9D9}
.lp-risk-head{display:flex; align-items:center; gap:9px; font-size:14px; font-weight:700}
.lp-risk-chip{background:var(--danger); color:#fff; font-size:11px; font-weight:700; letter-spacing:.06em; padding:3px 7px; border-radius:6px}
.lp-chat{margin-top:14px}
.lp-msg{font-size:14px; line-height:1.5; padding:12px 14px; border-radius:14px; max-width:88%}
.lp-msg-them{background:#F1F5F9; color:var(--ink-2); border-bottom-left-radius:5px}
.lp-risk-verdict{margin-top:16px; display:flex; align-items:center; gap:16px}
.lp-risk-score{font-size:40px; font-weight:700; letter-spacing:-.03em; color:var(--danger); line-height:1; font-variant-numeric:tabular-nums} .lp-risk-score span{font-size:16px; color:var(--faint)}
.lp-risk-flags{display:flex; flex-wrap:wrap; gap:6px}
.lp-flag{font-size:11.5px; font-weight:600; color:#B91C1C; background:#FEE2E2; border:1px solid #FCA5A5; padding:4px 9px; border-radius:8px}
.lp-risk-foot{margin-top:16px; padding-top:14px; border-top:1px solid var(--line-2); font-size:13.5px; font-weight:600; color:var(--danger)}

/* safety */
.lp-safety{background:var(--navy); color:#fff}
.lp-safety-h{color:#fff} .lp-safety-p{color:#9FB0C7}
.lp-features{margin-top:46px; display:grid; grid-template-columns:1fr 1fr; gap:16px}
.lp-feature{display:flex; gap:14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.09); border-radius:16px; padding:18px}
.lp-featicon{width:40px; height:40px; border-radius:11px; background:rgba(16,185,129,.14); display:flex; align-items:center; justify-content:center; flex-shrink:0}
.lp-feature h3{font-size:16px; font-weight:600}
.lp-feature p{margin-top:6px; font-size:14px; color:#9FB0C7; line-height:1.55}

/* faq */
.lp-faqwrap{max-width:760px}
.lp-faq{margin-top:40px; display:flex; flex-direction:column; gap:12px}
.lp-faqitem{background:var(--card); border:1px solid var(--border); border-radius:14px; box-shadow:var(--sh-sm); overflow:hidden}
.lp-faqitem summary{list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 20px; font-size:16px; font-weight:600}
.lp-faqitem summary::-webkit-details-marker{display:none}
.lp-faqchev{transition:transform .2s var(--ease); display:inline-flex}
.lp-faqitem[open] .lp-faqchev{transform:rotate(180deg)}
.lp-faqitem p{padding:0 20px 18px; font-size:15px; color:var(--muted); line-height:1.6}

/* final cta */
.lp-cta{padding:24px 0 84px}
.lp-ctacard{text-align:center; background:linear-gradient(160deg,#0F172A 0%, #14233F 100%); border-radius:24px; padding:56px 32px; box-shadow:var(--sh-lg)}
.lp-ctacard h2{font-size:34px; letter-spacing:-.03em; font-weight:700; color:#fff}
.lp-ctacard p{margin:14px auto 26px; font-size:17px; color:#9FB0C7; max-width:46ch; line-height:1.6}

/* footer */
.lp-footer{border-top:1px solid var(--border); padding:32px 0}
.lp-footrow{display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap}
.lp-footnote{font-size:13.5px; color:var(--muted)}

/* responsive */
@media (max-width:900px){
  .lp-herogrid{grid-template-columns:1fr; gap:44px}
  .lp-herocopy h1{font-size:42px}
  .lp-aigrid{grid-template-columns:1fr; gap:36px}
  .lp-features{grid-template-columns:1fr}
  .lp-flow{grid-template-columns:1fr 1fr} .lp-flowline{display:none}
  .lp-navlinks{display:none}
}
@media (max-width:560px){
  .lp-hero{padding:44px 0 24px}
  .lp-herocopy h1{font-size:34px}
  .lp-band{gap:12px} .lp-band span{font-size:13.5px}
  .lp-flow{grid-template-columns:1fr}
  .lp-head h2,.lp-ctacard h2{font-size:28px} .lp-aicopy h2{font-size:27px}
  .lp-navcta .lp-link{display:none}
  .lp-verdict{left:0}
  .lp-ctacard{padding:40px 22px}
}
`;
