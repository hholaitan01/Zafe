"use client";

/* ==========================================================================
   Screen 3 — Dashboard / Home
   Lists real escrow deals from the backend (GET /api/deals via the typed
   client). Works in demo mode today (seeded deals) and shows live data the
   moment the deal store goes to Supabase. Deliberately simple styling — this
   is a working data-wired screen for Deji to restyle over.
   ========================================================================== */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth";
import { ApiError, listDeals } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const STATUS_STYLE: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Created", bg: "#1e1e22", fg: "#c9c9cf" },
  funded: { label: "In escrow", bg: "#12314d", fg: "#7cc4ff" },
  shipped: { label: "Shipped", bg: "#3d2f10", fg: "#f5c451" },
  completed: { label: "Completed", bg: "#123020", fg: "#5fd08a" },
  disputed: { label: "Disputed", bg: "#3d1418", fg: "#ff6b81" },
  refunded: { label: "Refunded", bg: "#1e1e22", fg: "#c9c9cf" },
  resolved: { label: "Resolved", bg: "#2a1c3d", fg: "#c093f5" },
};

function trustColor(verdict?: string): string {
  if (verdict === "safe") return "#5fd08a";
  if (verdict === "caution") return "#f5c451";
  if (verdict === "risky") return "#ff6b81";
  return "#9A9AA0";
}

function money(amount: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listDeals()
      .then((d) => alive && setDeals(d))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Couldn't load your deals."));
    return () => {
      alive = false;
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <main className="device" style={{ background: "#0B0B0D" }}>
      {/* status bar */}
      <div className="statusbar">
        <span>9:41</span>
        <span style={{ opacity: 0.7 }}>▂▃▄ ᯤ ▮</span>
      </div>

      <div style={{ padding: "16px 20px 40px" }}>
        {/* top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Your deals</h1>
          <span
            className="tap"
            role="button"
            tabIndex={0}
            onClick={handleSignOut}
            onKeyDown={(e) => e.key === "Enter" && handleSignOut()}
            style={{ fontSize: 13, color: "#9A9AA0" }}
          >
            Sign out
          </span>
        </div>
        <p style={{ marginTop: 6, fontSize: 14, color: "#9A9AA0" }}>
          Money held safe until you confirm. Every deal shows its AI Trust Score.
        </p>

        {/* states */}
        {error && (
          <p role="alert" style={{ marginTop: 24, fontSize: 14, color: "#ff6b81" }}>
            {error}
          </p>
        )}
        {!deals && !error && (
          <p style={{ marginTop: 24, fontSize: 14, color: "#6d6d74" }}>Loading your deals…</p>
        )}
        {deals && deals.length === 0 && (
          <p style={{ marginTop: 24, fontSize: 14, color: "#6d6d74" }}>No deals yet. Start a new escrow to protect your first trade.</p>
        )}

        {/* deal list */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {deals?.map((deal) => {
            const s = STATUS_STYLE[deal.status];
            return (
              <div
                key={deal.id}
                className="tap"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/deal/${deal.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/deal/${deal.id}`)}
                style={{ background: "#141418", border: "1px solid #1e1e22", borderRadius: 16, padding: 16 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {deal.item.title}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "#6d6d74" }}>{deal.reference}</div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, background: s.bg, color: s.fg }}>
                    {s.label}
                  </span>
                </div>

                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
                    {money(deal.item.amount, deal.item.currency)}
                  </span>
                  {deal.trust && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#9A9AA0" }}>
                      Trust
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: trustColor(deal.trust.verdict),
                          background: "#1e1e22",
                          padding: "3px 9px",
                          borderRadius: 999,
                        }}
                      >
                        {deal.trust.score}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* new escrow */}
        <div
          className="tap"
          role="button"
          tabIndex={0}
          onClick={() => router.push("/new-escrow")}
          onKeyDown={(e) => e.key === "Enter" && router.push("/new-escrow")}
          style={{
            marginTop: 22,
            height: 54,
            borderRadius: 14,
            background: "#E4144F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          New escrow
        </div>
      </div>
    </main>
  );
}
