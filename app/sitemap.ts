import type { MetadataRoute } from "next";
import { SITE_URL } from "./_lib/site";

/* sitemap.xml (served at /sitemap.xml). Only the public, indexable pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const guides = [
    "what-is-escrow",
    "avoid-whatsapp-instagram-scams-nigeria",
    "buy-from-strangers-online-safely",
  ];
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/waitlist`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...guides.map((s) => ({ url: `${SITE_URL}/guides/${s}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
