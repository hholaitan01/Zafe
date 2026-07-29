"use client";

/* ==========================================================================
   Placeholder — the Dashboard (screen 3) is built next.
   This exists so the Landing and Login buttons have somewhere real to go.
   ========================================================================== */

import { useRouter } from "next/navigation";

export default function DashboardPlaceholder() {
  const router = useRouter();

  return (
    <main
      className="device"
      style={{
        background: "#0B0B0D",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 32px",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>🏠</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Dashboard coming next
      </h1>
      <p style={{ marginTop: 10, fontSize: 14.5, color: "#9A9AA0", maxWidth: 260 }}>
        The Landing and Login screens work. This is the next screen we build.
      </p>
      <div
        className="tap"
        role="button"
        tabIndex={0}
        onClick={() => router.push("/")}
        onKeyDown={(e) => e.key === "Enter" && router.push("/")}
        style={{
          marginTop: 28,
          height: 52,
          padding: "0 28px",
          borderRadius: 14,
          background: "#E4144F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Back to start
      </div>
    </main>
  );
}
