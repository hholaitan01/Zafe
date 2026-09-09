/* ==========================================================================
   Custom 404 (App Router `not-found`). A server component, so the correct
   HTTP 404 is returned with real HTML in the response. Kept out of the index
   (robots: noindex) and deliberately spare: one message, a clear way back.
   ========================================================================== */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for doesn't exist or has moved.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 16,
        padding: "48px 24px",
        background: "#F8FAFC",
        color: "#0F172A",
        fontFamily: "'IBM Plex Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#059669" }}>
        404
      </p>
      <h1 style={{ margin: 0, fontSize: "clamp(1.9rem, 5vw, 2.8rem)", fontWeight: 800, lineHeight: 1.1, maxWidth: 560 }}>
        This page isn&rsquo;t here.
      </h1>
      <p style={{ margin: 0, fontSize: 16, color: "#475569", maxWidth: 420, lineHeight: 1.5 }}>
        The link may be broken, or the page may have moved. Your deals and your money are safe.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 8 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 22px",
            borderRadius: 12,
            background: "#059669",
            color: "#FFFFFF",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
        <Link
          href="/guides"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "12px 22px",
            borderRadius: 12,
            background: "#FFFFFF",
            color: "#0F172A",
            fontWeight: 700,
            textDecoration: "none",
            border: "1px solid #E2E8F0",
          }}
        >
          Read the guides
        </Link>
      </div>
    </main>
  );
}
