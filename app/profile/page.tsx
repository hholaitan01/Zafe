"use client";

/* Profile — the account hub, bound to the signed-in user: name, initials, real
   reputation, completed-deal history, plus Sign out and a link to sell. (Was
   hardcoded "Ada Okafor / 92" in the design.) */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/profile";
import { getCurrentUser, signOut } from "@/lib/auth";
import { getMyReputation, listMyDeals, naira } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}
function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}
function emoji(t: string): string {
  if (/iphone|phone|pixel|samsung/i.test(t)) return "📱";
  if (/mac|laptop|book|pc/i.test(t)) return "💻";
  if (/airpod|pod|headphone|buds|sony/i.test(t)) return "🎧";
  if (/ps5|playstation|xbox|console|game/i.test(t)) return "🎮";
  if (/jordan|sneaker|shoe|kick|nike|air ?force/i.test(t)) return "👟";
  if (/hair|bundle|wig/i.test(t)) return "💇🏽‍♀️";
  return "📦";
}
const DONE_LABEL: Record<string, string> = { completed: "released", resolved: "resolved", refunded: "refunded" };

function completedCard(d: Deal): string {
  return `<div style="border-radius:16px; background:#141416; border:1px solid #202024; padding:13px 15px; display:flex; align-items:center; gap:12px;"><div style="width:38px; height:38px; border-radius:11px; background:#1e1e22; display:flex; align-items:center; justify-content:center;">${emoji(d.item.title)}</div><div style="flex:1; min-width:0;"><div style="font-size:13.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(d.item.title)}</div><div style="font-size:11.5px; color:#6d6d74;">${naira(d.item.amount)} · ${DONE_LABEL[d.status] ?? d.status}</div></div></div>`;
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
      if (alive) setData((p) => ({ ...p, name, initials: initialsOf(name) }));

      const [deals, rep] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        getMyReputation(email, user?.name).catch(() => null),
      ]);
      if (!alive) return;
      const done = deals.filter((d) => d.status === "completed" || d.status === "resolved" || d.status === "refunded");
      setData((p) => ({
        ...p,
        name,
        initials: initialsOf(name),
        ...(rep ? { scoreLine: `Trust Score ${rep.score} · ${rep.tierLabel}` } : {}),
        payout: "Not set — tap Edit to add",
        completed: done.length
          ? done.map(completedCard).join("")
          : `<div style="padding:16px; text-align:center; color:#6d6d74; font-size:13px;">No completed deals yet.</div>`,
      }));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    signout: async () => {
      try {
        await signOut();
      } catch {
        /* proceed to login regardless */
      }
      router.push("/login");
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
