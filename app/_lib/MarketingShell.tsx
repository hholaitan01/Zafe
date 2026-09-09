/* ==========================================================================
   MarketingShell — the frame for Zafe's top-level commercial SEO pages
   (/escrow-nigeria, /how-it-works, /buyer-protection, /seller-protection).

   A server component, so the full page and its structured data land in the
   initial HTML. Mirrors the guide reading frame, but for a top-level page: the
   breadcrumb is Home > <page>, the canonical is the page's own path, and it
   carries a hub-and-spoke "Related" block of descriptive internal links.
   ========================================================================== */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "./site";

export interface Faq {
  q: string;
  a: string;
}
export interface RelatedLink {
  href: string;
  label: string;
  desc?: string;
}

/** Per-page metadata: unique title, description, self-canonical, and social card. */
export function pageMeta(opts: { title: string; description: string; path: string }): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${opts.path}`,
      title: opts.title,
      description: opts.description,
      siteName: SITE_NAME,
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: ["/og.png"] },
  };
}

function ld(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export default function MarketingShell({
  title,
  h1,
  dek,
  path,
  datePublished,
  updated,
  children,
  faqs = [],
  related = [],
}: {
  title: string; // the schema/breadcrumb name
  h1?: string; // visible H1 (defaults to title)
  dek: string;
  path: string; // e.g. "/escrow-nigeria"
  datePublished: string;
  updated?: string;
  children: ReactNode;
  faqs?: Faq[];
  related?: RelatedLink[];
}) {
  const url = `${SITE_URL}${path}`;
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: dek,
    inLanguage: "en-NG",
    mainEntityOfPage: url,
    image: `${SITE_URL}/og.png`,
    datePublished,
    dateModified: updated ?? datePublished,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` } },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ],
  };
  const faqSchema = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      }
    : null;

  return (
    <div className="mkt">
      <style>{css}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(article)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(breadcrumb)} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={ld(faqSchema)} />}

      <header className="m-top">
        <Link href="/" className="m-brand" aria-label="Zafe home">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M8.5 10.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
          <span>Zafe</span>
        </Link>
        <Link href="/waitlist" className="m-cta-sm">Join the waitlist</Link>
      </header>

      <article className="m-article">
        <nav className="m-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><span className="m-crumb-here">{title}</span>
        </nav>
        <h1>{h1 ?? title}</h1>
        <p className="m-dek">{dek}</p>

        <div className="m-body">{children}</div>

        {faqs.length > 0 && (
          <section className="m-faq" aria-label="Frequently asked questions">
            <h2>Frequently asked questions</h2>
            {faqs.map((f) => (
              <details className="m-faqitem" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        {related.length > 0 && (
          <nav className="m-related" aria-label="Related pages">
            <h2>Keep reading</h2>
            <div className="m-related-grid">
              {related.map((r) => (
                <Link href={r.href} key={r.href} className="m-related-card">
                  <span className="m-related-label">{r.label}</span>
                  {r.desc && <span className="m-related-desc">{r.desc}</span>}
                </Link>
              ))}
            </div>
          </nav>
        )}

        <aside className="m-endcta">
          <div className="m-endcta-t">Buy from strangers. Keep your money safe.</div>
          <p>Zafe holds your money in escrow until you confirm the item arrived, and an AI checks every deal for scams before you pay.</p>
          <Link href="/waitlist" className="m-cta">Join the waitlist</Link>
        </aside>
      </article>
    </div>
  );
}

const css = `
.mkt{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --bg:#F8FAFC; --card:#FFFFFF; --line:#E6EAF0;
  --safe:#059669; --safe-2:#047857; --safe-tint:#ECFDF5; --ease:cubic-bezier(.22,1,.36,1);
  min-height:100dvh; background:var(--bg); color:var(--ink);
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased }
.mkt *{ box-sizing:border-box }
.mkt a{ color:var(--safe); text-decoration:none }
.mkt a:hover{ text-decoration:underline }

.m-top{ display:flex; align-items:center; justify-content:space-between; max-width:760px; margin:0 auto; padding:22px 22px 0 }
.m-brand{ display:inline-flex; align-items:center; gap:9px; color:var(--ink); font-weight:800; font-size:18px; letter-spacing:-.02em }
.m-brand:hover{ text-decoration:none }
.m-cta-sm{ font-size:13.5px; font-weight:700; color:#fff; background:var(--ink); padding:8px 14px; border-radius:10px }
.m-cta-sm:hover{ text-decoration:none; background:#1e293b }

.m-article{ max-width:680px; margin:0 auto; padding:20px 22px 80px }
.m-crumbs{ display:flex; gap:8px; align-items:center; font-size:12.5px; color:var(--muted); margin:14px 0 18px }
.m-crumbs a{ color:var(--muted) } .m-crumbs span{ color:#CBD5E1 } .m-crumb-here{ color:var(--muted) }
.m-article h1{ font-size:34px; font-weight:800; line-height:1.15; letter-spacing:-.025em }
.m-dek{ margin-top:14px; font-size:18px; line-height:1.55; color:var(--ink-2) }

.m-body{ margin-top:30px }
.m-body h2{ font-size:22px; font-weight:800; letter-spacing:-.01em; margin:34px 0 12px }
.m-body h3{ font-size:17px; font-weight:700; margin:22px 0 8px }
.m-body p{ font-size:16.5px; line-height:1.7; color:var(--ink-2); margin:0 0 15px }
.m-body ul, .m-body ol{ margin:0 0 16px; padding-left:22px }
.m-body li{ font-size:16.5px; line-height:1.65; color:var(--ink-2); margin:0 0 9px }
.m-body strong{ color:var(--ink); font-weight:700 }
.m-body .m-note{ background:var(--safe-tint); border:1px solid #C7F0DE; border-radius:14px; padding:15px 17px; margin:22px 0 }
.m-body .m-note p{ margin:0; color:#065F46 }

.m-faq{ margin-top:44px; border-top:1px solid var(--line); padding-top:30px }
.m-faq h2{ font-size:22px; font-weight:800; margin-bottom:14px }
.m-faqitem{ border-bottom:1px solid var(--line); padding:14px 0 }
.m-faqitem summary{ font-size:16px; font-weight:700; color:var(--ink); cursor:pointer; list-style:none }
.m-faqitem summary::-webkit-details-marker{ display:none }
.m-faqitem[open] summary{ color:var(--safe) }
.m-faqitem p{ margin:10px 0 0; font-size:15.5px; line-height:1.65; color:var(--ink-2) }

.m-related{ margin-top:44px; border-top:1px solid var(--line); padding-top:24px }
.m-related h2{ font-size:18px; font-weight:800; margin-bottom:14px }
.m-related-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px }
@media (max-width:560px){ .m-related-grid{ grid-template-columns:1fr } }
.m-related-card{ display:flex; flex-direction:column; gap:4px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:15px 16px; transition:border-color .18s var(--ease), transform .18s var(--ease) }
.m-related-card:hover{ text-decoration:none; border-color:#C7F0DE; transform:translateY(-2px) }
.m-related-label{ font-size:15px; font-weight:700; color:var(--ink) }
.m-related-desc{ font-size:13.5px; line-height:1.5; color:var(--muted) }

.m-endcta{ margin-top:44px; background:var(--card); border:1px solid var(--line); border-radius:20px; padding:26px; text-align:center; box-shadow:0 12px 30px -18px rgba(15,23,42,.18) }
.m-endcta-t{ font-size:20px; font-weight:800; letter-spacing:-.01em }
.m-endcta p{ margin:10px auto 18px; font-size:15px; line-height:1.6; color:var(--muted); max-width:440px }
.m-cta{ display:inline-block; background:var(--safe); color:#fff; font-weight:700; font-size:15px; padding:13px 26px; border-radius:12px }
.m-cta:hover{ text-decoration:none; background:var(--safe-2) }
`;
