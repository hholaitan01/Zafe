import type { CapacitorConfig } from "@capacitor/cli";

/* Capacitor wraps the deployed Zafe web app in native iOS and Android
   shells for the App Store and Play Store.

   Because Zafe is a server-rendered Next.js app (API routes, SSR, auth
   middleware, ALAT webhooks), the native shell loads the LIVE deployment via
   `server.url` rather than a static bundle. Replace the URL below with your own
   deployment (or set CAP_SERVER_URL) before building. `webDir` points at a
   small branded loading screen shown while the site loads or if it is offline.

   See docs/mobile.md for the full build and submit guide. */

const config: CapacitorConfig = {
  appId: "ng.zafe.escrow",
  appName: "Zafe",
  webDir: "capacitor-shell",
  backgroundColor: "#0F172A",
  server: {
    url: process.env.CAP_SERVER_URL || "https://getzafe.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0F172A",
  },
  android: {
    backgroundColor: "#0F172A",
  },
};

export default config;
