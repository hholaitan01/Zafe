"use client";

/* Timeline — the summary card, the progress stepper, and the action buttons are
   all driven by the deal's REAL status + timeline (they used to be hardcoded
   "Funded 2:14 PM / Shipped GIG-88213 / Delivered"). */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/timeline";
import { getCurrentUser } from "@/lib/auth";
import { confirmReceipt, getCurrentDealId, getDeal, naira } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const RISK: Record<string, string> = { safe: "Low risk", caution: "Caution", risky: "High risk" };

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const t = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  const day = d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  return `${day} · ${t}`;
}

type StepState = "done" | "current" | "upcoming";
interface Step {
  label: string;
  sub?: string;
  state: StepState;
}

function circle(state: StepState): string {
  if (state === "done")
    return `<div style="width:24px;height:24px;border-radius:50%;background:#059669;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" stroke-width="3.4" fill="none"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
  if (state === "current")
    return `<div style="width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid #A16207;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 4px rgba(161,98,7,.15);"><div style="width:8px;height:8px;border-radius:50%;background:#A16207;"></div></div>`;
  return `<div style="width:24px;height:24px;border-radius:50%;background:#fff;border:2px solid #E2E8F0;flex-shrink:0;"></div>`;
}

function stepperHtml(steps: Step[]): string {
  return steps
    .map((s, i) => {
      const last = i === steps.length - 1;
      const lineColor = s.state === "done" ? "#059669" : "#E2E8F0";
      const labelColor = s.state === "upcoming" ? "#94A3B8" : "#0F172A";
      const subColor = s.state === "current" ? "#A16207" : "#64748B";
      const subWeight = s.state === "current" ? "600" : "400";
      const connector = last ? "" : `<div style="width:2px;flex:1;min-height:20px;background:${lineColor};margin:4px 0;"></div>`;
      const sub = s.sub ? `<div style="font-size:12px;color:${subColor};font-weight:${subWeight};margin-top:2px;">${esc(s.sub)}</div>` : "";
      return `<div style="display:flex;gap:16px;"><div style="display:flex;flex-direction:column;align-items:center;">${circle(s.state)}${connector}</div><div style="padding-bottom:${last ? "0" : "18px"};"><div style="font-size:14.5px;font-weight:600;color:${labelColor};">${esc(s.label)}</div>${sub}</div></div>`;
    })
    .join("");
}

function buildSteps(deal: Deal): Step[] {
  const s = deal.status;
  const at = (st: DealStatus) => fmtTime([...deal.timeline].reverse().find((e) => e.status === st)?.at);
  const shipNote = deal.timeline.find((e) => e.status === "shipped")?.note;

  // Dispute branch.
  if (s === "disputed" || s === "refunded" || s === "resolved") {
    const shipped = deal.timeline.some((e) => e.status === "shipped");
    const outcome: Step =
      s === "disputed"
        ? { label: "In dispute", sub: "AI mediator reviewing the evidence", state: "current" }
        : { label: s === "refunded" ? "Refunded to you" : "Dispute resolved", sub: at(s), state: "done" };
    return [
      { label: "Funded", sub: at("funded") || "Money held in escrow", state: "done" },
      { label: "Shipped", sub: shipped ? shipNote || at("shipped") : "Not shipped", state: shipped ? "done" : "upcoming" },
      outcome,
    ];
  }

  // Happy path. rank: created 0, funded 1, shipped 2, completed 4.
  const rank = s === "created" ? 0 : s === "funded" ? 1 : s === "shipped" ? 2 : 4;
  const state = (completeAt: number): StepState => (rank >= completeAt ? "done" : rank === completeAt - 1 ? "current" : "upcoming");
  return [
    { label: "Funded", sub: rank >= 1 ? at("funded") || "Money held in escrow" : "Awaiting payment", state: state(1) },
    { label: "Shipped", sub: rank >= 2 ? shipNote || at("shipped") || "Seller dispatched the item" : rank === 1 ? "Waiting for the seller to ship" : "", state: state(2) },
    { label: "Confirm receipt", sub: rank >= 4 ? "You confirmed" : rank === 2 ? "Waiting for you to confirm" : "", state: state(3) },
    { label: "Released to seller", sub: rank >= 4 ? at("completed") || "Seller paid" : "", state: state(4) },
  ];
}

function actionsHtml(deal: Deal): string {
  const primary = (label: string, action: string) =>
    `<div class="navbtn" data-action="${action}" style="height:56px;border-radius:15px;background:#059669;display:flex;align-items:center;justify-content:center;gap:9px;font-weight:600;font-size:16px;color:#fff;box-shadow:0 14px 26px -12px rgba(5,150,105,.55);"><svg width="17" height="17" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" fill="none"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>${label}</div>`;
  const outline = (label: string, nav: string) =>
    `<div class="navbtn" data-nav="${nav}" style="margin-top:12px;height:56px;border-radius:15px;background:#fff;border:1px solid #E6EAF0;box-shadow:0 1px 2px rgba(15,23,42,.05);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:16px;color:#334155;">${label}</div>`;
  const pill = (text: string, fg: string, bg: string) =>
    `<div style="height:52px;border-radius:15px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:15px;">${text}</div>`;

  if (deal.status === "funded" || deal.status === "shipped") return primary("Confirm received", "confirm") + outline("Open a dispute", "dispute");
  if (deal.status === "completed") return pill("Completed. Seller paid.", "#059669", "#ECFDF5") + outline("Back to home", "dashboard");
  if (deal.status === "disputed") return pill("Dispute under AI review", "#B45309", "#FEF3C7") + outline("View the case", "dispute");
  if (deal.status === "refunded" || deal.status === "resolved") return pill("Resolved", "#059669", "#ECFDF5") + outline("Back to home", "dashboard");
  return outline("Open a dispute", "dispute");
}

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    Promise.all([getDeal(id), getCurrentUser().catch(() => null)])
      .then(([d, user]) => {
        if (!alive) return;
        const me = user?.name || (user?.email ? user.email.split("@")[0] : "You");
        setData({
          title: d.item.title,
          amount: naira(d.item.amount),
          buyer: `You (${me})`,
          seller: d.seller.name || "Seller",
          trustLine: d.trust ? `Score ${d.trust.score} · ${RISK[d.trust.verdict] ?? ""}` : "Not scored",
          stepper: stepperHtml(buildSteps(d)),
          actions: actionsHtml(d),
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    confirm: async () => {
      const id = getCurrentDealId();
      if (id) {
        try {
          await confirmReceipt(id);
        } catch {
          /* keep the flow moving */
        }
      }
      router.push("/released");
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
