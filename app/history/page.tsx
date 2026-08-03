"use client";

/* Activity — every deal the user is a party to (as buyer or seller). Desktop
   keeps the imported design's structure: a page head, a 4-cell summary strip,
   a filter-chip + search toolbar, then the transaction rows. It stacks to a
   mobile column inside AppShell. Filters and search are functional and
   client-side; tapping a row opens its timeline. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getMyReputation, listMyDeals, listMySales, naira, setCurrentDealId } from "@/lib/client";
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

type Row = Deal & { role: string };

const FILTERS: { id: string; label: string; match: (s: DealStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "active", label: "Active", match: (s) => ["created", "funded", "shipped"].includes(s) },
  { id: "funded", label: "Funded", match: (s) => s === "funded" },
  { id: "shipped", label: "Delivered", match: (s) => s === "shipped" },
  { id: "completed", label: "Released", match: (s) => s === "completed" || s === "resolved" },
  { id: "disputed", label: "Disputed", match: (s) => s === "disputed" },
];

function TxRow({ tx, onOpen }: { tx: Row; onOpen: (id: string) => void }) {
  const p = PILL[tx.status];
  const who = tx.seller?.name || tx.buyerEmail || "Counterparty";
  return (
    <button className="ac-row" onClick={() => onOpen(tx.id)}>
      <span className="ac-row-ic">{itemIcon(tx.item.title)}</span>
      <span className="ac-row-main">
        <span className="ac-row-title">{tx.item.title}</span>
        <span className="ac-row-sub tf-mono">{tx.id.slice(0, 10)} · {tx.role} · {who}</span>
      </span>
      <span className="ac-row-amt tf-mono">{naira(tx.item.amount)}</span>
      <span className="tf-pill" style={{ background: p.bg, color: p.fg }}><span className="dot" style={{ background: p.dot }} />{p.label}</span>
    </button>
  );
}

export default function ActivityPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [shell, setShell] = useState({ name: "", initials: "", photo: "", score: undefined as number | undefined });
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email;
      const name = user?.name || (email ? email.split("@")[0] : "there");
      const initials = name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
      const [buying, selling, rep] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        (email ? listMySales([email]) : Promise.resolve([] as Deal[])).catch(() => [] as Deal[]),
        getMyReputation(email, user?.name).catch(() => null),
      ]);
      if (!alive) return;
      const roles = new Map<string, string>();
      buying.forEach((d) => roles.set(d.id, "You bought"));
      selling.forEach((d) => roles.set(d.id, roles.has(d.id) ? "You bought" : "You're selling"));
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      const all: Row[] = [...byId.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((d) => ({ ...d, role: roles.get(d.id) || "" }));
      setRows(all);
      setShell({ name, initials, photo: "", score: rep?.score });
    })();
    return () => { alive = false; };
  }, []);

  const summary = useMemo(() => {
    const list = rows || [];
    const inEscrow = list.filter((d) => d.status === "funded" || d.status === "shipped").reduce((a, d) => a + (d.item.amount || 0), 0);
    const released = list.filter((d) => d.status === "completed" || d.status === "resolved").reduce((a, d) => a + (d.item.amount || 0), 0);
    const asBuyer = list.filter((d) => d.role === "You bought").length;
    const asSeller = list.filter((d) => d.role === "You're selling").length;
    return { inEscrow, released, asBuyer, asSeller };
  }, [rows]);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    const q = query.trim().toLowerCase();
    return (rows || []).filter((d) => {
      if (!f.match(d.status)) return false;
      if (!q) return true;
      const hay = `${d.item.title} ${d.id} ${d.seller?.name || ""} ${d.buyerEmail || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, filter, query]);

  const open = (id: string) => { setCurrentDealId(id); router.push("/timeline"); };

  return (
    <AppShell current="activity" user={{ name: shell.name || "You", initials: shell.initials, photo: shell.photo, score: shell.score }}>
      <style>{css}</style>

      <div className="tf-ph-head ac-head">
        <div><div className="tf-eyebrow">Activity</div><h1>All transactions</h1></div>
      </div>

      <div className="ac-summary">
        <div className="ac-sum-cell"><div className="ac-sum-label">In escrow</div><div className="ac-sum-val tf-mono">{naira(summary.inEscrow)}</div></div>
        <div className="ac-sum-cell"><div className="ac-sum-label">Released</div><div className="ac-sum-val tf-mono">{naira(summary.released)}</div></div>
        <div className="ac-sum-cell"><div className="ac-sum-label">As buyer</div><div className="ac-sum-val">{summary.asBuyer}</div></div>
        <div className="ac-sum-cell ac-sum-last"><div className="ac-sum-label">As seller</div><div className="ac-sum-val">{summary.asSeller}</div></div>
      </div>

      <div className="ac-toolbar">
        <div className="ac-chips">
          {FILTERS.map((f) => (
            <button key={f.id} className={`ac-chip${filter === f.id ? " is-on" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <div className="ac-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by ref, item, or seller" />
        </div>
      </div>

      <div className="ac-list">
        {rows == null ? (
          <div className="ac-empty">Loading your transactions…</div>
        ) : shown.length ? (
          shown.map((tx) => <TxRow key={tx.id} tx={tx} onOpen={open} />)
        ) : (
          <div className="ac-empty">{query || filter !== "all" ? "No transactions match this view." : "No deals yet. Your escrows, as buyer or seller, appear here."}</div>
        )}
      </div>
    </AppShell>
  );
}

const css = `
.ac-head{ display:none }

.ac-summary{ display:grid; grid-template-columns:repeat(2,1fr); border:1px solid var(--line); border-radius:16px; background:#fff; overflow:hidden; margin-bottom:18px; box-shadow:var(--sh-1) }
.ac-sum-cell{ padding:14px 16px; border-right:1px solid var(--line-2); border-bottom:1px solid var(--line-2) }
.ac-sum-cell:nth-child(2n){ border-right:none }
.ac-sum-cell:nth-child(n+3){ border-bottom:none }
.ac-sum-label{ font-size:10.5px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--faint) }
.ac-sum-val{ font-size:22px; font-weight:700; letter-spacing:-.02em; margin-top:5px; color:var(--ink) }

.ac-toolbar{ display:flex; flex-direction:column; gap:12px; margin-bottom:16px }
.ac-chips{ display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; -ms-overflow-style:none; scrollbar-width:none }
.ac-chips::-webkit-scrollbar{ display:none }
.ac-chip{ flex-shrink:0; padding:8px 14px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink-2); font-family:inherit; font-size:12.5px; font-weight:600; letter-spacing:.02em; cursor:pointer; transition:background .16s var(--ease), border-color .16s var(--ease), color .16s var(--ease) }
.ac-chip:hover{ border-color:#CBD5E1 }
.ac-chip.is-on{ background:var(--ink); border-color:var(--ink); color:#fff }
.ac-search{ display:flex; align-items:center; gap:9px; padding:0 14px; height:44px; border-radius:12px; background:#fff; border:1px solid var(--line); color:var(--faint); box-shadow:var(--sh-1) }
.ac-search input{ flex:1; min-width:0; border:none; outline:none; background:transparent; font-family:inherit; font-size:14px; color:var(--ink) }
.ac-search input::placeholder{ color:var(--faint) }

.ac-list{ display:flex; flex-direction:column; gap:10px }
.ac-empty{ padding:40px 20px; text-align:center; color:var(--faint); font-size:13.5px; line-height:1.5; background:#fff; border:1px dashed var(--line); border-radius:16px }

.ac-row{ width:100%; text-align:left; cursor:pointer; font-family:inherit; display:grid; grid-template-columns:44px 1fr auto; grid-template-areas:'ic main amt' 'ic main pill'; gap:2px 13px; align-items:center; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); border-radius:16px; padding:13px 15px; transition:transform .12s var(--ease), box-shadow .18s var(--ease) }
.ac-row:hover{ transform:translateY(-1px); box-shadow:var(--sh-2) }
.ac-row-ic{ grid-area:ic; width:44px; height:44px; border-radius:12px; background:#F1F5F9; display:flex; align-items:center; justify-content:center }
.ac-row-main{ grid-area:main; min-width:0; display:flex; flex-direction:column }
.ac-row-title{ font-size:14.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.ac-row-sub{ font-size:11.5px; color:var(--faint); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.ac-row-amt{ grid-area:amt; font-size:15px; font-weight:600; text-align:right; letter-spacing:-.01em }
.ac-row .tf-pill{ grid-area:pill; justify-self:end; margin-top:2px }

@media (min-width:1024px){
  .ac-head{ display:flex }
  .ac-summary{ grid-template-columns:repeat(4,1fr) }
  .ac-sum-cell{ border-bottom:none; padding:16px 18px }
  .ac-sum-cell:nth-child(2n){ border-right:1px solid var(--line-2) }
  .ac-sum-last{ border-right:none }
  .ac-sum-val{ font-size:26px }
  .ac-toolbar{ flex-direction:row; align-items:center; justify-content:space-between }
  .ac-search{ width:300px; flex-shrink:0 }
  .ac-row{ grid-template-columns:44px 1fr auto 150px; grid-template-areas:'ic main amt pill'; padding:14px 18px }
  .ac-row .tf-pill{ justify-self:end; margin-top:0 }
}
`;
