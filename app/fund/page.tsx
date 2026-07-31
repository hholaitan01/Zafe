"use client";

/* Payment — the buyer funds the escrow here. Before they pay we surface two
   trust signals (the decisions from this flow): the AI scam / Trust banner
   (computed from the pasted chat at deal creation) and the seller's standing
   across past TrustFlow deals. Then "Pay" locks the money into escrow.
   (Live ALAT payment is Jerry's; this owns the deal status.) */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/fund";
import { getCurrentDealId, getDeal, getSellerStanding, naira, setDealStatus } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";
import type { SellerStanding, StandingTone } from "@/lib/seller/standing";

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

const TONE: Record<StandingTone, { fg: string; bg: string }> = {
  good: { fg: "#34D07E", bg: "rgba(52,208,126,.13)" },
  neutral: { fg: "#9A9AA0", bg: "#1A1A1D" },
  warn: { fg: "#FF4D4D", bg: "rgba(255,77,77,.13)" },
};

const SHIELD = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const WARN = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>`;
const INFO = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`;

/** Big AI banner: green (safe) / amber (caution) / red (risky) / grey (no chat scanned). */
function trustBannerHtml(deal: Deal): string {
  const t = deal.trust;
  let fg: string, bg: string, icon: string, title: string, body: string;

  if (!t) {
    fg = "#9A9AA0"; bg = "#1A1A1D"; icon = INFO;
    title = "No chat scanned";
    body = "You didn't paste a chat, so we couldn't check for scam signs. The escrow still protects your money.";
  } else if (t.verdict === "safe") {
    fg = "#34D07E"; bg = "rgba(52,208,126,.12)"; icon = SHIELD;
    title = `Looks safe · Trust Score ${t.score}/100`;
    body = t.headline;
  } else if (t.verdict === "caution") {
    fg = "#E0A23C"; bg = "rgba(224,162,60,.14)"; icon = WARN;
    title = `Be careful · Trust Score ${t.score}/100`;
    body = t.headline;
  } else {
    fg = "#FF4D4D"; bg = "rgba(255,77,77,.12)"; icon = WARN;
    title = `⚠ Scam signs detected · Trust Score ${t.score}/100`;
    body = t.headline;
  }

  return `<div style="border-radius:14px; background:${bg}; border:1px solid ${fg}33; padding:13px 14px; display:flex; gap:11px; color:${fg};">
      <div style="flex-shrink:0; margin-top:1px;">${icon}</div>
      <div style="min-width:0;">
        <div style="font-size:13px; font-weight:800; letter-spacing:-.01em;">${esc(title)}</div>
        <div style="font-size:12px; color:#c9c9cf; line-height:1.5; margin-top:3px;">${esc(body)}</div>
      </div>
    </div>`;
}

/** Seller standing row, looked up by the seller's phone/email. */
function sellerStandingHtml(s: SellerStanding): string {
  const tone = TONE[s.tone];
  const icon = s.tone === "good" ? SHIELD : s.tone === "warn" ? WARN : INFO;
  const badge = s.verified
    ? `<span style="font-size:10px; font-weight:800; color:#34D07E; background:rgba(52,208,126,.15); padding:2px 7px; border-radius:6px;">VERIFIED</span>`
    : `<span style="font-size:10px; font-weight:800; color:#9A9AA0; background:#26262b; padding:2px 7px; border-radius:6px;">UNVERIFIED</span>`;
  return `<div style="border-radius:14px; background:#141416; border:1px solid #202024; padding:12px 14px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px; color:${tone.fg}; min-width:0;">
          ${icon}
          <span style="font-size:13px; font-weight:800;">${esc(s.label)}</span>
        </div>
        ${badge}
      </div>
      <div style="font-size:12px; color:#9A9AA0; line-height:1.5; margin-top:6px;">${esc(s.detail)}</div>
    </div>`;
}

/** For risky deals only: the "I understand the risk, pay anyway" gate the buyer
    must tick before the money can move. Empty for non-risky deals. */
function riskAckHtml(risky: boolean, acked: boolean, nudge: boolean): string {
  if (!risky) return "";
  const box = acked
    ? `<div style="width:22px; height:22px; border-radius:7px; background:#FF4D4D; display:flex; align-items:center; justify-content:center; flex-shrink:0;"><svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" stroke-width="3.2" fill="none"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
    : `<div style="width:22px; height:22px; border-radius:7px; border:2px solid #FF4D4D; flex-shrink:0;"></div>`;
  const hint = nudge && !acked ? `<div style="font-size:11.5px; color:#FF4D4D; font-weight:700; margin-top:8px;">Tick the box to confirm before paying.</div>` : "";
  return `<div data-action="ackRisk" class="navbtn" style="border-radius:14px; background:rgba(255,77,77,.08); border:1px solid rgba(255,77,77,.35); padding:13px 14px; display:flex; align-items:center; gap:11px;">${box}<div style="font-size:13px; font-weight:700; color:#ffd0d0; line-height:1.35;">I understand the risk, pay anyway</div></div>${hint}`;
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();

  // Non-ack fields (amount, banners) live in a ref so re-rendering the ack gate
  // doesn't lose them. Refs hold the latest gate state for the action handlers.
  const baseRef = useRef<Record<string, string | number>>({});
  const riskyRef = useRef(false);
  const ackRef = useRef(false);
  const nudgeRef = useRef(false);

  function paint() {
    setData({ ...baseRef.current, riskAck: riskAckHtml(riskyRef.current, ackRef.current, nudgeRef.current) });
  }

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    (async () => {
      const deal = await getDeal(id).catch(() => null);
      if (!deal || !alive) return;
      const amount = naira(deal.item.amount);
      riskyRef.current = deal.trust?.verdict === "risky";
      baseRef.current = { amount, payAmount: amount, trustBanner: trustBannerHtml(deal) };
      if (alive) paint();

      // Seller standing loads after the deal (a second round-trip).
      const contact = deal.seller?.contact;
      if (contact) {
        const standing = await getSellerStanding(contact).catch(() => null);
        if (standing && alive) {
          baseRef.current = { ...baseRef.current, sellerStanding: sellerStandingHtml(standing) };
          paint();
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    // Pick a payment method (highlight the row + fill its radio).
    selectPay: (_fields: Record<string, string>, el: HTMLElement) => {
      const row = el.closest<HTMLElement>("[data-pay]");
      const list = row?.parentElement;
      if (!row || !list) return;
      list.querySelectorAll<HTMLElement>("[data-pay]").forEach((r) => {
        const on = r === row;
        r.style.border = on ? "1.5px solid #E4144F" : "1px solid #26262b";
        const radio = r.querySelector<HTMLElement>("[data-radio]");
        if (radio) {
          radio.style.border = on ? "6px solid #E4144F" : "2px solid #33333a";
          radio.style.boxShadow = on ? "inset 0 0 0 2px #141416" : "none";
        }
      });
    },
    // Toggle the risk acknowledgement.
    ackRisk: () => {
      ackRef.current = !ackRef.current;
      nudgeRef.current = false;
      paint();
    },
    fund: async () => {
      // A red (risky) deal can't be funded until the buyer ticks the box.
      if (riskyRef.current && !ackRef.current) {
        nudgeRef.current = true;
        paint();
        return;
      }
      const id = getCurrentDealId();
      if (id) {
        try {
          await setDealStatus(id, "funded", "Buyer paid into escrow");
        } catch {
          /* keep the flow moving even if the status write fails */
        }
      }
      router.push("/locked");
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
