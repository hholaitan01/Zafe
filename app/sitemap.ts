import type { MetadataRoute } from "next";
import { SITE_URL } from "./_lib/site";

/* sitemap.xml (served at /sitemap.xml). Only the public, indexable pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const guides = [
    "what-is-escrow",
    "avoid-whatsapp-instagram-scams-nigeria",
    "buy-from-strangers-online-safely",
    "escrow-vs-bank-transfer",
    "escrow-vs-cash-on-delivery-nigeria",
    "how-to-verify-an-online-seller-nigeria",
    "buy-a-phone-safely-online-nigeria",
    "fake-payment-alerts-nigeria",
    "escrow-payment-nigeria-how-it-works",
    "buy-a-laptop-safely-online-nigeria",
    "instagram-vendor-scams-nigeria",
    "safe-payment-links-for-nigerian-sellers",
    "get-paid-safely-online-nigeria",
  ];
  // Commercial pillar pages — the primary search entry points.
  const pillars = ["escrow-nigeria", "how-it-works", "buyer-protection", "seller-protection"];
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...pillars.map((s) => ({ url: `${SITE_URL}/${s}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
    { url: `${SITE_URL}/waitlist`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...guides.map((s) => ({ url: `${SITE_URL}/guides/${s}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    // /login is intentionally omitted: it has no standalone search value and is noindex.
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
