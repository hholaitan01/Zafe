"use client";

/* Home (dashboard) — the OBIEX-inspired trust-fintech layout: an emerald
   "money held safe" hero, a row of round action buttons, the radial Trust Score
   dial, and the active-deals list. Real figures from deals + reputation, wired
   navigation, dark-mode aware (AppShell darkAware). */

import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/app/_lib/States";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { cacheDeals, getMyReputation, listMyDeals, loadUserProfile, naira, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const PILL: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Awaiting payment", bg: "var(--line-2)", fg: "var(--muted)" },
  funded: { label: "Funded", bg: "var(--safe-tint)", fg: "var(--safe-2)" },
  shipped: { label: "Delivered", bg: "#FEF3C7", fg: "#A16207" },
  completed: { label: "Released", bg: "var(--safe-tint)", fg: "var(--safe-2)" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#B91C1C" },
  under_review: { label: "Under review", bg: "#EDE9FE", fg: "#6D28D9" },
  refunded: { label: "Refunded", bg: "var(--line-2)", fg: "var(--muted)" },
  resolved: { label: "Resolved", bg: "#E0E7FF", fg: "#3730A3" },
};

function itemIcon(t: string, size = 20): React.ReactNode {
  let d: string;
  if (/iphone|phone|pixel|samsung|tecno|infinix/i.test(t)) d = "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18.5h4";
  else if (/mac|laptop|book|pc|dell|hp/i.test(t)) d = "M3 5h18v12H3zM2 20h20";
  else if (/airpod|pod|headphone|buds|sony|earbud/i.test(t)) d = "M4 14v-2a8 8 0 0 1 16 0v2M4 15h3v6H5a1 1 0 0 1-1-1zM20 15h-3v6h2a1 1 0 0 0 1-1z";
  else if (/ps5|playstation|xbox|console|game|nintendo|switch/i.test(t)) d = "M2 8h20v8H2zM7 12h3M8.5 10.5v3";
  else if (/jordan|sneaker|shoe|kick|air ?force|nike|adidas/i.test(t)) d = "M2 16h13l5 2h2v2H2zM2 16v-4l4-2 2 3 4-1";
  else d = "m3 8 9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8";
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function TxRow({ tx, onOpen }: { tx: Deal; onOpen: (id: string) => void }) {
  const p = PILL[tx.status];
  const who = tx.seller?.name || tx.buyerEmail || "Counterparty";
  return (
    <button className="dsh-row" onClick={() => onOpen(tx.id)}>
      <span className="dsh-row-ic">{itemIcon(tx.item.title)}</span>
      <span className="dsh-row-main">
        <span className="dsh-row-title">{tx.item.title}</span>
        <span className="dsh-row-sub">with {who}</span>
      </span>
      <span className="dsh-row-right">
        <span className="dsh-row-amt tf-mono">{naira(tx.item.amount)}</span>
        <span className="tf-pill" style={{ background: p.bg, color: p.fg }}>{p.label}</span>
      </span>
    </button>
  );
}

function SkelRow() {
  return (
    <div className="dsh-row" style={{ cursor: "default" }} aria-hidden>
      <span className="dsh-row-ic"><Skeleton circle w={40} h={40} /></span>
      <span className="dsh-row-main"><Skeleton w="55%" h={13} /><Skeleton w="38%" h={11} style={{ marginTop: 7 }} /></span>
      <Skeleton w={62} h={13} />
    </div>
  );
}

/** The radial Trust Score dial. Arc fills to the score; colour + verdict follow
    the safe / caution / risky bands. Track and text use tokens so it adapts to dark. */
function TrustDial({ score }: { score: number | null }) {
  const C = 326.726; // 2·π·52
  const s = Math.max(0, Math.min(100, score ?? 0));
  const offset = C * (1 - s / 100);
  const band =
    score == null ? { c: "#94A3B8", label: "Build your history" }
      : s >= 70 ? { c: "#059669", label: "Trusted trader" }
        : s >= 40 ? { c: "#A16207", label: "Building trust" }
          : { c: "#DC2626", label: "New here" };
  return (
    <div className="tf-card dsh-dial">
      <svg width="100" height="100" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
        <circle className="dsh-dial-track" cx="60" cy="60" r="52" fill="none" strokeWidth="12" />
        {score != null && (
          <circle cx="60" cy="60" r="52" fill="none" stroke={band.c} strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
        )}
        <text className="dsh-dial-num" x="60" y="57" textAnchor="middle" fontSize="32" fontWeight="700">{score ?? "—"}</text>
        <text className="dsh-dial-of" x="60" y="76" textAnchor="middle" fontSize="12" fontWeight="600">/ 100</text>
      </svg>
      <div className="dsh-dial-body">
        <div className="dsh-dial-head">
          <span className="dsh-dial-label">Your Trust Score</span>
          <span className="dsh-dial-verdict"><span className="dsh-dial-dot" style={{ background: band.c }} />{band.label}</span>
        </div>
        <div className="dsh-dial-bands">
          <span><i style={{ background: "#059669" }} />70 and up. Safe</span>
          <span><i style={{ background: "#A16207" }} />40 to 69. Caution</span>
          <span><i style={{ background: "#DC2626" }} />Below 40. Risky</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "", first: "there", initials: "", photo: "" });
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const u = await getCurrentUser().catch(() => null);
      const email = u?.email;
      const name = u?.name || (email ? email.split("@")[0] : "there");
      const initials = name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
      if (alive) setUser({ name, first: name.split(" ")[0], initials, photo: "" });
      const [d, rep, prof] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        getMyReputation(email, u?.name).catch(() => null),
        loadUserProfile(email).catch(() => null),
      ]);
      if (!alive) return;
      setDeals(d);
      cacheDeals(d);
      if (rep) setScore(rep.score);
      if (prof?.photo) setUser((p) => ({ ...p, photo: prof.photo }));
    })();
    return () => { alive = false; };
  }, []);

  const held = useMemo(() => {
    const list = deals || [];
    const inEscrow = list.filter((d) => d.status === "funded" || d.status === "shipped");
    return { total: inEscrow.reduce((s, d) => s + (d.item.amount || 0), 0), count: inEscrow.length };
  }, [deals]);

  const active = (deals || []).filter((d) => ["created", "funded", "shipped", "disputed", "under_review"].includes(d.status));
  const needsConfirm = (deals || []).find((d) => d.status === "shipped");
  const open = (id: string) => { setCurrentDealId(id); router.push("/timeline"); };
  const loading = deals == null;

  return (
    <AppShell darkAware current="dashboard" user={{ name: user.name || "You", initials: user.initials, photo: user.photo, score: score ?? undefined }}>
      <style>{css}</style>

      <div className="dsh-wrap">
        {/* Hero: money held safe */}
        <div className="dsh-hero">
          <div className="dsh-hero-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            Held safe in escrow
          </div>
          <div className="dsh-hero-val tf-mono">{loading ? <Skeleton w={150} h={34} style={{ marginTop: 8, background: "rgba(255,255,255,.25)" }} /> : naira(held.total)}</div>
          <div className="dsh-hero-sub">{held.count ? `Across ${held.count} active deal${held.count === 1 ? "" : "s"}` : "Nothing in escrow yet"}</div>
        </div>

        {/* Round action buttons */}
        <div className="dsh-actions">
          <Link href="/new-escrow" className="dsh-act">
            <span className="dsh-act-ic dsh-act--primary"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg></span>
            <span className="dsh-act-label">New deal</span>
          </Link>
          <Link href="/fund" className="dsh-act">
            <span className="dsh-act-ic"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg></span>
            <span className="dsh-act-label">Fund</span>
          </Link>
          {needsConfirm ? (
            <button className="dsh-act" onClick={() => open(needsConfirm.id)}>
              <span className="dsh-act-ic"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
              <span className="dsh-act-label">Release</span>
            </button>
          ) : (
            <Link href="/history" className="dsh-act">
              <span className="dsh-act-ic"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
              <span className="dsh-act-label">Release</span>
            </Link>
          )}
          <Link href="/support" className="dsh-act">
            <span className="dsh-act-ic"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></span>
            <span className="dsh-act-label">Support</span>
          </Link>
        </div>

        {/* AI nudge */}
        {needsConfirm && (
          <button className="dsh-ai" onClick={() => open(needsConfirm.id)}>
            <span className="dsh-ai-chip">AI</span>
            <span className="dsh-ai-text"><b>{needsConfirm.item.title}</b> is marked delivered and waiting on your confirmation. Review it before auto-release.</span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}

        {/* Trust Score dial */}
        <TrustDial score={score} />

        {/* Active deals */}
        <div className="dsh-sec">
          <span className="dsh-sec-title">Active deals</span>
          <Link href="/history" className="dsh-sec-link">See all</Link>
        </div>
        <div className="dsh-list">
          {loading ? (
            [0, 1, 2].map((i) => <SkelRow key={i} />)
          ) : active.length ? (
            active.map((tx) => <TxRow key={tx.id} tx={tx} onOpen={open} />)
          ) : (
            <div className="dsh-empty">
              <div className="dsh-empty-txt">No active deals yet. Start a protected deal and it shows up here.</div>
              <Link href="/new-escrow" className="tf-btn tf-btn--primary dsh-empty-cta"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Start a deal</Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const css = `
.dsh-wrap{ max-width:560px; margin:0 auto }

/* hero */
.dsh-hero{ border-radius:24px; padding:20px; color:#fff; background:linear-gradient(150deg,#059669 0%,#047857 100%); box-shadow:0 18px 38px -20px rgba(4,120,87,.55) }
.dsh-hero-label{ display:flex; align-items:center; gap:8px; font-size:12.5px; font-weight:600; letter-spacing:.02em; opacity:.92 }
.dsh-hero-val{ margin-top:12px; font-size:34px; font-weight:700; letter-spacing:-.02em; line-height:1 }
.dsh-hero-sub{ margin-top:5px; font-size:13px; font-weight:500; opacity:.9 }

/* round action buttons */
.dsh-actions{ margin-top:20px; display:grid; grid-template-columns:repeat(4,1fr); gap:8px }
.dsh-act{ display:flex; flex-direction:column; align-items:center; gap:8px; background:none; border:none; cursor:pointer; font-family:inherit; padding:0 }
.dsh-act-ic{ width:56px; height:56px; border-radius:18px; display:flex; align-items:center; justify-content:center; background:var(--safe-tint); color:var(--safe-2);
  transition:transform .14s var(--ease) }
.dsh-act:active .dsh-act-ic{ transform:scale(.94) }
.dsh-act--primary{ background:var(--safe); color:#fff; box-shadow:0 10px 20px -10px rgba(5,150,105,.55) }
.dsh-act-label{ font-size:12px; font-weight:600; color:var(--ink-2) }

/* AI nudge */
.dsh-ai{ width:100%; text-align:left; border:none; cursor:pointer; margin-top:18px; border-radius:16px; background:#0F172A; padding:14px 15px; display:flex; gap:12px; align-items:flex-start; font-family:inherit }
.dsh-ai-chip{ font-size:10px; font-weight:700; letter-spacing:.06em; color:#fff; background:#059669; padding:3px 7px; border-radius:5px; flex-shrink:0; margin-top:1px }
.dsh-ai-text{ flex:1; min-width:0; font-size:13px; line-height:1.5; color:rgba(255,255,255,.9) } .dsh-ai-text b{ color:#fff }

/* trust dial */
.dsh-dial{ margin-top:20px; padding:16px; display:flex; align-items:center; gap:16px }
.dsh-dial-track{ stroke:var(--line) }
.dsh-dial-num{ fill:var(--ink) }
.dsh-dial-of{ fill:var(--muted) }
.dsh-dial-body{ display:flex; flex-direction:column; gap:10px; flex-grow:1; min-width:0 }
.dsh-dial-head{ display:flex; flex-direction:column; gap:3px }
.dsh-dial-label{ font-size:12.5px; font-weight:600; color:var(--muted) }
.dsh-dial-verdict{ display:flex; align-items:center; gap:7px; font-size:15px; font-weight:700 }
.dsh-dial-dot{ width:8px; height:8px; border-radius:50% }
.dsh-dial-bands{ display:flex; flex-direction:column; gap:5px }
.dsh-dial-bands span{ display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--muted) }
.dsh-dial-bands i{ width:9px; height:9px; border-radius:3px }

/* sections + rows */
.dsh-sec{ display:flex; align-items:center; justify-content:space-between; margin:24px 0 12px }
.dsh-sec-title{ font-size:16px; font-weight:700; letter-spacing:-.01em }
.dsh-sec-link{ font-size:13px; font-weight:600; color:var(--safe) }
.dsh-list{ display:flex; flex-direction:column; gap:10px }

.dsh-row{ width:100%; text-align:left; cursor:pointer; font-family:inherit; display:flex; align-items:center; gap:12px;
  background:var(--card); border:1px solid var(--line); border-radius:16px; padding:13px 14px;
  transition:transform .12s var(--ease), border-color .18s var(--ease) }
@media (hover:hover) and (pointer:fine){ .dsh-row:hover{ transform:translateY(-1px); border-color:#CBD5E1 } }
.dsh-row-ic{ width:40px; height:40px; border-radius:12px; background:var(--line-2); color:var(--ink-2); display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.dsh-row-main{ min-width:0; display:flex; flex-direction:column; gap:2px; flex-grow:1 }
.dsh-row-title{ font-size:14.5px; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dsh-row-sub{ font-size:12.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dsh-row-right{ display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0 }
.dsh-row-amt{ font-size:14px; font-weight:700; color:var(--ink); letter-spacing:-.01em }
.dsh-row .tf-pill{ font-size:11px }

.dsh-empty{ padding:34px 18px; display:flex; flex-direction:column; align-items:center; gap:16px; text-align:center; background:var(--card); border:1px dashed var(--line); border-radius:16px }
.dsh-empty-txt{ color:var(--muted); font-size:13.5px; max-width:34ch }
.dsh-empty-cta{ align-self:center }

/* dark: keep the round-action wells legible (emerald icon on dark tint is too low-contrast) */
@media (prefers-color-scheme:dark){
  .tf-dark-aware .dsh-act-ic{ background:#1B2740; color:#CBD5E1 }
  .tf-dark-aware .dsh-act--primary{ background:var(--safe); color:#fff }
  .tf-dark-aware .dsh-ai{ background:#0A1424; border:1px solid var(--line) }
}
`;
