/* ==========================================================================
   GuideShell — the reading frame for Zafe's guide pages (the SEO / AI-answer
   content section). Server component, so the whole article and its structured
   data land in the initial HTML.

   Each guide passes its title, a one-line dek, its slug, the publish date, the
   body, and a short FAQ. The shell renders the page chrome plus Article,
   BreadcrumbList, and FAQPage JSON-LD so Google and AI engines can parse it.
   ========================================================================== */

import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "../_lib/site";

export interface Faq {
  q: string;
  a: string;
}

/** Per-guide metadata, so each page gets its own title, description, canonical,
    and social card. The layout template turns the title into "… · Zafe". */
export function guideMeta(opts: { title: string; description: string; slug: string }): Metadata {
  const url = `/guides/${opts.slug}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url: `${SITE_URL}${url}`,
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

export default function GuideShell({
  title,
  dek,
  slug,
  datePublished,
  updated,
  children,
  faqs = [],
}: {
  title: string;
  dek: string;
  slug: string;
  datePublished: string;
  updated?: string;
  children: ReactNode;
  faqs?: Faq[];
}) {
  const url = `${SITE_URL}/guides/${slug}`;
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
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: title, item: url },
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
    <div className="guide">
      <style>{css}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(article)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(breadcrumb)} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={ld(faqSchema)} />}

      <header className="g-top">
        <Link href="/" className="g-brand" aria-label="Zafe home">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M8.5 10.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M8.5 21.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M23.5 10.5L8.5 21.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" />
          </svg>
          <span>Zafe</span>
        </Link>
        <Link href="/waitlist" className="g-cta-sm">Join the waitlist</Link>
      </header>

      <article className="g-article">
        <nav className="g-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span>/</span><Link href="/guides">Guides</Link>
        </nav>
        <h1>{title}</h1>
        <p className="g-dek">{dek}</p>

        <div className="g-body">{children}</div>

        {faqs.length > 0 && (
          <section className="g-faq" aria-label="Frequently asked questions">
            <h2>Frequently asked questions</h2>
            {faqs.map((f) => (
              <details className="g-faqitem" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </section>
        )}

        <aside className="g-endcta">
          <div className="g-endcta-t">Buy from strangers. Keep your money safe.</div>
          <p>Zafe holds your money in escrow until you confirm the item arrived, and an AI checks every deal for scams before you pay.</p>
          <Link href="/waitlist" className="g-cta">Join the waitlist</Link>
        </aside>

        <nav className="g-more" aria-label="More guides">
          <Link href="/guides">All guides</Link>
        </nav>
      </article>
    </div>
  );
}

const css = `
.guide{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --bg:#F8FAFC; --card:#FFFFFF; --line:#E6EAF0;
  --safe:#059669; --safe-2:#047857; --safe-tint:#ECFDF5; --ease:cubic-bezier(.22,1,.36,1);
  min-height:100dvh; background:var(--bg); color:var(--ink);
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; -webkit-font-smoothing:antialiased }
.guide *{ box-sizing:border-box }
.guide a{ color:var(--safe); text-decoration:none }
.guide a:hover{ text-decoration:underline }

.g-top{ display:flex; align-items:center; justify-content:space-between; max-width:760px; margin:0 auto; padding:22px 22px 0 }
.g-brand{ display:inline-flex; align-items:center; gap:9px; color:var(--ink); font-weight:800; font-size:18px; letter-spacing:-.02em }
.g-brand:hover{ text-decoration:none }
.g-cta-sm{ font-size:13.5px; font-weight:700; color:#fff; background:var(--ink); padding:8px 14px; border-radius:10px }
.g-cta-sm:hover{ text-decoration:none; background:#1e293b }

.g-article{ max-width:680px; margin:0 auto; padding:20px 22px 80px }
.g-crumbs{ display:flex; gap:8px; align-items:center; font-size:12.5px; color:var(--muted); margin:14px 0 18px }
.g-crumbs a{ color:var(--muted) } .g-crumbs span{ color:#CBD5E1 }
.g-article h1{ font-size:34px; font-weight:800; line-height:1.15; letter-spacing:-.025em }
.g-dek{ margin-top:14px; font-size:18px; line-height:1.55; color:var(--ink-2) }

.g-body{ margin-top:30px }
.g-body h2{ font-size:22px; font-weight:800; letter-spacing:-.01em; margin:34px 0 12px }
.g-body h3{ font-size:17px; font-weight:700; margin:22px 0 8px }
.g-body p{ font-size:16.5px; line-height:1.7; color:var(--ink-2); margin:0 0 15px }
.g-body ul, .g-body ol{ margin:0 0 16px; padding-left:22px }
.g-body li{ font-size:16.5px; line-height:1.65; color:var(--ink-2); margin:0 0 9px }
.g-body strong{ color:var(--ink); font-weight:700 }
.g-body .g-note{ background:var(--safe-tint); border:1px solid #C7F0DE; border-radius:14px; padding:15px 17px; margin:22px 0 }
.g-body .g-note p{ margin:0; color:#065F46 }

.g-faq{ margin-top:44px; border-top:1px solid var(--line); padding-top:30px }
.g-faq h2{ font-size:22px; font-weight:800; margin-bottom:14px }
.g-faqitem{ border-bottom:1px solid var(--line); padding:14px 0 }
.g-faqitem summary{ font-size:16px; font-weight:700; color:var(--ink); cursor:pointer; list-style:none }
.g-faqitem summary::-webkit-details-marker{ display:none }
.g-faqitem[open] summary{ color:var(--safe) }
.g-faqitem p{ margin:10px 0 0; font-size:15.5px; line-height:1.65; color:var(--ink-2) }

.g-endcta{ margin-top:44px; background:var(--card); border:1px solid var(--line); border-radius:20px; padding:26px; text-align:center; box-shadow:0 12px 30px -18px rgba(15,23,42,.18) }
.g-endcta-t{ font-size:20px; font-weight:800; letter-spacing:-.01em }
.g-endcta p{ margin:10px auto 18px; font-size:15px; line-height:1.6; color:var(--muted); max-width:440px }
.g-cta{ display:inline-block; background:var(--safe); color:#fff; font-weight:700; font-size:15px; padding:13px 26px; border-radius:12px }
.g-cta:hover{ text-decoration:none; background:var(--safe-2) }

.g-more{ margin-top:30px; text-align:center; font-size:14.5px; font-weight:600 }
`;
