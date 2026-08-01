"use client";

/* ==========================================================================
   ScreenHtml — renders one finished design screen (from the TrustFlow design)
   as a real, interactive app page. The visuals are the exact design markup, so
   screens stay pixel-identical; this component makes them *work*:

     • [data-nav="x"]      → tappable link to NAV[x]
     • [data-action="fn"]  → tappable button that calls actions.fn(fieldValues),
                             with a busy state (used to hit the backend)
     • [data-field="name"] → a real <input>/<textarea>; its value is collected
                             and passed to the action handler
     • [data-bind="key"]   → element's text is replaced with data[key]
     • .score-num + .ring  → the Trust Score number and dial animate to
                             data.score (any value), else the design default

   Pass `data` / `actions` from a screen's page.tsx to wire it to the backend;
   omit them and the screen behaves exactly like the static design.
   ========================================================================== */

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { NAV } from "./nav";

type ScreenData = Record<string, string | number | null | undefined>;
type ScreenActions = Record<string, (fields: Record<string, string>, el: HTMLElement) => void | Promise<void>>;

export default function ScreenHtml({
  html,
  data,
  actions,
}: {
  html: string;
  data?: ScreenData;
  actions?: ScreenActions;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Read latest data/actions at event time without re-running the effect.
  const dataRef = useRef(data);
  dataRef.current = data;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Re-bind + re-animate only when the screen or its data actually changes.
  const dataKey = useMemo(() => JSON.stringify(data ?? {}), [data]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const d = dataRef.current;

    // Hide the mock "9:41" status bar baked into each design screen — on a real
    // phone it sits under the actual status bar and makes the app look like a
    // screenshot.
    const firstChild = host.firstElementChild?.firstElementChild as HTMLElement | null;
    if (firstChild && (firstChild.textContent || "").includes("9:41")) firstChild.style.display = "none";

    const readFields = () => {
      const f: Record<string, string> = {};
      host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-field]").forEach((el) => {
        f[el.getAttribute("data-field") || ""] = el.value;
      });
      return f;
    };

    // Clicks: tabs → actions → nav.
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;

      // Segmented tabs: show the matching [data-pane], highlight the active tab.
      const tabEl = t?.closest<HTMLElement>("[data-tab]");
      if (tabEl) {
        const paneId = tabEl.getAttribute("data-tab") || "";
        host.querySelectorAll<HTMLElement>("[data-pane]").forEach((p) => (p.style.display = p.id === paneId ? "" : "none"));
        host.querySelectorAll<HTMLElement>("[data-tab]").forEach((tb) => {
          const on = tb === tabEl;
          tb.style.background = on ? "#E4144F" : "transparent";
          tb.style.color = on ? "#fff" : "#9A9AA0";
        });
        return;
      }

      const actionEl = t?.closest<HTMLElement>("[data-action]");
      if (actionEl) {
        const fn = actionsRef.current?.[actionEl.getAttribute("data-action") || ""];
        if (fn) {
          e.preventDefault();
          if (actionEl.getAttribute("aria-busy") === "true") return;
          actionEl.setAttribute("aria-busy", "true");
          actionEl.style.opacity = "0.6";
          Promise.resolve(fn(readFields(), actionEl)).finally(() => {
            actionEl.removeAttribute("aria-busy");
            actionEl.style.opacity = "1";
          });
          return;
        }
      }
      const navEl = t?.closest<HTMLElement>("[data-nav]");
      if (navEl) {
        const to = NAV[navEl.getAttribute("data-nav") || ""];
        if (to) {
          e.preventDefault();
          router.push(to);
        }
      }
    };
    host.addEventListener("click", onClick);
    host.querySelectorAll<HTMLElement>("[data-nav],[data-action]").forEach((el) => (el.style.cursor = "pointer"));

    // Text bindings, and HTML (list) injections.
    if (d) {
      host.querySelectorAll<HTMLElement>("[data-bind]").forEach((el) => {
        const k = el.getAttribute("data-bind") || "";
        if (d[k] != null) el.textContent = String(d[k]);
      });
      host.querySelectorAll<HTMLElement>("[data-html]").forEach((el) => {
        const k = el.getAttribute("data-html") || "";
        if (d[k] != null) el.innerHTML = String(d[k]);
      });
      // Prefill form fields from data (only when empty, so we never clobber typing).
      host.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-field]").forEach((el) => {
        const k = el.getAttribute("data-field") || "";
        if (d[k] != null && el.value === "") el.value = String(d[k]);
      });
      // Photo fills: a data: URL becomes the element's background (e.g. an avatar).
      host.querySelectorAll<HTMLElement>("[data-photo]").forEach((el) => {
        const url = d[el.getAttribute("data-photo") || ""];
        if (typeof url === "string" && url) {
          el.style.backgroundImage = `url("${url}")`;
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
          el.textContent = "";
        }
      });
    }

    // Reveal the flag rows.
    host.querySelectorAll<HTMLElement>(".flag").forEach((f) => f.classList.add("in-view"));

    const reduced =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Trust Score: drive the number + dial from real data when provided.
    const score = d && typeof d.score === "number" ? d.score : null;
    const scoreEl = host.querySelector<HTMLElement>(".score-num");
    const ring = host.querySelector<HTMLElement>(".ring");
    if (score != null) {
      if (scoreEl) scoreEl.setAttribute("data-countup", String(score));
      if (ring) {
        ring.classList.remove("in-view");
        ring.style.animation = "none";
        ring.style.setProperty("--p", reduced ? String(score) : "0");
      }
    } else {
      host.querySelectorAll<HTMLElement>(".ring").forEach((r) => r.classList.add("in-view"));
    }

    // Count numbers up (and the linked dial, when the score is dynamic).
    host.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
      const end = parseInt(el.getAttribute("data-countup") || "0", 10);
      const drivesRing = el === scoreEl && score != null && !!ring;
      if (reduced) {
        el.textContent = String(end);
        if (drivesRing) ring!.style.setProperty("--p", String(end));
        return;
      }
      const dur = 1500;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = Math.round(end * eased);
        el.textContent = String(cur);
        if (drivesRing) ring!.style.setProperty("--p", String(cur));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    return () => host.removeEventListener("click", onClick);
  }, [router, html, dataKey]);

  return (
    <main className="device">
      <div className="screenhost" ref={hostRef} dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
