"use client";

/* Notifications — a real feed built from the timeline events of the user's
   deals (payment confirmed, shipped, released, disputes…), newest first. Now
   inside the responsive app shell; a row opens that deal's timeline. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_lib/AppShell";
import { EmptyState, Skeleton } from "@/app/_lib/States";
import { getCurrentUser } from "@/lib/auth";
import { getMyReputation, listMyDeals, listMySales, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
const DOT: Record<DealStatus, string> = {
  created: "#94A3B8", funded: "#A16207", shipped: "#059669", completed: "#059669",
  disputed: "#DC2626", under_review: "#7C3AED", refunded: "#64748B", resolved: "#4338CA",
};

interface Note { dealId: string; title: string; text: string; at: string; color: string }

export default function NotificationsPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [shell, setShell] = useState({ name: "", initials: "", score: undefined as number | undefined });

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
      const saleIds = new Set(selling.map((d) => d.id));
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      const list: Note[] = [];
      for (const d of byId.values()) {
        // For the seller, surface the incoming escrow itself (buyers see it as
        // "created" on their side, which we skip). This is the in-app half of
        // the seller notification; the other half is the email we send them.
        if (saleIds.has(d.id)) {
          list.push({ dealId: d.id, title: d.item.title, text: `New escrow — ${d.buyerEmail || "a buyer"} wants to pay you for this. Ship once it's funded.`, at: d.createdAt, color: "#059669" });
        }
        for (const e of d.timeline || []) {
          if (e.status === "created") continue;
          list.push({ dealId: d.id, title: d.item.title, text: e.note || e.label, at: e.at, color: DOT[e.status] || "#94A3B8" });
        }
      }
      list.sort((a, b) => b.at.localeCompare(a.at));
      setNotes(list.slice(0, 40));
      setShell({ name, initials, score: rep?.score });
    })();
    return () => { alive = false; };
  }, []);

  const open = (id: string) => { setCurrentDealId(id); router.push("/timeline"); };

  return (
    <AppShell current="activity" user={{ name: shell.name || "You", initials: shell.initials, score: shell.score }}>
      <style>{css}</style>

      <div className="tf-ph-head nt-head">
        <div><div className="tf-eyebrow">Activity</div><h1>Notifications</h1></div>
      </div>

      {notes == null ? (
        <div className="nt-list" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="nt-row" style={{ cursor: "default" }}>
              <span className="nt-dot" style={{ background: "#E2E8F0" }} />
              <span className="nt-main"><Skeleton w="45%" h={12} /><Skeleton w="80%" h={11} style={{ marginTop: 8 }} /></span>
              <Skeleton w={34} h={10} />
            </div>
          ))}
        </div>
      ) : notes.length ? (
        <div className="nt-list">
          {notes.map((n, i) => (
            <button key={i} className="nt-row" onClick={() => open(n.dealId)}>
              <span className="nt-dot" style={{ background: n.color }} />
              <span className="nt-main"><span className="nt-title">{n.title}</span><span className="nt-text">{n.text}</span></span>
              <span className="nt-time">{ago(n.at)}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>}
          title="No notifications yet"
        >
          Activity on your deals — payments, delivery, disputes — will show up here.
        </EmptyState>
      )}
    </AppShell>
  );
}

const css = `
.nt-head{ display:none }
.nt-list{ display:flex; flex-direction:column; gap:10px; max-width:720px }
.nt-empty{ padding:40px 20px; text-align:center; color:var(--faint); font-size:13.5px; line-height:1.5; background:#fff; border:1px dashed var(--line); border-radius:16px }
.nt-row{ width:100%; text-align:left; cursor:pointer; font-family:inherit; display:flex; gap:12px; align-items:flex-start; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); border-radius:16px; padding:14px 15px; transition:transform .12s var(--ease), box-shadow .18s var(--ease) }
@media (hover:hover) and (pointer:fine){ .nt-row:hover{ transform:translateY(-1px); box-shadow:var(--sh-2) } }
.nt-dot{ width:9px; height:9px; border-radius:50%; margin-top:5px; flex-shrink:0 }
.nt-main{ flex:1; min-width:0; display:flex; flex-direction:column }
.nt-title{ font-size:13.5px; font-weight:600 }
.nt-text{ font-size:12.5px; color:var(--muted); line-height:1.45; margin-top:2px }
.nt-time{ font-size:11px; color:var(--faint); white-space:nowrap; flex-shrink:0 }
@media (min-width:1024px){ .nt-head{ display:flex } }
`;
