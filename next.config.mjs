import path from "node:path";

/* Security headers applied to every response. Tuned to what Zafe actually
   loads so nothing breaks:
   - The font (IBM Plex Sans) is self-hosted under /fonts, so font-src is 'self'
     only and no external font hosts are allowed.
   - style-src 'unsafe-inline' for the app's inline <style> blocks; script-src
     'unsafe-inline' — Next's App Router injects inline bootstrap scripts (no
     nonce pipeline here).
   - connect-src allows same-origin plus Supabase (auth + realtime websockets).
   - img-src allows data: (profile photos / avatars) and https: (OAuth avatars).
   - Permissions-Policy KEEPS camera=(self) — the seller liveness selfie needs it.
   - frame-ancestors 'none' + X-Frame-Options DENY: the app is never framed. */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to THIS folder so Next ignores stray lockfiles elsewhere.
  turbopack: {
    root: path.resolve(),
  },
  outputFileTracingRoot: path.resolve(),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
