/* ==========================================================================
   JSON-LD structured data. Google uses it for rich results, and AI answer
   engines (ChatGPT, Perplexity, Google AI Overviews) lean on it to understand
   and cite a site. Server components, so the markup is in the initial HTML.

   Two exports:
   - SiteStructuredData: Organization + WebSite, safe on every page (layout).
   - LandingStructuredData: SoftwareApplication + FAQPage, only on the landing,
     so the FAQ schema matches the FAQ a visitor actually sees.
   ========================================================================== */

import { FAQS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

/** Escape the one sequence that could break out of a JSON-LD script tag. */
function ld(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export function SiteStructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description: SITE_DESCRIPTION,
    slogan: "Money held safe",
    areaServed: { "@type": "Country", name: "Nigeria" },
    knowsAbout: ["escrow", "peer-to-peer payments", "online fraud protection", "social commerce"],
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-NG",
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(organization)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(website)} />
    </>
  );
}

export function LandingStructuredData() {
  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, iOS, Android",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
    featureList: [
      "AI-checked escrow for peer-to-peer trades",
      "Scam detection on the deal chat before you pay",
      "AI dispute mediation with a fair recommendation",
      "Bank-verified payments, no receipt uploads",
      "Identity-verified seller payouts",
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(app)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(faq)} />
    </>
  );
}
