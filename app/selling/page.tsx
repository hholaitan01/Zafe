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
  created: { label: "Awaiting payment", bg: "#F1F5F9", fg: "#475569" },
  funded: { label: "Ready to ship", bg: "#FEF3C7", fg: "#A16207" },
  shipped: { label: "Shipped", bg: "#ECFDF5", fg: "#059669" },
  completed: { label: "Paid out", bg: "#ECFDF5", fg: "#059669" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#DC2626" },
  refunded: { label: "Refunded", bg: "#F1F5F9", fg: "#475569" },
  resolved: { label: "Resolved", bg: "#E0E7FF", fg: "#3730A3" },
};

function saleCard(d: Deal): string {
  const p = PILL[d.status];
  const buyer = d.buyerEmail || "a buyer";
  const action =
    d.status === "funded"
      ? `<div class="navbtn" data-action="ship" data-id="${d.id}" style="margin-top:12px; height:46px; border-radius:12px; background:#0F172A; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:14px; color:#fff;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M3 21h18M5 21V10l7-5 7 5v11"/></svg>Mark as shipped</div>`
      : d.status === "shipped"
        ? `<div style="margin-top:10px; font-size:12px; color:#64748B;">Shipped. Waiting for the buyer to confirm; you'll be paid on release.</div>`
        : d.status === "completed"
          ? `<div style="margin-top:10px; font-size:12px; color:#059669; font-weight:600;">Released to your account.</div>`
          : "";
  return `<div style="border-radius:18px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:14px 15px;">
      <div style="display:flex; align-items:center; gap:13px;">
        <div style="width:46px; height:46px; border-radius:13px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;">${itemIcon(d.item.title)}</div>
        <div style="flex:1; min-width:0;"><div style="font-size:14.5px; font-weight:600; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(d.item.title)}</div><div style="font-size:12.5px; color:#64748B; margin-top:2px;">${naira(d.item.amount)} · ${esc(buyer)}</div></div>
        <span style="padding:5px 10px; border-radius:999px; background:${p.bg}; color:${p.fg}; font-size:11px; font-weight:700; white-space:nowrap;">${p.label}</span>
      </div>
      ${action}
    </div>`;
}

function verifyBannerHtml(verified: boolean): string {
  if (verified) return "";
  return `<div class="navbtn" data-nav="seller" style="border-radius:16px; padding:14px 15px; background:#ECFDF5; border:1px solid #C7F0DE; display:flex; gap:11px; align-items:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" style="flex-shrink:0;"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg><div style="flex:1;"><div style="font-size:13px; font-weight:700; color:#064E3B;">Verify to receive payouts</div><div style="font-size:12px; color:#047857; margin-top:2px;">Sellers must be verified before money can be released to them.</div></div><svg width="18" height="18" viewBox="0 0 24 24" stroke="#059669" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg></div>`;
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
        : `<div style="padding:22px 18px; text-align:center; color:#94A3B8; font-size:13.5px; line-height:1.5; background:#fff; border:1px solid #E6EAF0; border-radius:16px;">No sales yet. Tap “Request a payment”, or share your email so a buyer can pay you through escrow.</div>`,
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
