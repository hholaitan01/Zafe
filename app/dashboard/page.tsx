"use client";

/* Dashboard — responsive. Desktop keeps the Claude Design structure (page head,
   proactive AI banner, a 4-KPI row, an active-transactions list); it collapses
   to a stacked mobile view inside AppShell. Built in our navy/emerald light
   system. All figures come from real deals + reputation. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getMyReputation, listMyDeals, loadUserProfile, naira, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const PILL: Record<DealStatus, { label: string; bg: string; fg: string; dot: string }> = {
  created: { label: "Awaiting payment", bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  funded: { label: "Funded", bg: "#ECFDF5", fg: "#047857", dot: "#10B981" },
  shipped: { label: "Delivered", bg: "#FEF3C7", fg: "#A16207", dot: "#E89914" },
  completed: { label: "Released", bg: "#ECFDF5", fg: "#047857", dot: "#10B981" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#B91C1C", dot: "#DC2626" },
  refunded: { label: "Refunded", bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  resolved: { label: "Resolved", bg: "#E0E7FF", fg: "#3730A3", dot: "#6366F1" },
};

function itemIcon(t: string, size = 20): React.ReactNode {
  let d: string;
  if (/iphone|phone|pixel|samsung|tecno|infinix/i.test(t)) d = "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18.5h4";
  else if (/mac|laptop|book|pc|dell|hp/i.test(t)) d = "M3 5h18v12H3zM2 20h20";
  else if (/airpod|pod|headphone|buds|sony|earbud/i.test(t)) d = "M4 14v-2a8 8 0 0 1 16 0v2M4 15h3v6H5a1 1 0 0 1-1-1zM20 15h-3v6h2a1 1 0 0 0 1-1z";
  else if (/ps5|playstation|xbox|console|game|nintendo|switch/i.test(t)) d = "M2 8h20v8H2zM7 12h3M8.5 10.5v3";
  else if (/jordan|sneaker|shoe|kick|air ?force|nike|adidas/i.test(t)) d = "M2 16h13l5 2h2v2H2zM2 16v-4l4-2 2 3 4-1";
  else d = "m3 8 9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8";
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function relTime(iso?: string): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function TxRow({ tx, onOpen }: { tx: Deal; onOpen: (id: string) => void }) {
  const p = PILL[tx.status];
  const who = tx.seller?.name || tx.buyerEmail || "Counterparty";
  return (
    <button className="dsh-row" onClick={() => onOpen(tx.id)}>
      <span className="dsh-row-ic">{itemIcon(tx.item.title)}</span>
      <span className="dsh-row-main">
        <span className="dsh-row-title">{tx.item.title}</span>
        <span className="dsh-row-sub tf-mono">{tx.id.slice(0, 10)} · {who}</span>
      </span>
      <span className="dsh-row-amt tf-mono">{naira(tx.item.amount)}</span>
      <span className="tf-pill" style={{ background: p.bg, color: p.fg }}>{p.label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState({ name: "", first: "there", initials: "", photo: "" });
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState("");

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
      if (rep) { setScore(rep.score); setTier(rep.tierLabel); }
      if (prof?.photo) setUser((p) => ({ ...p, photo: prof.photo }));
    })();
    return () => { alive = false; };
  }, []);

  const kpis = useMemo(() => {
    const list = deals || [];
    const held = list.filter((d) => d.status === "funded" || d.status === "shipped");
    const heldTotal = held.reduce((s, d) => s + (d.item.amount || 0), 0);
    const active = list.filter((d) => ["created", "funded", "shipped"].includes(d.status));
    const funded = list.filter((d) => d.status === "funded").length;
    const delivered = list.filter((d) => d.status === "shipped").length;
    const completed = list.filter((d) => d.status === "completed" || d.status === "resolved").length;
    const disputed = list.filter((d) => d.status === "disputed").length;
    return { heldTotal, held: held.length, active: active.length, funded, delivered, completed, total: list.length, disputed };
  }, [deals]);

  const needsConfirm = (deals || []).find((d) => d.status === "shipped");
  const active = (deals || []).filter((d) => ["created", "funded", "shipped", "disputed"].includes(d.status));
  const riskLabel = score == null ? "" : score >= 70 ? "low risk" : score >= 40 ? "medium risk" : "building trust";
  const open = (id: string) => { setCurrentDealId(id); router.push("/timeline"); };

  return (
    <AppShell current="dashboard" user={{ name: user.name || "You", initials: user.initials, photo: user.photo, score: score ?? undefined }}>
      <style>{css}</style>

      <div className="tf-ph-head dsh-head">
        <div><div className="tf-eyebrow">Good day</div><h1>{user.first}&apos;s dashboard</h1></div>
        <Link href="/new-escrow" className="tf-btn tf-btn--primary"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>New transaction</Link>
      </div>

      {needsConfirm && (
        <button className="dsh-ai" onClick={() => open(needsConfirm.id)}>
          <span className="dsh-ai-chip">AI</span>
          <span className="dsh-ai-text"><b>{needsConfirm.item.title}</b> is marked delivered and waiting on your confirmation. Review it before the auto-dispute window opens.</span>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      <div className="dsh-kpis">
        <div className="tf-card dsh-kpi dsh-kpi-hero">
          <div className="tf-eyebrow">Held in escrow</div>
          <div className="dsh-kpi-val tf-mono"><span className="dsh-naira">₦</span>{naira(kpis.heldTotal).replace("₦", "")}</div>
          <div className="dsh-kpi-sub">{kpis.held ? `Across ${kpis.held} active deal${kpis.held === 1 ? "" : "s"}` : "Nothing in escrow yet"}</div>
        </div>
        <div className="tf-card dsh-kpi">
          <div className="tf-eyebrow">Trust Score</div>
          <div className="dsh-kpi-val" style={{ color: "var(--safe)" }}>{score ?? "—"}</div>
          <div className="dsh-kpi-sub">{score == null ? "Build your history" : `Out of 100 · ${riskLabel}`}</div>
        </div>
        <div className="tf-card dsh-kpi">
          <div className="tf-eyebrow">Successful</div>
          <div className="dsh-kpi-val">{kpis.completed} <span className="dsh-kpi-slash">/ {kpis.total}</span></div>
          <div className="dsh-kpi-sub">{kpis.disputed ? `${kpis.disputed} in dispute` : tier || "No disputes"}</div>
        </div>
        <div className="tf-card dsh-kpi">
          <div className="tf-eyebrow">Active</div>
          <div className="dsh-kpi-val">{kpis.active}</div>
          <div className="dsh-kpi-sub">{kpis.funded} funded · {kpis.delivered} delivered</div>
        </div>
      </div>

      <div className="dsh-sec">
        <span className="dsh-sec-title">Active transactions</span>
        <Link href="/history" className="dsh-sec-link">View all</Link>
      </div>
      <div className="dsh-list">
        {deals == null ? (
          <div className="dsh-empty">Loading your transactions…</div>
        ) : active.length ? (
          active.map((tx) => <TxRow key={tx.id} tx={tx} onOpen={open} />)
        ) : (
          <div className="dsh-empty">No active transactions. Start a protected deal to see it here.</div>
        )}
      </div>
    </AppShell>
  );
}

const css = `
.dsh-head{ display:none }
.dsh-ai{ width:100%; text-align:left; border:none; cursor:pointer; margin-bottom:16px; border-radius:16px; background:#0F172A; padding:14px 15px; display:flex; gap:12px; align-items:flex-start; font-family:inherit }
.dsh-ai-chip{ font-size:10px; font-weight:700; letter-spacing:.06em; color:#fff; background:#059669; padding:3px 7px; border-radius:5px; flex-shrink:0; margin-top:1px }
.dsh-ai-text{ flex:1; min-width:0; font-size:13px; line-height:1.5; color:rgba(255,255,255,.9) } .dsh-ai-text b{ color:#fff }

.dsh-kpis{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:26px }
.dsh-kpi{ padding:16px 17px }
.dsh-kpi-hero{ grid-column:1 / -1; background:radial-gradient(120% 130% at 88% 0%, #14304A 0%, #0F172A 58%); border:none; color:#fff }
.dsh-kpi-hero .tf-eyebrow{ color:#6EE7B7 }
.dsh-kpi-val{ font-size:30px; font-weight:700; letter-spacing:-.03em; line-height:1.05; margin-top:6px; color:var(--ink) }
.dsh-kpi-hero .dsh-kpi-val{ color:#fff; font-size:38px }
.dsh-naira{ color:#93A4BC; margin-right:1px }
.dsh-kpi-slash{ font-size:16px; font-weight:500; color:var(--faint) }
.dsh-kpi-sub{ font-size:12px; color:var(--muted); margin-top:4px } .dsh-kpi-hero .dsh-kpi-sub{ color:#93A4BC }

.dsh-sec{ display:flex; align-items:center; justify-content:space-between; margin-bottom:12px }
.dsh-sec-title{ font-size:17px; font-weight:700; letter-spacing:-.01em }
.dsh-sec-link{ font-size:13.5px; font-weight:600; color:var(--safe) }
.dsh-list{ display:flex; flex-direction:column; gap:10px }
.dsh-empty{ padding:26px 18px; text-align:center; color:var(--faint); font-size:13.5px; background:#fff; border:1px dashed var(--line); border-radius:16px }

.dsh-row{ width:100%; text-align:left; cursor:pointer; font-family:inherit; display:grid; grid-template-columns:44px 1fr auto; grid-template-areas:'ic main amt' 'ic main pill'; gap:2px 13px; align-items:center; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); border-radius:16px; padding:13px 15px; transition:transform .12s var(--ease), box-shadow .18s var(--ease) }
.dsh-row:hover{ transform:translateY(-1px); box-shadow:var(--sh-2) }
.dsh-row-ic{ grid-area:ic; width:44px; height:44px; border-radius:12px; background:#F1F5F9; display:flex; align-items:center; justify-content:center }
.dsh-row-main{ grid-area:main; min-width:0; display:flex; flex-direction:column }
.dsh-row-title{ font-size:14.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dsh-row-sub{ font-size:11.5px; color:var(--faint); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dsh-row-amt{ grid-area:amt; font-size:15px; font-weight:600; text-align:right; letter-spacing:-.01em }
.dsh-row .tf-pill{ grid-area:pill; justify-self:end; margin-top:2px }

@media (min-width:1024px){
  .dsh-head{ display:flex }
  .dsh-kpis{ grid-template-columns:repeat(4,1fr) }
  .dsh-kpi-hero{ grid-column:auto }
  .dsh-kpi-hero .dsh-kpi-val{ font-size:30px }
  .dsh-row{ grid-template-columns:44px 1fr auto 150px; grid-template-areas:'ic main amt pill'; align-items:center; padding:14px 18px }
  .dsh-row-amt{ text-align:right } .dsh-row .tf-pill{ justify-self:end; margin-top:0 }
}
`;
