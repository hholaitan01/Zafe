"use client";

/* ==========================================================================
   IdleLogout — signs the user out after a fixed window of inactivity.

   Money app: an unattended session on a shared or lost phone is a real risk.
   From the moment the shell mounts (i.e. from sign-in), any lack of activity
   for IDLE_MS ends the session — we revoke the Supabase session and send the
   user to /login?reason=timeout, where the reason is shown.

   Activity = the user actually touching the app: pointer, key, scroll, touch,
   or the tab coming back to the foreground. Every such signal resets the timer.
   The listeners are passive and throttled to one reset per second so scrolling
   or mousemoves never cost anything measurable.

   Rendered once, inside AppShell — so it only runs on the authenticated
   surfaces, never on the public landing/login pages.
   ========================================================================== */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

/** Inactivity window before auto sign-out. Five minutes, per the security rule. */
const IDLE_MS = 5 * 60 * 1000;
/** Don't reset the timer more than once a second (scroll/mousemove fire a lot). */
const THROTTLE_MS = 1000;

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click", "wheel"] as const;

export default function IdleLogout() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastReset = 0;
    let firing = false;

    async function expire() {
      if (firing) return;
      firing = true;
      // Stop watching before we navigate so a late event can't re-arm the timer.
      teardown();
      try {
        await signOut();
      } catch {
        /* sign the user out of the UI regardless */
      }
      router.replace("/login?reason=timeout");
    }

    function arm() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(expire, IDLE_MS);
    }

    function onActivity() {
      const now = Date.now();
      if (now - lastReset < THROTTLE_MS) return;
      lastReset = now;
      arm();
    }

    // Coming back to a backgrounded tab counts as activity; a tab hidden the
    // whole window still expires on the timer set when it was last active.
    function onVisibility() {
      if (document.visibilityState === "visible") onActivity();
    }

    function teardown() {
      if (timer) clearTimeout(timer);
      timer = null;
      for (const ev of ACTIVITY_EVENTS) window.removeEventListener(ev, onActivity);
      document.removeEventListener("visibilitychange", onVisibility);
    }

    for (const ev of ACTIVITY_EVENTS) window.addEventListener(ev, onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    arm(); // the clock starts now — inactivity from mount counts

    return teardown;
  }, [router]);

  return null;
}
