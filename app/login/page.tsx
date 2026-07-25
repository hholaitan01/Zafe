"use client";

/* ==========================================================================
   Screen 2 — Sign up / Log in
   Email + password (real, working inputs) or Continue with Google.
   No bank details here — those come later, only when a payout/refund is due.
   Visuals reproduced exactly from the TrustFlow design.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInOrUp, signInWithGoogle } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Email/password — signs in, or creates the account if it's new.
  async function handleContinue() {
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const result = await signInOrUp(email, password);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
      } else if (result.needsEmailConfirmation) {
        setNotice("Almost there — check your email to confirm your account, then sign in.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Continue with Google (OAuth redirect in live mode; instant in demo mode).
  async function handleGoogle() {
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error ?? "Google sign-in failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="device" style={{ background: "#0B0B0D" }}>
      {/* status bar */}
      <div className="statusbar">
        <span>9:41</span>
        <span style={{ opacity: 0.7 }}>▂▃▄ ᯤ ▮</span>
      </div>

      <div style={{ padding: "20px 28px 40px" }}>
        {/* small shield logo */}
        <div style={{ width: 52, height: 60, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath:
                "path('M26 2 L50 11 L50 32 C50 50 39 58 26 60 C13 58 2 50 2 32 L2 11 Z')",
              background:
                "radial-gradient(circle at 36% 28%, #ffd0dd, #E4144F 45%, #7C3AED 100%)",
            }}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            style={{ position: "absolute", top: 21, left: 16 }}
          >
            <path
              d="M20 6 L9 17 L4 12"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <h1 style={{ marginTop: 26, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Welcome back
        </h1>
        <p style={{ marginTop: 8, fontSize: 15, color: "#9A9AA0" }}>
          Create your account or sign in to keep your trades protected.
        </p>

        {/* email */}
        <div style={{ marginTop: 32 }}>
          <label htmlFor="email" style={label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            className="field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            style={{ marginTop: 8 }}
          />
        </div>

        {/* password */}
        <div style={{ marginTop: 18 }}>
          <label htmlFor="password" style={label}>
            Password
          </label>
          <div style={{ position: "relative", marginTop: 8 }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ paddingRight: 62 }}
            />
            <span
              className="tap"
              role="button"
              tabIndex={0}
              onClick={() => setShowPassword((s) => !s)}
              onKeyDown={(e) => e.key === "Enter" && setShowPassword((s) => !s)}
              style={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 13,
                color: "#9A9AA0",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
        </div>

        {/* continue */}
        <div
          className="tap"
          role="button"
          tabIndex={0}
          aria-disabled={loading}
          onClick={handleContinue}
          onKeyDown={(e) => e.key === "Enter" && handleContinue()}
          style={{
            marginTop: 26,
            height: 56,
            borderRadius: 14,
            background: "#E4144F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          {loading ? "Please wait…" : "Continue"}
        </div>

        {/* error / notice */}
        {error && (
          <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "#ff6b81", lineHeight: 1.5 }}>
            {error}
          </p>
        )}
        {notice && (
          <p style={{ marginTop: 14, fontSize: 13, color: "#4ade80", lineHeight: 1.5 }}>
            {notice}
          </p>
        )}

        {/* divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
          <span style={{ fontSize: 12, color: "#6d6d74" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
        </div>

        {/* google */}
        <div
          className="tap"
          role="button"
          tabIndex={0}
          aria-disabled={loading}
          onClick={handleGoogle}
          onKeyDown={(e) => e.key === "Enter" && handleGoogle()}
          style={{
            height: 56,
            borderRadius: 14,
            background: "#fff",
            color: "#0B0B0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontWeight: 700,
            fontSize: 15,
            opacity: loading ? 0.6 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.6 17.6 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z"
            />
            <path
              fill="#FBBC05"
              d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-4.1-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z"
            />
          </svg>
          Continue with Google
        </div>

        <p
          style={{
            marginTop: 22,
            textAlign: "center",
            fontSize: 12.5,
            color: "#6d6d74",
            lineHeight: 1.5,
          }}
        >
          We never ask for your bank details here. You&apos;ll only add them later — right when
          a payout or refund is due.
        </p>
      </div>
    </main>
  );
}

const label = {
  fontSize: 12,
  fontWeight: 600,
  color: "#9A9AA0",
} as const;
