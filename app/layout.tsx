import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./_lib/PwaRegister";
import { ToastHost } from "./_lib/Toast";

export const metadata: Metadata = {
  applicationName: "Zafe",
  title: { default: "Zafe", template: "%s · Zafe" },
  description:
    "AI-powered escrow for peer-to-peer trades. Money held safe until you confirm.",
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
        {children}
        <ToastHost />
        <PwaRegister />
      </body>
    </html>
  );
}
