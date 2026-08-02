"use client";

/* My sales — deals where the signed-in user is the seller. Shows each sale's
   status and lets the seller mark a funded deal as shipped (which mints the
   buyer's handover code). "Request a payment" starts a seller-initiated deal. */

import { useEffect, useRef, useState } from "react";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/selling";
import { getCurrentUser } from "@/lib/auth";
import { getSellerProfile, listMySales, loadSellerProfile, naira, shipDeal } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

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

const PILL: Record<DealStatus, { label: string; bg: string; fg: string }> = {
  created: { label: "Awaiting payment", bg: "#1e1e22", fg: "#c9c9cf" },
  funded: { label: "Ready to ship", bg: "rgba(224,162,60,.16)", fg: "#E0A23C" },
  shipped: { label: "Shipped", bg: "rgba(52,208,126,.15)", fg: "#34D07E" },
  completed: { label: "Paid out", bg: "rgba(52,208,126,.15)", fg: "#34D07E" },
  disputed: { label: "Disputed", bg: "rgba(255,77,77,.16)", fg: "#FF4D4D" },
  refunded: { label: "Refunded", bg: "#1e1e22", fg: "#c9c9cf" },
  resolved: { label: "Resolved", bg: "rgba(124,58,237,.18)", fg: "#c093f5" },
};

function saleCard(d: Deal): string {
  const p = PILL[d.status];
  const buyer = d.buyerEmail || "a buyer";
  const action =
    d.status === "funded"
      ? `<div class="navbtn" data-action="ship" data-id="${d.id}" style="margin-top:12px; height:44px; border-radius:12px; background:#E4144F; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:14px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M3 21h18M5 21V10l7-5 7 5v11"/></svg>Mark as shipped</div>`
      : d.status === "shipped"
        ? `<div style="margin-top:10px; font-size:12px; color:#9A9AA0;">Shipped. Waiting for the buyer to confirm; you'll be paid on release.</div>`
        : d.status === "completed"
          ? `<div style="margin-top:10px; font-size:12px; color:#34D07E; font-weight:600;">Released to your account.</div>`
          : "";
  return `<div style="border-radius:18px; background:#141416; border:1px solid #202024; padding:15px 16px;">
      <div style="display:flex; align-items:center; gap:13px;">
        <div style="width:46px; height:46px; border-radius:13px; background:#1e1e22; display:flex; align-items:center; justify-content:center; font-size:20px;">${emoji(d.item.title)}</div>
        <div style="flex:1; min-width:0;"><div style="font-size:14.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(d.item.title)}</div><div style="font-size:12.5px; color:#9A9AA0; margin-top:2px;">${naira(d.item.amount)} · ${esc(buyer)}</div></div>
        <span style="padding:5px 10px; border-radius:999px; background:${p.bg}; color:${p.fg}; font-size:11px; font-weight:700; white-space:nowrap;">${p.label}</span>
      </div>
      ${action}
    </div>`;
}

function verifyBannerHtml(verified: boolean): string {
  if (verified) return "";
  return `<div class="navbtn" data-nav="seller" style="border-radius:16px; padding:14px 15px; background:rgba(228,20,79,.09); border:1px solid rgba(228,20,79,.3); display:flex; gap:11px; align-items:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff8fa8" stroke-width="1.9" style="flex-shrink:0;"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg><div style="flex:1;"><div style="font-size:13px; font-weight:800; color:#fff;">Verify to receive payouts</div><div style="font-size:12px; color:#ffc7d3; margin-top:2px;">Sellers must be verified before money can be released to them.</div></div><svg width="18" height="18" viewBox="0 0 24 24" stroke="#ff8fa8" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg></div>`;
}

export default function Page() {
  const [data, setData] = useState<Record<string, string | number>>();
  const contactsRef = useRef<string[]>([]);

  async function load() {
    const sales = await listMySales(contactsRef.current).catch(() => [] as Deal[]);
    setData((p) => ({
      ...p,
      verifyBanner: verifyBannerHtml(getSellerProfile()?.verified === true),
      sales: sales.length
        ? sales.map(saleCard).join("")
        : `<div style="padding:18px; text-align:center; color:#6d6d74; font-size:13px;">No sales yet. Tap “Request a payment”, or share your email so a buyer can pay you through escrow.</div>`,
    }));
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      // Refresh the seller profile from the server (source of truth) into the cache.
      const profile = await loadSellerProfile(user?.email);
      contactsRef.current = [user?.email, profile?.phone].filter(Boolean) as string[];
      if (alive) await load();
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    ship: async (_fields: Record<string, string>, el: HTMLElement) => {
      const id = el.getAttribute("data-id");
      if (!id) return;
      const payout = getSellerProfile()?.payout;
      const sellerPayout = payout ? { accountNumber: payout.accountNumber, accountName: payout.accountName, verified: true } : undefined;
      try {
        await shipDeal(id, sellerPayout);
      } catch {
        /* ignore; reload reflects the truth */
      }
      await load();
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
