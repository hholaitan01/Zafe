import type { MetadataRoute } from "next";

/* Web app manifest — makes Zafe installable on Android and iOS (Add to
   Home Screen) and drives the launch splash. Served at /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zafe: AI Escrow",
    short_name: "Zafe",
    description: "AI-powered escrow for peer-to-peer trades. Money held safe until you confirm.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F172A",
    theme_color: "#F8FAFC",
    categories: ["finance", "shopping", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
