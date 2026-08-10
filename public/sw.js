/* Zafe service worker.

   Deliberately conservative for a money app: it NEVER caches API responses or
   authenticated HTML, so it can never serve stale deal, balance, or session
   data. It caches only versioned static assets and a small offline shell, and
   falls back to an offline page when a navigation fails with no network. */

const VERSION = "zafe-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PRECACHE = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GETs. Everything else (POST, cross-origin) goes
  // straight to the network, untouched.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache API or auth traffic. Always hit the network so data is fresh.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Cache-first for immutable static assets.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/favicon.png") {
    event.respondWith(
      caches.match(request).then((hit) =>
        hit || fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
          return res;
        }),
      ),
    );
    return;
  }

  // Navigations: network-first, fall back to the offline page (never cache the
  // page HTML itself, so authenticated content is never persisted).
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
  }
});
