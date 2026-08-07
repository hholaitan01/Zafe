/* Shared layout for legal pages (Terms, Privacy). Light "trust fintech" look:
   navy ink, emerald accents, IBM Plex Sans on the F8FAFC canvas. Server
   component — pure content, no interactivity. Sections are passed as data so
   each legal page stays a readable outline. */

import Link from "next/link";

export type LegalSection = { h: string; body: React.ReactNode[] };

export function LegalDoc({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main className="lg">
      <style>{css}</style>

      <header className="lg-top">
        <div className="lg-wrap lg-toprow">
          <Link href="/" className="lg-brand" aria-label="TrustFlow home">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#059669" />
              <path d="M11 16.2 14.6 20 21.5 12.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>TrustFlow</span>
          </Link>
          <Link href="/" className="lg-back">← Back to home</Link>
        </div>
      </header>

      <div className="lg-wrap lg-body">
        <div className="lg-eyebrow">Legal</div>
        <h1 className="lg-title">{title}</h1>
        <p className="lg-updated">Last updated {updated}</p>

        <div className="lg-note">
          <b>Beta notice.</b> TrustFlow is in active development. This document is a plain-language
          draft to describe how the product works. It is not legal advice, and it should be reviewed
          by a qualified lawyer before any commercial launch.
        </div>

        <div className="lg-intro">{intro}</div>

        {sections.map((s, i) => (
          <section className="lg-sec" key={s.h}>
            <h2 className="lg-h2"><span className="lg-num">{i + 1}</span>{s.h}</h2>
            {s.body.map((b, j) => (
              <div className="lg-p" key={j}>{b}</div>
            ))}
          </section>
        ))}

        <footer className="lg-foot">
          <p>Questions about this document? Reach the team from your profile, or reply to any TrustFlow email.</p>
          <p className="lg-foot-links">
            <Link href="/terms">Terms of Service</Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy">Privacy Policy</Link>
            <span aria-hidden="true">·</span>
            <Link href="/">Home</Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

const css = `
.lg{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC;
  --card:#FFFFFF; --border:#E6EAF0; --safe:#059669; --safe-tint:#ECFDF5;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--ink); background:var(--bg); min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.6 }
.lg *{ box-sizing:border-box }
.lg a{ text-decoration:none }
.lg-wrap{ width:100%; max-width:760px; margin:0 auto; padding:0 22px }

.lg-top{ position:sticky; top:0; z-index:10; background:rgba(248,250,252,.85); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border) }
.lg-toprow{ display:flex; align-items:center; justify-content:space-between; height:60px }
.lg-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:16px; letter-spacing:-.02em; color:var(--ink) }
.lg-back{ font-size:14px; font-weight:600; color:var(--muted) } .lg-back:hover{ color:var(--ink) }

.lg-body{ padding-top:40px; padding-bottom:72px }
.lg-eyebrow{ font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--safe) }
.lg-title{ margin-top:8px; font-size:38px; font-weight:800; letter-spacing:-.03em; line-height:1.1 }
.lg-updated{ margin-top:10px; font-size:14px; color:var(--muted) }

.lg-note{ margin-top:24px; padding:16px 18px; border-radius:14px; background:var(--safe-tint); border:1px solid #C7EAD9; font-size:14px; line-height:1.6; color:#0f5132 }
.lg-note b{ font-weight:700 }

.lg-intro{ margin-top:24px; font-size:16.5px; color:var(--ink-2) }
.lg-intro p{ margin-top:12px }

.lg-sec{ margin-top:34px }
.lg-h2{ display:flex; align-items:center; gap:12px; font-size:20px; font-weight:800; letter-spacing:-.02em; color:var(--ink) }
.lg-num{ flex-shrink:0; width:28px; height:28px; border-radius:9px; background:var(--safe-tint); color:var(--safe); font-size:14px; font-weight:800; display:inline-flex; align-items:center; justify-content:center }
.lg-p{ margin-top:12px; font-size:15.5px; color:var(--ink-2) }
.lg-p + .lg-p{ margin-top:12px }
.lg-p ul{ margin:10px 0 0; padding-left:22px } .lg-p li{ margin-top:7px }
.lg-p b{ color:var(--ink); font-weight:700 }
.lg-p a{ color:var(--safe); font-weight:600; border-bottom:1px solid transparent; transition:border-color .15s var(--ease) } .lg-p a:hover{ border-color:var(--safe) }

.lg-foot{ margin-top:48px; padding-top:24px; border-top:1px solid var(--border); font-size:14px; color:var(--muted) }
.lg-foot-links{ margin-top:12px; display:flex; flex-wrap:wrap; gap:10px; align-items:center }
.lg-foot-links a{ color:var(--ink-2); font-weight:600 } .lg-foot-links a:hover{ color:var(--safe) }
.lg-foot-links span{ color:var(--faint) }

@media (max-width:560px){ .lg-title{ font-size:30px } .lg-body{ padding-top:28px } }
`;
