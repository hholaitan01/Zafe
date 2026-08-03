"use client";

/* History — every deal the user is a party to (as buyer or seller), newest
   first. Tapping one opens its timeline. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/history";
import { getCurrentUser } from "@/lib/auth";
import { listMyDeals, listMySales, naira, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}
// Drawn SVG per item category (no emoji as icons).
function itemIcon(t: string): string {
  let d: string;
  if (/iphone|phone|pixel|samsung|tecno|infinix/i.test(t)) d = '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>';
  else if (/mac|laptop|book|pc|dell|hp/i.test(t)) d = '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M2 20h20"/>';
  else if (/airpod|pod|headphone|buds|sony|earbud/i.test(t)) d = '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13.5" width="4" height="6.5" rx="1.6"/><rect x="17" y="13.5" width="4" height="6.5" rx="1.6"/>';
  else if (/ps5|playstation|xbox|console|game|nintendo|switch/i.test(t)) d = '<rect x="2" y="7" width="20" height="10" rx="4.5"/><path d="M7 12h3M8.5 10.5v3" stroke-linecap="round"/><circle cx="16" cy="11" r="1.1"/><circle cx="18" cy="13.5" r="1.1"/>';
  else if (/jordan|sneaker|shoe|kick|air ?force|nike|adidas/i.test(t)) d = '<path d="M2 16h13l5 2h2v2H2z"/><path d="M2 16v-4l4-2 2 3 4-1"/>';
  else d = '<path d="m3 8 9-5 9 5v8l-9 5-9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>';
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}
const PILL: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Created", bg: "#F1F5F9", fg: "#475569" },
  funded: { label: "Funded", bg: "#FEF3C7", fg: "#A16207" },
  shipped: { label: "Shipped", bg: "#ECFDF5", fg: "#059669" },
  completed: { label: "Completed", bg: "#ECFDF5", fg: "#059669" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#DC2626" },
  refunded: { label: "Refunded", bg: "#F1F5F9", fg: "#475569" },
  resolved: { label: "Resolved", bg: "#E0E7FF", fg: "#3730A3" },
};

function card(d: Deal, role: string): string {
  const p = PILL[d.status];
  return `<div data-action="open" data-id="${d.id}" class="navbtn" style="border-radius:18px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:14px 15px; display:flex; align-items:center; gap:13px;"><div style="width:46px; height:46px; border-radius:13px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;">${itemIcon(d.item.title)}</div><div style="flex:1; min-width:0;"><div style="font-size:14.5px; font-weight:600; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(d.item.title)}</div><div style="font-size:12.5px; color:#64748B; margin-top:2px;">${naira(d.item.amount)} · ${role}</div></div><span style="padding:5px 10px; border-radius:999px; background:${p.bg}; color:${p.fg}; font-size:11px; font-weight:700; white-space:nowrap;">${p.label}</span></div>`;
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email;
      const [buying, selling] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        (email ? listMySales([email]) : Promise.resolve([] as Deal[])).catch(() => [] as Deal[]),
      ]);
      if (!alive) return;
      // Merge (a deal could appear in both), tag the user's role, newest first.
      const roles = new Map<string, string>();
      buying.forEach((d) => roles.set(d.id, "You bought"));
      selling.forEach((d) => roles.set(d.id, roles.has(d.id) ? "You bought" : "You're selling"));
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      const all = [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setData({
        deals: all.length
          ? all.map((d) => card(d, roles.get(d.id) || "")).join("")
          : `<div style="padding:22px 18px; text-align:center; color:#94A3B8; font-size:13.5px; line-height:1.5; background:#fff; border:1px solid #E6EAF0; border-radius:16px;">No deals yet.<br>Your escrows, as buyer or seller, appear here.</div>`,
      });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    open: (_f: Record<string, string>, el: HTMLElement) => {
      const id = el.getAttribute("data-id");
      if (id) {
        setCurrentDealId(id);
        router.push("/timeline");
      }
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
