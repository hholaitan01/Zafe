import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "../_lib/site";

export const metadata: Metadata = {
  title: "Guides — buying safely online in Nigeria",
  description: "Plain guides to buying from strangers online in Nigeria without getting scammed: how escrow works, spotting WhatsApp and Instagram scams, and paying safely.",
  alternates: { canonical: "/guides" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/guides`,
    title: "Zafe Guides — buying safely online in Nigeria",
    description: "How escrow works, how to spot WhatsApp and Instagram vendor scams, and how to buy from strangers online safely.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

const GUIDES = [
  {
    slug: "what-is-escrow",
    title: "What is escrow, and how does it keep your money safe?",
    dek: "The simple idea that removes the risk from paying a stranger, explained in plain terms.",
  },
  {
    slug: "avoid-whatsapp-instagram-scams-nigeria",
    title: "How to avoid getting scammed buying on WhatsApp and Instagram",
    dek: "The tactics vendors use to take your money, the warning signs, and the habit that stops most of them.",
  },
  {
    slug: "buy-from-strangers-online-safely",
    title: "How to buy from a stranger online safely",
    dek: "A short checklist for buying from social-media vendors without losing your money.",
  },
];

export default function GuidesIndex() {
  return (
    <div className="gx">
      <style>{css}</style>
      <header className="gx-top">
        <Link href="/" className="gx-brand" aria-label="Zafe home">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M8.5 10.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
          <span>Zafe</span>
        </Link>
        <Link href="/waitlist" className="gx-cta-sm">Join the waitlist</Link>
      </header>

      <main className="gx-main">
        <h1>Guides</h1>
        <p className="gx-dek">Plain, practical guides to buying from strangers online in Nigeria without losing your money.</p>

        <div className="gx-list">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="gx-card">
              <div className="gx-card-t">{g.title}</div>
              <div className="gx-card-d">{g.dek}</div>
              <span className="gx-card-go">Read guide →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

const css = `
.gx{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --bg:#F8FAFC; --card:#FFFFFF; --line:#E6EAF0; --safe:#059669; --ease:cubic-bezier(.22,1,.36,1);
  min-height:100dvh; background:var(--bg); color:var(--ink); font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased }
.gx *{ box-sizing:border-box }
.gx a{ text-decoration:none }
.gx-top{ display:flex; align-items:center; justify-content:space-between; max-width:760px; margin:0 auto; padding:22px 22px 0 }
.gx-brand{ display:inline-flex; align-items:center; gap:9px; color:var(--ink); font-weight:800; font-size:18px; letter-spacing:-.02em }
.gx-cta-sm{ font-size:13.5px; font-weight:700; color:#fff; background:var(--ink); padding:8px 14px; border-radius:10px }
.gx-cta-sm:hover{ background:#1e293b }
.gx-main{ max-width:680px; margin:0 auto; padding:34px 22px 80px }
.gx-main h1{ font-size:36px; font-weight:800; letter-spacing:-.03em }
.gx-dek{ margin-top:12px; font-size:17px; line-height:1.55; color:var(--ink-2) }
.gx-list{ margin-top:28px; display:flex; flex-direction:column; gap:14px }
.gx-card{ display:block; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:20px 22px; color:var(--ink);
  box-shadow:0 1px 2px rgba(15,23,42,.04); transition:transform .14s var(--ease), box-shadow .18s var(--ease), border-color .18s var(--ease) }
.gx-card:hover{ transform:translateY(-2px); box-shadow:0 14px 30px -18px rgba(15,23,42,.22); border-color:#D9E1EC }
.gx-card-t{ font-size:18px; font-weight:800; letter-spacing:-.01em; line-height:1.3 }
.gx-card-d{ margin-top:7px; font-size:14.5px; line-height:1.55; color:var(--muted) }
.gx-card-go{ display:inline-block; margin-top:13px; font-size:14px; font-weight:700; color:var(--safe) }
`;
