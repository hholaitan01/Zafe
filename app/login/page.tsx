"use client";

/* ==========================================================================
   Screen 2 — Sign up / Log in
   Social sign-in first (Continue with Google / Apple) — the primary path.
   Email + password is kept as a secondary option behind a toggle.
   No bank details here — those come later, only when a payout/refund is due.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInOrUp, signInWithApple, signInWithGoogle, type AuthResult } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Move to the dashboard, follow an OAuth redirect, or surface an error.
  function applyResult(result: AuthResult, failMessage: string): boolean {
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return true; // navigating away — keep the spinner up
    }
    if (result.ok && result.needsEmailConfirmation) {
      setNotice("Almost there — check your email to confirm your account, then sign in.");
    } else if (result.ok) {
      router.push("/dashboard");
      return true;
    } else {
      setError(result.error ?? failMessage);
    }
    return false;
  }

  // Primary path — Continue with Google / Apple (OAuth in live mode; instant in demo).
  async function handleOAuth(start: () => Promise<AuthResult>, name: string) {
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await start(), `${name} sign-in failed. Please try again.`);
      if (!keepLoading) setLoading(false);
    } catch {
      setError(`Couldn't start ${name} sign-in. Please try again.`);
      setLoading(false);
    }
  }

  // Secondary path — email/password. Signs in, or creates the account if it's new.
  async function handleContinue() {
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await signInOrUp(email, password), "Something went wrong. Please try again.");
      if (!keepLoading) setLoading(false);
    } catch {
      setError("Couldn't reach the server. Please try again.");
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

        {/* social sign-in — the primary path */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Google */}
          <div
            className="tap"
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={() => handleOAuth(signInWithGoogle, "Google")}
            onKeyDown={(e) => e.key === "Enter" && handleOAuth(signInWithGoogle, "Google")}
            style={{ ...socialBtn, background: "#fff", color: "#0B0B0D", opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.6 17.6 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
              <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.3-5.7c-2 1.4-4.6 2.2-7.9 2.2-6.4 0-11.8-4.1-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </div>

          {/* Apple */}
          <div
            className="tap"
            role="button"
            tabIndex={0}
            aria-disabled={loading}
            onClick={() => handleOAuth(signInWithApple, "Apple")}
            onKeyDown={(e) => e.key === "Enter" && handleOAuth(signInWithApple, "Apple")}
            style={{ ...socialBtn, background: "#000", color: "#fff", border: "1px solid #2a2a2e", opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
          >
            <svg width="18" height="20" viewBox="0 0 384 512" fill="#fff" aria-hidden="true">
              <path d="M318.7 268c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.6zM262.1 103.8c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
            Continue with Apple
          </div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
          <span style={{ fontSize: 12, color: "#6d6d74" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
        </div>

        {!showEmail ? (
          /* secondary — reveal the email form only if the user wants it */
          <div
            className="tap"
            role="button"
            tabIndex={0}
            onClick={() => setShowEmail(true)}
            onKeyDown={(e) => e.key === "Enter" && setShowEmail(true)}
            style={{ ...socialBtn, background: "transparent", color: "#fff", border: "1px solid #2a2a2e" }}
          >
            Continue with email
          </div>
        ) : (
          <>
            {/* email */}
            <div>
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
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#9A9AA0" }}
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>
            </div>

            {/* continue with email */}
            <div
              className="tap"
              role="button"
              tabIndex={0}
              aria-disabled={loading}
              onClick={handleContinue}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              style={{ ...socialBtn, marginTop: 20, background: "#E4144F", color: "#fff", fontSize: 16, opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
            >
              {loading ? "Please wait…" : "Continue"}
            </div>
          </>
        )}

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

// Shared full-width tappable button (social buttons, email toggle, continue).
const socialBtn = {
  height: 56,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  fontWeight: 700,
  fontSize: 15,
} as const;
