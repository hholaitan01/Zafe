"use client";

/* ==========================================================================
   ScreenHtml — renders one finished design screen (from the TrustFlow design)
   as a real app page, and makes it interactive:
     • any element with data-nav="x" becomes a tappable link to NAV[x]
     • the Trust Score dial fills and counts up on load
   The visuals are the exact design markup, so screens stay pixel-identical.
   ========================================================================== */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NAV } from "./nav";

export default function ScreenHtml({ html }: { html: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // 1) make every data-nav element navigate
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>("[data-nav]");
      if (!el) return;
      const key = el.getAttribute("data-nav") || "";
      const to = NAV[key];
      if (to) {
        e.preventDefault();
        router.push(to);
      }
    };
    host.addEventListener("click", onClick);

    // show a pointer cursor on the tappable bits
    host.querySelectorAll<HTMLElement>("[data-nav]").forEach((el) => {
      el.style.cursor = "pointer";
    });

    // 2) fire the Trust Score dial + flag reveal
    host.querySelectorAll<HTMLElement>(".ring").forEach((r) => r.classList.add("in-view"));
    host.querySelectorAll<HTMLElement>(".flag").forEach((f) => f.classList.add("in-view"));

    // 3) count the score number up (or jump straight to it if motion is reduced)
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    host.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
      const end = parseInt(el.getAttribute("data-countup") || "0", 10);
      if (reduced) {
        el.textContent = String(end);
        return;
      }
      const dur = 1500;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.round(end * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    return () => host.removeEventListener("click", onClick);
  }, [router, html]);

  return (
    <main className="device">
      <div
        className="screenhost"
        ref={hostRef}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
