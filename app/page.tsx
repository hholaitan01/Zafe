"use client";

/* ==========================================================================
   Screen 1 — Landing / Splash / Get Started
   The first screen a user sees. Two buttons: create an account, or log in.
   Visuals reproduced exactly from the TrustFlow design.
   ========================================================================== */

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <main
      className="device"
      style={{
        background:
          "radial-gradient(120% 90% at 50% 0%, #C4123F 0%, #4A0A1E 52%, #1A0710 100%)",
      }}
    >
      {/* status bar */}
      <div className="statusbar">
        <span>9:41</span>
        <span style={{ opacity: 0.85 }}>▂▃▄ ᯤ ▮</span>
      </div>

      {/* centre: shield + wordmark + tagline */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 32px",
          textAlign: "center",
        }}
      >
        <div style={shield.wrap}>
          <div style={shield.body} />
          <div style={shield.highlight} />
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" style={shield.check}>
            <path
              d="M20 6 L9 17 L4 12"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            marginTop: 36,
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: "-0.035em",
          }}
        >
          TrustFlow
        </h1>
        <p style={{ marginTop: 14, fontSize: 18, color: "#ffc2d0", fontWeight: 500 }}>
          Trust, before you pay.
        </p>
      </div>

      {/* bottom: actions */}
      <div style={{ padding: "0 32px 40px" }}>
        <div
          className="tap"
          role="button"
          tabIndex={0}
          onClick={() => router.push("/dashboard")}
          onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard")}
          style={{
            height: 56,
            borderRadius: 16,
            background: "#E4144F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 14px 30px -8px rgba(228,20,79,.7)",
          }}
        >
          Get Started
        </div>

        <div
          className="tap"
          role="button"
          tabIndex={0}
          onClick={() => router.push("/login")}
          onKeyDown={(e) => e.key === "Enter" && router.push("/login")}
          style={{
            marginTop: 14,
            height: 56,
            borderRadius: 16,
            background: "rgba(255,255,255,.09)",
            border: "1px solid rgba(255,255,255,.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          Log in
        </div>
      </div>
    </main>
  );
}

/* the glossy shield-orb, reused from the design */
const shield: Record<string, CSSProperties> = {
  wrap: {
    position: "relative",
    width: 132,
    height: 150,
    animation: "floaty 5s ease-in-out infinite",
  },
  body: {
    position: "absolute",
    inset: 0,
    clipPath:
      "path('M66 4 L124 26 L124 78 C124 122 98 142 66 150 C34 142 8 122 8 78 L8 26 Z')",
    background:
      "radial-gradient(circle at 36% 28%, #ffd0dd 0%, #E4144F 42%, #7C3AED 100%)",
    boxShadow:
      "0 24px 60px -12px rgba(228,20,79,.7), inset -8px -12px 26px rgba(60,0,20,.55), inset 6px 8px 22px rgba(255,255,255,.35)",
  },
  highlight: {
    position: "absolute",
    top: 20,
    left: 26,
    width: 44,
    height: 34,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 40% 30%, rgba(255,255,255,.85), rgba(255,255,255,0) 70%)",
    filter: "blur(1px)",
  },
  check: { position: "absolute", top: 52, left: 43 },
};
