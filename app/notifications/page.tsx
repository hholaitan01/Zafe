"use client";

/* Notifications — a real feed built from the timeline events of the user's
   deals (payment confirmed, shipped, released, disputes…), newest first. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/notifications";
import { getCurrentUser } from "@/lib/auth";
import { listMyDeals, listMySales, setCurrentDealId } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}
function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
const DOT: Record<DealStatus, string> = {
  created: "#94A3B8",
  funded: "#A16207",
  shipped: "#059669",
  completed: "#059669",
  disputed: "#DC2626",
  refunded: "#64748B",
  resolved: "#4338CA",
};

interface Note {
  dealId: string;
  title: string;
  text: string;
  at: string;
  color: string;
}

function noteItem(n: Note): string {
  return `<div data-action="open" data-id="${n.dealId}" class="navbtn" style="border-radius:16px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:14px 15px; display:flex; gap:12px; align-items:flex-start;"><span style="width:9px; height:9px; border-radius:50%; background:${n.color}; margin-top:5px; flex-shrink:0;"></span><div style="flex:1; min-width:0;"><div style="font-size:13.5px; font-weight:600; color:#0F172A;">${esc(n.title)}</div><div style="font-size:12.5px; color:#64748B; line-height:1.45; margin-top:2px;">${esc(n.text)}</div></div><span style="font-size:11px; color:#94A3B8; white-space:nowrap;">${ago(n.at)}</span></div>`;
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
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      const notes: Note[] = [];
      for (const d of byId.values()) {
        for (const e of d.timeline || []) {
          if (e.status === "created") continue; // skip the noisy "created" event
          notes.push({ dealId: d.id, title: d.item.title, text: e.note || e.label, at: e.at, color: DOT[e.status] || "#9A9AA0" });
        }
      }
      notes.sort((a, b) => b.at.localeCompare(a.at));
      setData({
        items: notes.length
          ? notes.slice(0, 40).map(noteItem).join("")
          : `<div style="padding:22px 18px; text-align:center; color:#94A3B8; font-size:13.5px; line-height:1.5; background:#fff; border:1px solid #E6EAF0; border-radius:16px;">No notifications yet.<br>Activity on your deals shows up here.</div>`,
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
