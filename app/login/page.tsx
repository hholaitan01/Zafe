"use client";

/* ==========================================================================
   Screen 2 — Sign up / Log in  (passwordless)
   Two ways in, no passwords to phish or leak:
     • Continue with Google (OAuth), and
     • a one-time email login link (type your email → we send a link → tap it).
   No bank details here — those come later, only when a payout/refund is due.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendMagicLink, signInWithGoogle, type AuthResult } from "@/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Move to the dashboard, follow an OAuth redirect, show the "check your inbox"
  // state, or surface an error.
  function applyResult(result: AuthResult, failMessage: string): boolean {
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return true; // navigating away — keep the spinner up
    }
    if (result.ok && result.magicLinkSent) {
      setSentTo(email.trim());
    } else if (result.ok) {
      router.push("/dashboard"); // demo mode signs in directly
      return true;
    } else {
      setError(result.error ?? failMessage);
    }
    return false;
  }

  // Continue with Google (OAuth in live mode; instant in demo).
  async function handleGoogle() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await signInWithGoogle(), "Google sign-in failed. Please try again.");
      if (!keepLoading) setLoading(false);
    } catch {
      setError("Couldn't start Google sign-in. Please try again.");
      setLoading(false);
    }
  }

  // Email me a login link.
  async function handleLink() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const keepLoading = applyResult(await sendMagicLink(email), "Couldn't send the link. Please try again.");
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
              clipPath: "path('M26 2 L50 11 L50 32 C50 50 39 58 26 60 C13 58 2 50 2 32 L2 11 Z')",
              background: "radial-gradient(circle at 36% 28%, #ffd0dd, #E4144F 45%, #7C3AED 100%)",
            }}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: "absolute", top: 21, left: 16 }}>
            <path d="M20 6 L9 17 L4 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        {sentTo ? (
          /* ---- Check-your-inbox confirmation ---- */
          <>
            <h1 style={{ marginTop: 26, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Check your inbox</h1>
            <p style={{ marginTop: 10, fontSize: 15, color: "#c9c9cf", lineHeight: 1.6 }}>
              We sent a login link to <b style={{ color: "#fff" }}>{sentTo}</b>. Tap it on this device to sign in — it expires shortly and can only be used once.
            </p>
            <p style={{ marginTop: 16, fontSize: 13, color: "#9A9AA0", lineHeight: 1.6 }}>
              No email after a minute? Check spam, or send a new link.
            </p>
            <div
              className="tap"
              role="button"
              tabIndex={0}
              aria-disabled={loading}
              onClick={handleLink}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              style={{ ...socialBtn, marginTop: 20, background: "#E4144F", color: "#fff", opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
            >
              {loading ? "Sending…" : "Send another link"}
            </div>
            <div
              className="tap"
              role="button"
              tabIndex={0}
              onClick={() => {
                setSentTo(null);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && setSentTo(null)}
              style={{ ...socialBtn, marginTop: 12, background: "transparent", color: "#fff", border: "1px solid #2a2a2e" }}
            >
              Use a different email
            </div>
            {error && (
              <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "#ff6b81", lineHeight: 1.5 }}>
                {error}
              </p>
            )}
          </>
        ) : (
          /* ---- Sign-in options ---- */
          <>
            <h1 style={{ marginTop: 26, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" }}>Welcome back</h1>
            <p style={{ marginTop: 8, fontSize: 15, color: "#9A9AA0" }}>Sign in to keep your trades protected. No passwords — ever.</p>

            {/* Google — primary */}
            <div style={{ marginTop: 32 }}>
              <div
                className="tap"
                role="button"
                tabIndex={0}
                aria-disabled={loading}
                onClick={handleGoogle}
                onKeyDown={(e) => e.key === "Enter" && handleGoogle()}
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
            </div>

            {/* divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
              <span style={{ fontSize: 12, color: "#6d6d74" }}>or with your email</span>
              <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
            </div>

            {/* email → login link */}
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
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              autoComplete="email"
              enterKeyHint="go"
              style={{ marginTop: 8 }}
            />
            <div
              className="tap"
              role="button"
              tabIndex={0}
              aria-disabled={loading}
              onClick={handleLink}
              onKeyDown={(e) => e.key === "Enter" && handleLink()}
              style={{ ...socialBtn, marginTop: 14, background: "#E4144F", color: "#fff", fontSize: 16, opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
            >
              {loading ? "Please wait…" : "Email me a login link"}
            </div>

            {error && (
              <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "#ff6b81", lineHeight: 1.5 }}>
                {error}
              </p>
            )}

            <p style={{ marginTop: 22, textAlign: "center", fontSize: 12.5, color: "#6d6d74", lineHeight: 1.5 }}>
              We never ask for your bank details here. You&apos;ll only add them later — right when a payout or refund is due.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

const label = {
  fontSize: 12,
  fontWeight: 600,
  color: "#9A9AA0",
} as const;

// Shared full-width tappable button.
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
