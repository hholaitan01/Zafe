"use client";

/* Dashboard — Deji's design, with the "Active escrows" list rendered from real
   deals (GET /api/deals). Tapping a card opens that deal's timeline. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getMyReputation, listMyDeals, loadUserProfile, naira, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const PILL: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Created", bg: "#F1F5F9", fg: "#475569" },
  funded: { label: "Funded", bg: "#FEF3C7", fg: "#A16207" },
  shipped: { label: "Shipped", bg: "#ECFDF5", fg: "#059669" },
  completed: { label: "Completed", bg: "#ECFDF5", fg: "#059669" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#DC2626" },
  refunded: { label: "Refunded", bg: "#F1F5F9", fg: "#475569" },
  resolved: { label: "Resolved", bg: "#E0E7FF", fg: "#3730A3" },
};

// Item glyph — a drawn SVG per category (no emoji as icons). Stroke slate.
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

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

// Initials for the avatar, e.g. "Ada Okafor" → "AO", "ada" → "AD".
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  const one = parts[0] || "?";
  return one.slice(0, 2).toUpperCase();
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
}

/** Proactive AI banner — surfaces a delivered deal awaiting confirmation.
    Empty when there's nothing to act on. Taps through to that deal. */
function aiBannerHtml(deal?: Deal): string {
  if (!deal) return "";
  const short = deal.id.slice(0, 12);
  return `<div data-action="open" data-id="${deal.id}" class="navbtn" style="margin-top:12px; border-radius:16px; background:#0F172A; padding:14px 15px; display:flex; gap:12px; align-items:flex-start;"><span style="font-size:10px; font-weight:700; letter-spacing:.06em; color:#fff; background:#059669; padding:3px 7px; border-radius:5px; flex-shrink:0; margin-top:1px;">AI</span><div style="flex:1; min-width:0; font-size:13px; line-height:1.5; color:rgba(255,255,255,.9);"><b style="color:#fff;">${esc(deal.item.title)}</b> is marked shipped and waiting on your confirmation. Check it before the auto-dispute window opens.</div><svg width="17" height="17" viewBox="0 0 24 24" stroke="rgba(255,255,255,.5)" stroke-width="2" fill="none" style="flex-shrink:0; margin-top:2px;"><path d="M9 18l6-6-6-6"/></svg></div>`;
}

function card(d: Deal): string {
  const p = PILL[d.status];
  return `<div data-action="open" data-id="${d.id}" class="navbtn" style="border-radius:18px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:14px 15px; display:flex; align-items:center; gap:13px;"><div style="width:46px; height:46px; border-radius:13px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;">${itemIcon(d.item.title)}</div><div style="flex:1; min-width:0;"><div style="font-size:14.5px; font-weight:600; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(d.item.title)}</div><div style="font-size:12.5px; color:#64748B; margin-top:2px;">${naira(d.item.amount)} · ${esc(d.seller.name || "Seller")}</div></div><span style="padding:5px 10px; border-radius:999px; background:${p.bg}; color:${p.fg}; font-size:11px; font-weight:700; white-space:nowrap;">${p.label}</span></div>`;
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email;
      const name = user?.name || (email ? email.split("@")[0] : "there");
      // Identity + greeting render immediately; the real deals and reputation
      // (computed server-side from this trader's history) fill in as they load.
      if (alive) {
        setData((prev) => ({ ...prev, name, initials: initialsOf(name), greeting: greetingFor(new Date()) }));
      }
      const [deals, rep, profile] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        getMyReputation(email, user?.name).catch(() => null),
        loadUserProfile(email).catch(() => null),
      ]);
      if (!alive) return;
      // Money genuinely held right now = deals whose funds are in escrow
      // (funded or shipped: paid in, not yet released/refunded).
      const held = deals.filter((d) => d.status === "funded" || d.status === "shipped");
      const heldTotal = held.reduce((sum, d) => sum + (d.item.amount || 0), 0);
      const active = deals.filter((d) => d.status === "created" || d.status === "funded" || d.status === "shipped");
      const total = rep?.stats?.total ?? deals.length;
      const completed = rep?.stats?.completed ?? deals.filter((d) => d.status === "completed").length;
      // Proactive AI insight: a shipped deal is delivered and awaiting the
      // buyer's confirmation — the one thing worth nudging about.
      const needsConfirm = deals.find((d) => d.status === "shipped");
      setData((prev) => ({
        ...prev,
        name,
        initials: initialsOf(name),
        greeting: greetingFor(new Date()),
        ...(profile?.photo ? { photo: profile.photo } : {}),
        ...(rep ? { score: rep.score, repLabel: rep.tierLabel } : {}),
        heldAmount: heldTotal > 0 ? naira(heldTotal) : "₦0",
        heldSub:
          heldTotal > 0
            ? `Across ${held.length} active deal${held.length === 1 ? "" : "s"}. Released only when you confirm.`
            : "Nothing in escrow yet. Start a protected deal and your money stays locked until you confirm.",
        kpiSuccess: `${completed}/${total}`,
        kpiActive: active.length,
        aiBanner: aiBannerHtml(needsConfirm),
        deals: deals.length
          ? deals.map(card).join("")
          : `<div style="padding:22px 18px; text-align:center; color:#94A3B8; font-size:13.5px; line-height:1.5; background:#fff; border:1px solid #E6EAF0; border-radius:16px;">No escrows yet.<br>Tap New Escrow to protect your first deal.</div>`,
      }));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    open: (_fields: Record<string, string>, el: HTMLElement) => {
      const id = el.getAttribute("data-id");
      if (id) {
        setCurrentDealId(id);
        router.push("/timeline");
      }
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
