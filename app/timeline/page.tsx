"use client";

/* Transaction detail — the heart of the product. Desktop keeps the imported
   design's structure: a left column (hero with item/amount/parties, the
   progress timeline, the AI risk read) beside a sticky right column (Trust
   Score card + escrow account). It stacks to a mobile column inside AppShell.
   Every figure is real: the summary, the stepper, the Trust Score, and the
   action buttons are all driven by the deal's status and timeline. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { EmptyState, ErrorState, Skeleton } from "@/app/_lib/States";
import { getCurrentUser } from "@/lib/auth";
import { cacheDeal, confirmReceipt, getCachedDeal, getCurrentDealId, getDeal, naira } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const VERDICT: Record<string, { label: string; fg: string; bg: string; dot: string }> = {
  safe: { label: "Low risk", fg: "#047857", bg: "#ECFDF5", dot: "#10B981" },
  caution: { label: "Caution", fg: "#A16207", bg: "#FEF3C7", dot: "#E89914" },
  risky: { label: "High risk", fg: "#B91C1C", bg: "#FEE2E2", dot: "#DC2626" },
};
const STATUS_PILL: Record<DealStatus, { label: string; fg: string; bg: string; dot: string }> = {
  created: { label: "Awaiting payment", fg: "#475569", bg: "#F1F5F9", dot: "#94A3B8" },
  funded: { label: "Funded", fg: "#047857", bg: "#ECFDF5", dot: "#10B981" },
  shipped: { label: "Delivered", fg: "#A16207", bg: "#FEF3C7", dot: "#E89914" },
  completed: { label: "Released", fg: "#047857", bg: "#ECFDF5", dot: "#10B981" },
  disputed: { label: "Disputed", fg: "#B91C1C", bg: "#FEE2E2", dot: "#DC2626" },
  under_review: { label: "Under review", fg: "#6D28D9", bg: "#EDE9FE", dot: "#7C3AED" },
  refunded: { label: "Refunded", fg: "#475569", bg: "#F1F5F9", dot: "#94A3B8" },
  resolved: { label: "Resolved", fg: "#3730A3", bg: "#E0E7FF", dot: "#6366F1" },
};

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const t = d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  const day = d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  return `${day} · ${t}`;
}

type StepState = "done" | "current" | "upcoming";
interface Step { label: string; sub?: string; state: StepState }

function buildSteps(deal: Deal): Step[] {
  const s = deal.status;
  const at = (st: DealStatus) => fmtTime([...deal.timeline].reverse().find((e) => e.status === st)?.at);
  const shipNote = deal.timeline.find((e) => e.status === "shipped")?.note;

  if (s === "disputed" || s === "refunded" || s === "resolved") {
    const shipped = deal.timeline.some((e) => e.status === "shipped");
    const outcome: Step =
      s === "disputed"
        ? { label: "In dispute", sub: "AI mediator reviewing the evidence", state: "current" }
        : { label: s === "refunded" ? "Refunded to you" : "Dispute resolved", sub: at(s), state: "done" };
    return [
      { label: "Buyer paid into escrow", sub: at("funded") || "Money held in escrow", state: "done" },
      { label: "Seller shipped", sub: shipped ? shipNote || at("shipped") : "Not shipped", state: shipped ? "done" : "upcoming" },
      outcome,
    ];
  }

  const rank = s === "created" ? 0 : s === "funded" ? 1 : s === "shipped" ? 2 : 4;
  const state = (completeAt: number): StepState => (rank >= completeAt ? "done" : rank === completeAt - 1 ? "current" : "upcoming");
  return [
    { label: "Buyer paid into escrow", sub: rank >= 1 ? at("funded") || "Money held in escrow" : "Awaiting bank transfer", state: state(1) },
    { label: "Seller ships the item", sub: rank >= 2 ? shipNote || at("shipped") || "Seller dispatched the item" : rank === 1 ? "Waiting for the seller to ship" : "", state: state(2) },
    { label: "You confirm receipt", sub: rank >= 4 ? "You confirmed" : rank === 2 ? "Waiting for you to confirm" : "", state: state(3) },
    { label: "Funds released to seller", sub: rank >= 4 ? at("completed") || "Seller paid" : "Instant on your confirm", state: state(4) },
  ];
}

function StepDot({ state }: { state: StepState }) {
  if (state === "done") return <span className="td-dot td-dot-done"><svg width="12" height="12" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.4" fill="none"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>;
  if (state === "current") return <span className="td-dot td-dot-current"><span /></span>;
  return <span className="td-dot td-dot-upcoming" />;
}

function initialsOf(s: string): string {
  const p = s.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

export default function TimelinePage() {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [me, setMe] = useState("You");
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    const id = getCurrentDealId();
    if (!id) { setStatus("missing"); return; }
    // Opportunistic render: if the list we came from already handed us this deal,
    // show it instantly and refresh in the background — no skeleton flash.
    const seed = getCachedDeal(id);
    if (seed) { setDeal(seed); setStatus("ready"); } else { setStatus("loading"); }
    Promise.all([getDeal(id), getCurrentUser().catch(() => null)])
      .then(([d, user]) => {
        setMe(user?.name || (user?.email ? user.email.split("@")[0] : "You"));
        if (d) { setDeal(d); cacheDeal(d); setStatus("ready"); }
        else if (!seed) { setStatus("missing"); } // only 404 if we had nothing to show
      })
      .catch(() => { if (!seed) setStatus("error"); }); // keep the seed on a network hiccup
  }, []);

  useEffect(() => { load(); }, [load]);

  const steps = useMemo(() => (deal ? buildSteps(deal) : []), [deal]);

  async function confirm() {
    if (confirming) return;
    setConfirming(true);
    const id = getCurrentDealId();
    if (id) { try { await confirmReceipt(id); } catch { /* keep the flow moving */ } }
    router.push("/released");
  }

  function copyAcct(n: string) {
    navigator.clipboard?.writeText(n).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }

  if (status !== "ready" || !deal) {
    return (
      <AppShell current="activity" user={{ name: me, initials: "" }}>
        {status === "error" ? (
          <ErrorState onRetry={load}>We couldn&apos;t load this transaction. Check your connection and try again.</ErrorState>
        ) : status === "missing" ? (
          <EmptyState
            icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></svg>}
            title="No transaction selected"
            action={<Link href="/history" className="tf-btn tf-btn--primary">Go to activity</Link>}
          >
            Open a deal from your activity to see its full timeline here.
          </EmptyState>
        ) : (
          <div className="td-skel" aria-hidden>
            <div className="tf-card" style={{ padding: 20 }}>
              <Skeleton w={80} h={12} />
              <Skeleton w="70%" h={22} style={{ marginTop: 12 }} />
              <Skeleton w={150} h={28} style={{ marginTop: 12 }} />
            </div>
            <div className="tf-card" style={{ padding: 20, marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0" }}>
                  <Skeleton circle w={26} h={26} />
                  <span style={{ flex: 1 }}><Skeleton w="45%" h={12} /><Skeleton w="65%" h={10} style={{ marginTop: 6 }} /></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  const sp = STATUS_PILL[deal.status];
  const verdict = deal.trust ? VERDICT[deal.trust.verdict] : null;
  const sellerName = deal.seller.name || "Seller";
  const released = deal.status === "completed" || deal.status === "resolved";
  const acct = deal.alatVirtualAccount;

  return (
    <AppShell current="activity" user={{ name: me, initials: initialsOf(me) }}>
      <style>{css}</style>

      <div className="tf-ph-head td-head">
        <div><Link href="/history" className="td-back">← Activity</Link><h1>Transaction</h1></div>
      </div>
      <Link href="/history" className="td-back td-back-m">← Activity</Link>

      <div className="td-wrap">
        <div className="td-left">
          {/* hero */}
          <div className="tf-card td-hero">
            <div className="td-hero-top">
              <div className="td-hero-titles">
                <div className="td-item">{deal.item.title}</div>
                <div className="td-ref tf-mono">{deal.reference || deal.id.slice(0, 12)} · Created {fmtTime(deal.createdAt)}</div>
              </div>
              <span className="tf-pill" style={{ background: sp.bg, color: sp.fg }}>{sp.label}</span>
            </div>
            <div className="td-amount"><span className="td-amount-val tf-mono">{naira(deal.item.amount)}</span><span className="tf-eyebrow">{released ? "released to seller" : "held in escrow"}</span></div>
            <div className="td-parties">
              <div className="td-party"><span className="td-av td-av-safe">{initialsOf(me)}</span><div><div className="td-party-name">You</div><div className="td-party-role">Buyer</div></div></div>
              <svg className="td-swap" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 8h14M7 8l4-4M7 8l4 4M17 16H3M17 16l-4-4M17 16l-4 4" /></svg>
              <div className="td-party td-party-r"><div style={{ textAlign: "right" }}><div className="td-party-name">{sellerName}</div><div className="td-party-role">Seller{deal.trust ? ` · TS ${deal.trust.score}` : ""}</div></div><span className="td-av td-av-ink">{initialsOf(sellerName)}</span></div>
            </div>
          </div>

          {/* timeline */}
          <div className="tf-card td-tl">
            <div className="td-tl-head"><span className="td-tl-title">Timeline</span><span className="tf-eyebrow">{steps.length} steps</span></div>
            <div className="td-steps">
              {steps.map((s, i) => (
                <div key={i} className="td-step">
                  <div className="td-step-rail"><StepDot state={s.state} />{i < steps.length - 1 && <span className={`td-line${s.state === "done" ? " is-done" : ""}`} />}</div>
                  <div className="td-step-body" style={{ paddingBottom: i === steps.length - 1 ? 0 : 18 }}>
                    <div className={`td-step-label${s.state === "upcoming" ? " is-upcoming" : ""}`}>{s.label}</div>
                    {s.sub && <div className={`td-step-sub${s.state === "current" ? " is-current" : ""}`}>{s.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI risk read */}
          <div className="tf-card td-ai">
            <div className="td-ai-head"><span className="td-ai-chip">AI</span><span className="tf-eyebrow">Risk read</span></div>
            <p className="td-ai-text">{deal.trust?.headline || "No conversation was scanned for this deal. Paste the chat when creating a deal to get a scam read before you pay."}</p>
          </div>

          {/* actions */}
          <div className="td-actions">
            {(deal.status === "funded" || deal.status === "shipped") && (
              <>
                <button className="tf-btn tf-btn--verify td-primary" disabled={confirming} onClick={() => void confirm()}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {confirming ? "Releasing…" : `Confirm receipt & release ${naira(deal.item.amount)}`}
                </button>
                <Link href="/dispute" className="tf-btn tf-btn--secondary td-secondary">Open a dispute</Link>
              </>
            )}
            {deal.status === "created" && <Link href="/fund" className="tf-btn tf-btn--verify td-primary">Pay into escrow</Link>}
            {deal.status === "completed" && (<><div className="td-state td-state-ok">Completed. Seller paid.</div><Link href="/receipt" className="tf-btn tf-btn--secondary td-secondary">Download receipt</Link></>)}
            {deal.status === "disputed" && (<><div className="td-state td-state-warn">Dispute under AI review</div><Link href="/dispute" className="tf-btn tf-btn--secondary td-secondary">View the case</Link></>)}
            {(deal.status === "refunded" || deal.status === "resolved") && (<><div className="td-state td-state-ok">Resolved</div><Link href="/dashboard" className="tf-btn tf-btn--secondary td-secondary">Back to home</Link></>)}
          </div>
        </div>

        {/* right sticky */}
        <aside className="td-side">
          <div className="tf-card td-trust">
            <div className="tf-eyebrow">Seller Trust Score</div>
            <div className="td-trust-row">
              <div className="td-trust-score">{deal.trust?.score ?? "—"}<span>/100</span></div>
              {verdict && <span className="tf-pill" style={{ background: verdict.bg, color: verdict.fg }}>{verdict.label}</span>}
            </div>
            <p className="td-trust-sub">{deal.trust ? "Scored from the seller's history and the chat you shared." : "Not scored for this deal."}</p>
          </div>

          <div className="tf-card td-escrow">
            <div className="tf-eyebrow">Escrow account</div>
            {acct ? (
              <>
                <p className="td-escrow-sub">The dedicated account holding this transaction:</p>
                <div className="td-escrow-row"><span className="td-escrow-num tf-mono">{acct.replace(/(\d{4})(?=\d)/g, "$1 ")}</span><button className="td-copy" onClick={() => copyAcct(acct)}>{copied ? "Copied" : "Copy"}</button></div>
                <div className="td-escrow-bank tf-mono">Held in escrow{deal.alatAccountExpiresAt ? ` · expires ${fmtTime(deal.alatAccountExpiresAt)}` : ""}</div>
              </>
            ) : (
              <p className="td-escrow-sub">A dedicated escrow account is created the moment you fund this deal. Money sits there until you confirm delivery.</p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

const css = `
.td-loading{ padding:60px 20px; text-align:center; color:var(--faint); font-size:14px }
.td-head{ display:none }
.td-back{ display:inline-block; font-size:13.5px; font-weight:600; color:var(--muted); margin-bottom:4px }
.td-back:hover{ color:var(--ink) }
.td-back-m{ margin:0 0 14px }

.td-wrap{ display:flex; flex-direction:column; gap:16px }
.td-left{ display:flex; flex-direction:column; gap:16px }

.td-hero{ padding:20px; display:flex; flex-direction:column; gap:16px }
.td-hero-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px }
.td-item{ font-size:20px; font-weight:700; letter-spacing:-.02em; line-height:1.2 }
.td-ref{ font-size:12px; color:var(--faint); margin-top:6px }
.td-amount{ display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; padding-bottom:16px; border-bottom:1px solid var(--line-2) }
.td-amount-val{ font-size:32px; font-weight:700; letter-spacing:-.03em }
.td-parties{ display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px }
.td-party{ display:flex; align-items:center; gap:10px; min-width:0 }
.td-party-r{ justify-content:flex-end }
.td-av{ width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#fff; flex-shrink:0 }
.td-av-safe{ background:var(--safe) } .td-av-ink{ background:var(--ink) }
.td-party-name{ font-size:13.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.td-party-role{ font-size:11px; color:var(--faint); letter-spacing:.06em; text-transform:uppercase; margin-top:1px }
.td-swap{ flex-shrink:0 }

.td-tl{ padding:20px }
.td-tl-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px }
.td-tl-title{ font-size:15px; font-weight:700; letter-spacing:-.01em }
.td-step{ display:flex; gap:15px }
.td-step-rail{ display:flex; flex-direction:column; align-items:center }
.td-dot{ width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.td-dot-done{ background:var(--safe) }
.td-dot-current{ background:#fff; border:2px solid var(--gold); box-shadow:0 0 0 4px rgba(161,98,7,.15) } .td-dot-current span{ width:8px; height:8px; border-radius:50%; background:var(--gold) }
.td-dot-upcoming{ background:#fff; border:2px solid #E2E8F0 }
.td-line{ width:2px; flex:1; min-height:20px; background:#E2E8F0; margin:4px 0 } .td-line.is-done{ background:var(--safe) }
.td-step-body{ min-width:0 }
.td-step-label{ font-size:14.5px; font-weight:600 } .td-step-label.is-upcoming{ color:var(--faint) }
.td-step-sub{ font-size:12px; color:var(--muted); margin-top:2px } .td-step-sub.is-current{ color:var(--gold); font-weight:600 }

.td-ai{ padding:18px }
.td-ai-head{ display:flex; align-items:center; gap:9px; margin-bottom:10px }
.td-ai-chip{ background:var(--safe); color:#fff; padding:3px 7px; border-radius:5px; font-size:10px; font-weight:700; letter-spacing:.06em }
.td-ai-text{ font-size:13.5px; line-height:1.55; color:var(--ink-2) }

.td-actions{ display:flex; flex-direction:column; gap:12px }
.td-primary{ height:56px; font-size:15.5px; width:100% }
.td-primary:disabled{ opacity:.6; cursor:not-allowed }
.td-secondary{ height:52px; font-size:15px; width:100% }
.td-state{ height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:15px }
.td-state-ok{ background:var(--safe-tint); color:var(--safe) }
.td-state-warn{ background:#FEF3C7; color:#B45309 }

.td-side{ display:flex; flex-direction:column; gap:16px }
.td-trust{ padding:20px }
.td-trust-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:8px }
.td-trust-score{ font-size:40px; font-weight:700; letter-spacing:-.03em; line-height:1; color:var(--safe) } .td-trust-score span{ font-size:16px; color:var(--faint); font-weight:600 }
.td-trust-sub{ font-size:12.5px; color:var(--muted); line-height:1.5; margin-top:12px }
.td-escrow{ padding:20px }
.td-escrow-sub{ font-size:13px; color:var(--muted); line-height:1.5; margin-top:10px }
.td-escrow-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px }
.td-escrow-num{ font-size:18px; letter-spacing:.05em; color:var(--ink) }
.td-copy{ font-size:12.5px; font-weight:600; color:var(--ink); background:var(--bg); border:1px solid var(--line); border-radius:9px; padding:6px 12px; cursor:pointer } .td-copy:hover{ border-color:#CBD5E1 }
.td-escrow-bank{ font-size:12px; color:var(--faint); margin-top:8px }

@media (min-width:1024px){
  .td-head{ display:flex } .td-back-m{ display:none }
  .td-wrap{ display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start }
  .td-left{ gap:18px }
  .td-hero{ padding:24px } .td-item{ font-size:22px } .td-amount-val{ font-size:34px }
  .td-tl, .td-ai, .td-trust, .td-escrow{ padding:22px }
  .td-actions{ flex-direction:row; flex-wrap:wrap } .td-primary, .td-secondary{ width:auto; flex:1; min-width:220px }
  .td-side{ position:sticky; top:88px; gap:18px }
}
`;
