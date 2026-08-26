/* ==========================================================================
   Canonical site facts, in one place. Used by the metadata, structured data,
   sitemap, robots, and the AI-crawler file so they never drift apart.

   Set NEXT_PUBLIC_SITE_URL in the environment when a custom domain goes live
   (e.g. https://getzafe.com); until then it defaults to the Vercel URL.
   ========================================================================== */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://getzafe.vercel.app").replace(/\/$/, "");
export const SITE_NAME = "Zafe";
export const SITE_TAGLINE = "Money held safe";

export const SITE_DESCRIPTION =
  "Zafe is AI-powered escrow for Nigerian peer-to-peer trades. Your money is held safe until you confirm the item arrived, and an AI checks every deal for scams before you pay.";

/** Short, keyword-aware summary for social cards and AI answers. */
export const SITE_SUMMARY =
  "Escrow that keeps your money safe when you buy from strangers on WhatsApp, Instagram, and campus groups in Nigeria.";

export const SITE_KEYWORDS = [
  "escrow",
  "escrow Nigeria",
  "online escrow service",
  "buy from strangers safely",
  "WhatsApp payment protection",
  "Instagram vendor escrow",
  "peer-to-peer escrow",
  "P2P payment protection",
  "scam protection Nigeria",
  "secure online payment Nigeria",
  "social commerce escrow",
];

/** The public FAQ, shared by the landing page and the FAQPage structured data
    so the schema always matches what a visitor actually reads. */
export const FAQS: { q: string; a: string }[] = [
  { q: "Is my money actually safe?", a: "Yes. Once you pay, the money sits in escrow. The seller cannot withdraw it. It only moves when you confirm delivery, or when a dispute is resolved." },
  { q: "What if the seller never ships?", a: "You open a dispute. If the item never arrives, the money is refunded to you. The seller is only paid for a deal they actually completed." },
  { q: "Do I need a Wema account?", a: "No. You can pay from any bank. We detect the transfer automatically, so there is no receipt to upload and no screenshot to send." },
  { q: "What does it cost?", a: "Setting up a protected deal is free. Escrow fees apply only when a deal completes, so trying it costs you nothing." },
];
