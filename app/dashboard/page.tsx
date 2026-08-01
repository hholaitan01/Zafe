"use client";

/* Dashboard — Deji's design, with the "Active escrows" list rendered from real
   deals (GET /api/deals). Tapping a card opens that deal's timeline. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/dashboard";
import { getCurrentUser } from "@/lib/auth";
import { getMyReputation, listMyDeals, naira, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const PILL: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Created", bg: "#1e1e22", fg: "#c9c9cf" },
  funded: { label: "Funded", bg: "rgba(224,162,60,.16)", fg: "#E0A23C" },
  shipped: { label: "Shipped", bg: "rgba(52,208,126,.15)", fg: "#34D07E" },
  completed: { label: "Completed", bg: "rgba(52,208,126,.15)", fg: "#34D07E" },
  disputed: { label: "Disputed", bg: "rgba(255,77,77,.16)", fg: "#FF4D4D" },
  refunded: { label: "Refunded", bg: "#1e1e22", fg: "#c9c9cf" },
  resolved: { label: "Resolved", bg: "rgba(124,58,237,.18)", fg: "#c093f5" },
};

function emoji(t: string): string {
  if (/iphone|phone|pixel|samsung/i.test(t)) return "📱";
  if (/mac|laptop|book|pc/i.test(t)) return "💻";
  if (/airpod|pod|headphone|buds/i.test(t)) return "🎧";
  if (/ps5|playstation|xbox|console|game/i.test(t)) return "🎮";
  if (/jordan|sneaker|shoe|kick|air ?force/i.test(t)) return "👟";
  if (/hair|bundle|wig/i.test(t)) return "💇🏽‍♀️";
  return "📦";
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

function card(d: Deal): string {
  const p = PILL[d.status];
  return `<div data-action="open" data-id="${d.id}" class="navbtn" style="border-radius:18px; background:#141416; border:1px solid #202024; padding:15px 16px; display:flex; align-items:center; gap:13px;"><div style="width:46px; height:46px; border-radius:13px; background:#1e1e22; display:flex; align-items:center; justify-content:center; font-size:20px;">${emoji(d.item.title)}</div><div style="flex:1; min-width:0;"><div style="font-size:14.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(d.item.title)}</div><div style="font-size:12.5px; color:#9A9AA0; margin-top:2px;">${naira(d.item.amount)} · ${esc(d.seller.name || "Seller")}</div></div><span style="padding:5px 10px; border-radius:999px; background:${p.bg}; color:${p.fg}; font-size:11px; font-weight:700; white-space:nowrap;">${p.label}</span></div>`;
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
      const [deals, rep] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        getMyReputation(email, user?.name).catch(() => null),
      ]);
      if (!alive) return;
      setData((prev) => ({
        ...prev,
        name,
        initials: initialsOf(name),
        greeting: greetingFor(new Date()),
        ...(rep ? { repScore: rep.score, repLabel: rep.tierLabel, ...(rep.summary ? { repSummary: rep.summary } : {}) } : {}),
        deals: deals.length
          ? deals.map(card).join("")
          : `<div style="padding:18px; text-align:center; color:#6d6d74; font-size:13px;">No escrows yet. Tap New Escrow to start one.</div>`,
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
