"use client";

/* Registers the service worker so Zafe is installable and has an offline
   fallback. The worker itself never caches API or authenticated responses (a
   money app must never serve stale deal data); it only caches static assets and
   an offline page. See public/sw.js. */

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // avoid dev caching surprises
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is best-effort; the app works without it */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
