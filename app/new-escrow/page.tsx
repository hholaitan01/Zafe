"use client";

/* ==========================================================================
   Screen 4 — New Escrow
   Create a deal (item, amount, seller, pasted chat) → the AI Trust Score runs
   on the server at creation and comes back on the deal. On success we show the
   Trust Score result inline (the calm-green "safe" or scary-red "risky" moment
   the judges care about), then let the user jump to the dashboard.

   Wired with createDeal() from @/lib/client. Simple styling for Deji to
   restyle over.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, createDeal } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";

function trustColor(verdict?: string): string {
  if (verdict === "safe") return "#5fd08a";
  if (verdict === "caution") return "#f5c451";
  if (verdict === "risky") return "#ff6b81";
  return "#9A9AA0";
}

export default function NewEscrow() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [seller, setSeller] = useState("");
  const [verified, setVerified] = useState(false);
  const [chat, setChat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Deal | null>(null);

  async function handleCreate() {
    if (loading) return;
    setError(null);
    const amt = Number(amount);
    if (!title.trim()) return setError("What are you buying? Add an item name.");
    if (!(amt > 0)) return setError("Enter a valid amount.");
    if (!seller.trim()) return setError("Add the seller's name or handle.");

    setLoading(true);
    try {
      const deal = await createDeal({
        item: { title: title.trim(), amount: amt, currency: "NGN" },
        seller: { name: seller.trim(), verified },
        chat: chat.trim() || undefined,
      });
      setResult(deal);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't create the deal. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Result view: the Trust Score moment ----
  if (result) {
    const t = result.trust;
    const color = trustColor(t?.verdict);
    return (
      <main className="device" style={{ background: "#0B0B0D" }}>
        <div className="statusbar">
          <span>9:41</span>
          <span style={{ opacity: 0.7 }}>▂▃▄ ᯤ ▮</span>
        </div>
        <div style={{ padding: "20px 24px 40px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#9A9AA0" }}>Trust Score for this deal</p>

          <div
            style={{
              margin: "22px auto 0",
              width: 168,
              height: 168,
              borderRadius: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: `3px solid ${color}`,
              boxShadow: `0 0 60px ${color}33`,
            }}
          >
            <span style={{ fontSize: 52, fontWeight: 800, color, letterSpacing: "-0.03em" }}>{t?.score ?? "—"}</span>
            <span style={{ fontSize: 13, color: "#9A9AA0" }}>out of 100</span>
          </div>

          <div style={{ marginTop: 20, fontSize: 20, fontWeight: 800, textTransform: "capitalize", color }}>
            {t?.verdict ?? "scored"}
          </div>
          <p style={{ marginTop: 10, fontSize: 14.5, color: "#c9c9cf", lineHeight: 1.55, maxWidth: 300, marginInline: "auto" }}>
            {t?.headline ?? "This deal has been created and scored."}
          </p>

          <div style={{ marginTop: 20, fontSize: 12.5, color: "#6d6d74" }}>
            {result.item.title} · ₦{result.item.amount.toLocaleString()} · {result.reference}
          </div>

          <div
            className="tap"
            role="button"
            tabIndex={0}
            onClick={() => router.push("/dashboard")}
            onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard")}
            style={{ marginTop: 30, height: 54, borderRadius: 14, background: "#E4144F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}
          >
            Go to my deals
          </div>
          <div
            className="tap"
            role="button"
            tabIndex={0}
            onClick={() => {
              setResult(null);
              setTitle("");
              setAmount("");
              setSeller("");
              setChat("");
              setVerified(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && setResult(null)}
            style={{ marginTop: 12, fontSize: 13.5, color: "#9A9AA0" }}
          >
            Start another
          </div>
        </div>
      </main>
    );
  }

  // ---- Form view ----
  return (
    <main className="device" style={{ background: "#0B0B0D" }}>
      <div className="statusbar">
        <span>9:41</span>
        <span style={{ opacity: 0.7 }}>▂▃▄ ᯤ ▮</span>
      </div>

      <div style={{ padding: "16px 24px 40px" }}>
        <span
          className="tap"
          role="button"
          tabIndex={0}
          onClick={() => router.push("/dashboard")}
          onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard")}
          style={{ fontSize: 13, color: "#9A9AA0" }}
        >
          ← Back
        </span>

        <h1 style={{ marginTop: 14, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>New escrow</h1>
        <p style={{ marginTop: 8, fontSize: 14.5, color: "#9A9AA0" }}>
          Tell us about the deal. Our AI checks the seller and warns you before you pay.
        </p>

        <div style={{ marginTop: 24 }}>
          <label htmlFor="title" style={label}>What are you buying?</label>
          <input id="title" className="field" placeholder="e.g. iPhone 13 (128GB)" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginTop: 8 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <label htmlFor="amount" style={label}>Amount (₦)</label>
          <input id="amount" className="field" type="number" inputMode="numeric" placeholder="240000" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ marginTop: 8 }} />
        </div>

        <div style={{ marginTop: 16 }}>
          <label htmlFor="seller" style={label}>Seller name or handle</label>
          <input id="seller" className="field" placeholder="e.g. @gadgetstore_ng" value={seller} onChange={(e) => setSeller(e.target.value)} style={{ marginTop: 8 }} />
        </div>

        <div
          className="tap"
          role="button"
          tabIndex={0}
          onClick={() => setVerified((v) => !v)}
          onKeyDown={(e) => e.key === "Enter" && setVerified((v) => !v)}
          style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}
        >
          <span
            style={{
              width: 44,
              height: 26,
              borderRadius: 999,
              background: verified ? "#5fd08a" : "#2a2a2e",
              position: "relative",
              transition: "background .15s",
              flexShrink: 0,
            }}
          >
            <span style={{ position: "absolute", top: 3, left: verified ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
          </span>
          <span style={{ fontSize: 14, color: "#c9c9cf" }}>Seller says they&apos;re ID-verified (BVN/NIN)</span>
        </div>

        <div style={{ marginTop: 18 }}>
          <label htmlFor="chat" style={label}>Paste your chat with the seller (optional)</label>
          <textarea
            id="chat"
            className="field"
            placeholder="Paste the conversation so the AI can spot scam signals…"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            style={{ marginTop: 8, minHeight: 108, paddingTop: 12, paddingBottom: 12, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        {error && (
          <p role="alert" style={{ marginTop: 14, fontSize: 13, color: "#ff6b81", lineHeight: 1.5 }}>{error}</p>
        )}

        <div
          className="tap"
          role="button"
          tabIndex={0}
          aria-disabled={loading}
          onClick={handleCreate}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          style={{ marginTop: 22, height: 56, borderRadius: 14, background: "#E4144F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}
        >
          {loading ? "Checking the seller…" : "Create & check the seller"}
        </div>
      </div>
    </main>
  );
}

const label = {
  fontSize: 12,
  fontWeight: 600,
  color: "#9A9AA0",
} as const;
