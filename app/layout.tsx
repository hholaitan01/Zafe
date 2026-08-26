import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./_lib/PwaRegister";
import { ToastHost } from "./_lib/Toast";
import { SiteStructuredData } from "./_lib/StructuredData";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_SUMMARY, SITE_URL } from "./_lib/site";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Zafe — Escrow that keeps your money safe | Nigeria",
    template: "%s · Zafe",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  category: "finance",
  alternates: { canonical: "/" },
  authors: [{ name: "Zafe" }],
  creator: "Zafe",
  publisher: "Zafe",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Zafe — Escrow that keeps your money safe",
    description: SITE_SUMMARY,
    locale: "en_NG",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Zafe — money held safe until you confirm delivery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zafe — Escrow that keeps your money safe",
    description: SITE_SUMMARY,
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Zafe",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Add your Google Search Console token here once you verify the property:
  // verification: { google: "your-verification-token" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteStructuredData />
        {children}
        <ToastHost />
        <PwaRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
