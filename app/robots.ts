import type { MetadataRoute } from "next";
import { SITE_URL } from "./_lib/site";

/* robots.txt (served at /robots.txt).

   The public marketing pages are open to every crawler, AI answer engines
   included (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot). The
   app itself is user-specific and behind auth, so those routes and the API are
   kept out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/settings",
          "/new-escrow",
          "/fund",
          "/receipt",
          "/timeline",
          "/history",
          "/notifications",
          "/seller",
          "/selling",
          "/request",
          "/locked",
          "/released",
          "/trust-score",
          "/trust-score-high",
          "/support",
          "/admin",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
