"use client";

/* Activity — every deal the user is a party to (as buyer or seller). Modelled
   on a bank transaction history: results are grouped by month with an In / Out
   summary per group, each row signs its amount by direction and carries a clean
   status pill (no leading dot). Filters and search run client-side. Desktop and
   mobile share the layout inside AppShell; a row opens that deal's timeline. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getMyReputation, listMyDeals, listMySales, naira, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const PILL: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Awaiting payment", bg: "#F1F5F9", fg: "#475569" },
  funded: { label: "Funded", bg: "#ECFDF5", fg: "#047857" },
  shipped: { label: "Delivered", bg: "#FEF3C7", fg: "#A16207" },
  completed: { label: "Successful", bg: "#ECFDF5", fg: "#047857" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#B91C1C" },
  refunded: { label: "Refunded", bg: "#F1F5F9", fg: "#475569" },
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
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

type Row = Deal & { role: string; incoming: boolean };

const FILTERS: { id: string; label: string; match: (s: DealStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "active", label: "Active", match: (s) => ["created", "funded", "shipped"].includes(s) },
  { id: "funded", label: "Funded", match: (s) => s === "funded" },
  { id: "shipped", label: "Delivered", match: (s) => s === "shipped" },
  { id: "completed", label: "Successful", match: (s) => s === "completed" || s === "resolved" },
  { id: "disputed", label: "Disputed", match: (s) => s === "disputed" },
];

function monthKey(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const m = d.toLocaleDateString("en-NG", { month: "long" });
  return d.getFullYear() === now.getFullYear() ? m : `${m} ${d.getFullYear()}`;
}
function rowDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const ord = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${d.toLocaleDateString("en-NG", { month: "short" })} ${day}${ord}, ${d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
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
      const sellerIds = new Set(selling.map((d) => d.id));
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      const all: Row[] = [...byId.values()]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((d) => {
          const isSeller = sellerIds.has(d.id) && !buying.some((b) => b.id === d.id);
          return { ...d, role: isSeller ? "You're selling" : "You bought", incoming: isSeller };
        });
      setRows(all);
      setShell({ name, initials, photo: "", score: rep?.score });
    })();
    return () => { alive = false; };
  }, []);

  const shown = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter) || FILTERS[0];
    const q = query.trim().toLowerCase();
    return (rows || []).filter((d) => {
      if (!f.match(d.status)) return false;
      if (!q) return true;
      return `${d.item.title} ${d.id} ${d.seller?.name || ""} ${d.buyerEmail || ""}`.toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  // group the filtered rows by month, newest month first
  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of shown) {
      const k = monthKey(r.createdAt);
      (map.get(k) || map.set(k, []).get(k)!).push(r);
    }
    return [...map.entries()].map(([month, items]) => {
      const inTotal = items.filter((d) => d.incoming && (d.status === "completed" || d.status === "resolved")).reduce((a, d) => a + d.item.amount, 0);
      const outTotal = items.filter((d) => !d.incoming).reduce((a, d) => a + d.item.amount, 0);
      return { month, items, inTotal, outTotal };
    });
  }, [shown]);

  const open = (id: string) => { setCurrentDealId(id); router.push("/timeline"); };

  return (
    <AppShell current="activity" user={{ name: shell.name || "You", initials: shell.initials, photo: shell.photo, score: shell.score }}>
      <style>{css}</style>

      <div className="tf-ph-head ac-head">
        <div><div className="tf-eyebrow">Activity</div><h1>All transactions</h1></div>
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

      {rows == null ? (
        <div className="ac-empty">Loading your transactions…</div>
      ) : groups.length ? (
        <div className="ac-groups">
          {groups.map((g) => (
            <section key={g.month} className="tf-card ac-group">
              <header className="ac-group-head">
                <span className="ac-month">{g.month}</span>
                <span className="ac-inout">
                  <span className="ac-in">In <b className="tf-mono">{naira(g.inTotal)}</b></span>
                  <span className="ac-out">Out <b className="tf-mono">{naira(g.outTotal)}</b></span>
                </span>
              </header>
              <div className="ac-rows">
                {g.items.map((tx) => {
                  const p = PILL[tx.status];
                  return (
                    <button key={tx.id} className="ac-row" onClick={() => open(tx.id)}>
                      <span className="ac-ic">{itemIcon(tx.item.title)}</span>
                      <span className="ac-main">
                        <span className="ac-title">{tx.item.title}</span>
                        <span className="ac-date tf-mono">{rowDate(tx.createdAt)}</span>
                      </span>
                      <span className="ac-right">
                        <span className={`ac-amt tf-mono${tx.incoming ? " ac-amt-in" : ""}`}>{tx.incoming ? "+" : "-"}{naira(tx.item.amount)}</span>
                        <span className="ac-pill" style={{ background: p.bg, color: p.fg }}>{p.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="ac-empty">{query || filter !== "all" ? "No transactions match this view." : "No deals yet. Your escrows, as buyer or seller, appear here."}</div>
      )}
    </AppShell>
  );
}

const css = `
.ac-head{ display:none }

.ac-toolbar{ display:flex; flex-direction:column; gap:12px; margin-bottom:16px }
.ac-chips{ display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; -ms-overflow-style:none; scrollbar-width:none }
.ac-chips::-webkit-scrollbar{ display:none }
.ac-chip{ flex-shrink:0; padding:8px 14px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--ink-2); font-family:inherit; font-size:12.5px; font-weight:600; letter-spacing:.02em; cursor:pointer; transition:background .16s var(--ease), border-color .16s var(--ease), color .16s var(--ease) }
.ac-chip:hover{ border-color:#CBD5E1 }
.ac-chip.is-on{ background:var(--ink); border-color:var(--ink); color:#fff }
.ac-search{ display:flex; align-items:center; gap:9px; padding:0 14px; height:44px; border-radius:12px; background:#fff; border:1px solid var(--line); color:var(--faint); box-shadow:var(--sh-1) }
.ac-search input{ flex:1; min-width:0; border:none; outline:none; background:transparent; font-family:inherit; font-size:14px; color:var(--ink) }
.ac-search input::placeholder{ color:var(--faint) }

.ac-groups{ display:flex; flex-direction:column; gap:16px }
.ac-group{ padding:6px 4px 4px }
.ac-group-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px 12px }
.ac-month{ font-size:16px; font-weight:700; letter-spacing:-.01em }
.ac-inout{ display:flex; gap:16px; font-size:12.5px; color:var(--muted) } .ac-inout b{ font-weight:600 }
.ac-in b{ color:var(--safe) } .ac-out b{ color:var(--ink) }

.ac-rows{ display:flex; flex-direction:column }
.ac-row{ width:100%; text-align:left; cursor:pointer; font-family:inherit; background:none; border:none; border-top:1px solid var(--line-2); display:flex; align-items:center; gap:13px; padding:14px }
.ac-row:hover{ background:var(--bg) }
.ac-ic{ width:44px; height:44px; border-radius:13px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.ac-main{ flex:1; min-width:0; display:flex; flex-direction:column }
.ac-title{ font-size:14.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.ac-date{ font-size:11.5px; color:var(--faint); margin-top:3px }
.ac-right{ display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0 }
.ac-amt{ font-size:14.5px; font-weight:700; letter-spacing:-.01em; color:var(--ink) }
.ac-amt-in{ color:var(--safe) }
.ac-pill{ display:inline-flex; align-items:center; padding:3px 9px; border-radius:8px; font-size:11px; font-weight:600; letter-spacing:.01em; white-space:nowrap }

.ac-empty{ padding:40px 20px; text-align:center; color:var(--faint); font-size:13.5px; line-height:1.5; background:#fff; border:1px dashed var(--line); border-radius:16px }

@media (min-width:1024px){
  .ac-head{ display:flex }
  .ac-toolbar{ flex-direction:row; align-items:center; justify-content:space-between }
  .ac-search{ width:300px; flex-shrink:0 }
  .ac-group{ padding:8px 8px 6px }
  .ac-group-head{ padding:14px 16px }
  .ac-row{ padding:15px 16px }
}
`;
