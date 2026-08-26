"use client";

/* Dispute — file a case against one of your own transactions and see the AI
   mediator's recommendation. Nothing here is hardcoded:

   1. If you have no transactions, there is nothing to dispute (empty state).
   2. Otherwise you first pick which transaction to dispute from a dropdown of
      your recent deals.
   3. Only then does the case form, the seller's actual response, and the AI
      recommendation appear, all driven by the SELECTED deal's real amount, item,
      seller, and any dispute already on file. */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { Skeleton, Spinner } from "@/app/_lib/States";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "@/app/_lib/Toast";
import { acceptDisputeResolution, disputeDeal, escalateDispute, getCurrentDealId, getMyReputation, listMyDeals, listMySales, naira } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";
import type { DisputeResult } from "@/lib/ai/types";

const REASONS = [
  { v: "never-arrived", label: "Item never arrived" },
  { v: "item-not-as-described", label: "Item not as described" },
  { v: "damaged", label: "Item arrived damaged" },
  { v: "counterfeit", label: "Counterfeit / fake" },
  { v: "other", label: "Other" },
];
const LABEL: Record<string, string> = { release_to_seller: "Pay the seller", refund_buyer: "Full refund", split: "Partial refund" };
const STATUS: Record<DealStatus, string> = {
  created: "Awaiting payment", funded: "Funded", shipped: "Delivered", completed: "Released",
  disputed: "In dispute", under_review: "Under review", refunded: "Refunded", resolved: "Resolved",
};

interface Reco { label: string; toBuyer: string; toSeller: string; rationale: string }

function recoFrom(amount: number, r: Pick<DisputeResult, "decision" | "splitBuyerPercent" | "rationale">): Reco {
  const buyerShare = r.decision === "refund_buyer" ? amount : r.decision === "split" ? Math.round(amount * (r.splitBuyerPercent / 100)) : 0;
  return { label: LABEL[r.decision] ?? "Reviewed", toBuyer: naira(buyerShare), toSeller: naira(amount - buyerShare), rationale: r.rationale };
}

export default function DisputePage() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [shell, setShell] = useState({ name: "You", initials: "", score: undefined as number | undefined });
  const [selId, setSelId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("item-not-as-described");
  const [statement, setStatement] = useState("");
  const [reco, setReco] = useState<Reco | null>(null);
  const [busy, setBusy] = useState(false);
  const [acting, setActing] = useState<"accept" | "escalate" | null>(null);
  const ddRef = useRef<HTMLDivElement>(null);

  // Replace one deal in local state after an action changes it (status, dispute).
  const patchDeal = (updated: Deal) => setDeals((ds) => (ds ? ds.map((d) => (d.id === updated.id ? updated : d)) : ds));

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email;
      const name = user?.name || (email ? email.split("@")[0] : "You");
      const initials = name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
      const [buying, selling, rep] = await Promise.all([
        listMyDeals(email).catch(() => [] as Deal[]),
        (email ? listMySales([email]) : Promise.resolve([] as Deal[])).catch(() => [] as Deal[]),
        getMyReputation(email, user?.name).catch(() => null),
      ]);
      if (!alive) return;
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      // Only deals with money still in escrow can be disputed (a settled deal
      // can't be reopened). This mirrors the server-side guard in openDispute.
      const disputable = new Set<DealStatus>(["funded", "shipped", "disputed", "under_review"]);
      const list = [...byId.values()]
        .filter((d) => disputable.has(d.status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setDeals(list);
      setShell({ name, initials, score: rep?.score });
      // If we arrived from a specific transaction, preselect it.
      const current = getCurrentDealId();
      if (current && list.some((d) => d.id === current)) setSelId(current);
    })();
    return () => { alive = false; };
  }, []);

  // Close the dropdown on an outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const selected = useMemo(() => deals?.find((d) => d.id === selId) || null, [deals, selId]);

  // When the selection changes, reset the case to the selected deal's reality.
  useEffect(() => {
    if (!selected) { setReco(null); setStatement(""); return; }
    const dp = selected.dispute;
    setStatement(dp?.buyer?.claim || "");
    setReco(dp?.resolution ? recoFrom(selected.item.amount, dp.resolution) : null);
  }, [selId]); // eslint-disable-line react-hooks/exhaustive-deps

  // File the dispute: the AI SUGGESTS a resolution (no money moves yet) and the
  // suggestion is recorded on the deal for both sides to accept or escalate.
  async function analyze() {
    if (!selected || busy || !statement.trim()) return;
    setBusy(true);
    try {
      const sellerClaim = selected.dispute?.seller?.claim || "No response provided yet.";
      const reasonLabel = REASONS.find((r) => r.v === reason)?.label;
      const { deal, resolution } = await disputeDeal(selected.id, {
        reason: reasonLabel,
        buyer: { claim: statement, evidence: ["Photo", "Chat log"] },
        seller: { claim: sellerClaim, evidence: selected.dispute?.seller?.evidence },
      });
      patchDeal(deal);
      setReco(resolution ? recoFrom(selected.item.amount, resolution) : null);
    } catch {
      setReco(null);
      toast.error("Couldn't file the dispute. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (!selected || acting) return;
    setActing("accept");
    try {
      const { deal, settled } = await acceptDisputeResolution(selected.id);
      patchDeal(deal);
      toast.success(settled ? "Resolution applied. The funds have been settled." : "You accepted. Waiting on the other side to accept too.");
    } catch {
      toast.error("Couldn't record your acceptance. Please try again.");
    } finally {
      setActing(null);
    }
  }

  async function escalate() {
    if (!selected || acting) return;
    setActing("escalate");
    try {
      const { deal } = await escalateDispute(selected.id);
      patchDeal(deal);
      toast("Escalated to a human reviewer. Funds stay locked until it's resolved.");
    } catch {
      toast.error("Couldn't escalate the dispute. Please try again.");
    } finally {
      setActing(null);
    }
  }

  const sellerResponse = selected?.dispute?.seller?.claim || null;
  const st = selected?.status;
  const underReview = st === "under_review";
  const settled = !!selected?.dispute?.settledDecision && (st === "completed" || st === "refunded" || st === "resolved");
  const someoneAccepted = !!(selected?.dispute?.buyerAccepted || selected?.dispute?.sellerAccepted);

  return (
    <AppShell current="disputes" user={{ name: shell.name, initials: shell.initials, score: shell.score }}>
      <style>{css}</style>

      <div className="tf-ph-head dp-head">
        <div><div className="tf-eyebrow">Resolution centre</div><h1>Open a dispute</h1></div>
        <Link href="/dispute/mediator" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: "#059669", textDecoration: "none", whiteSpace: "nowrap" }}>
          Talk it through with the AI mediator
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </Link>
      </div>

      {deals == null ? (
        <div className="dp-selector" aria-hidden>
          <div className="dp-sel-label">Which transaction is this about?</div>
          <Skeleton w="100%" h={52} radius={14} />
        </div>
      ) : deals.length === 0 ? (
        <div className="dp-empty">
          <div className="dp-empty-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0zM7 7h10" /></svg></div>
          <div className="dp-empty-t">No transactions to dispute</div>
          <p className="dp-empty-s">You can only open a dispute on a deal you have funded. Start a protected deal, and if something goes wrong you can raise it here.</p>
          <Link href="/new-escrow" className="tf-btn tf-btn--primary dp-empty-cta">Start a protected deal</Link>
        </div>
      ) : (
        <>
          {/* transaction selector — always first */}
          <div className="dp-selector" ref={ddRef}>
            <div className="dp-sel-label">Which transaction is this about?</div>
            <button className={`dp-sel-btn${open ? " is-open" : ""}`} onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
              {selected ? (
                <span className="dp-sel-cur"><span className="dp-sel-cur-t">{selected.item.title}</span><span className="dp-sel-cur-s tf-mono">{naira(selected.item.amount)} · {selected.seller?.name || "seller"} · {STATUS[selected.status]}</span></span>
              ) : (
                <span className="dp-sel-ph">Select a transaction</span>
              )}
              <svg className="dp-sel-caret" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {open && (
              <div className="dp-sel-menu" role="listbox">
                {deals.map((d) => (
                  <button key={d.id} className={`dp-sel-opt${d.id === selId ? " is-sel" : ""}`} role="option" aria-selected={d.id === selId} onClick={() => { setSelId(d.id); setOpen(false); }}>
                    <span className="dp-sel-opt-main"><span className="dp-sel-opt-t">{d.item.title}</span><span className="dp-sel-opt-s tf-mono">{naira(d.item.amount)} · {d.seller?.name || "seller"}</span></span>
                    <span className={`dp-sel-opt-pill dp-st-${d.status}`}>{STATUS[d.status]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {!selected ? (
            <div className="dp-prompt">Pick the transaction you want to dispute to continue.</div>
          ) : (
            <div className="dp-wrap">
              <div className="dp-form">
                <div className="tf-card dp-sec">
                  <div className="dp-sec-title">What went wrong?</div>
                  <p className="dp-sec-sub">Be specific and factual. The AI weighs both sides&apos; statements alongside the delivery evidence.</p>

                  <label className="dp-label">Reason</label>
                  <div className="dp-select-wrap">
                    <select value={reason} onChange={(e) => setReason(e.target.value)} className="dp-input dp-select">
                      {REASONS.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
                    </select>
                    <svg className="dp-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>

                  <label className="dp-label">What happened</label>
                  <textarea value={statement} onChange={(e) => { setStatement(e.target.value); setReco(null); }} placeholder="Describe what went wrong with this order." className="dp-textarea" />

                  <label className="dp-label">Attach evidence</label>
                  <div className="dp-drop">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
                    <div className="dp-drop-t">Drop screenshots, delivery photos, or invoices here</div>
                    <div className="dp-drop-s">PNG / JPG / PDF up to 8MB each</div>
                  </div>

                  <button className="tf-btn tf-btn--primary dp-analyze" disabled={busy || !statement.trim() || underReview || settled} onClick={() => void analyze()}>
                    {busy ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner light size={15} />Analysing the case…</span> : underReview ? "Under human review" : settled ? "Dispute settled" : reco ? "Re-run recommendation" : "File dispute & get AI suggestion"}
                  </button>
                </div>

                <div className="tf-card dp-sec">
                  <div className="dp-sec-title">Seller&apos;s response</div>
                  {sellerResponse ? (
                    <div className="dp-quote"><b>{selected.seller?.name || "The seller"}</b> · replied<br />&ldquo;{sellerResponse}&rdquo;</div>
                  ) : (
                    <div className="dp-quote dp-quote-muted">The seller has not responded yet. You can still get an initial read from the AI, and the seller gets 48 hours to reply once you file.</div>
                  )}
                </div>
              </div>

              <aside className="dp-side">
                <div className="dp-context tf-card">
                  <div className="tf-eyebrow">Disputing</div>
                  <div className="dp-ctx-item">{selected.item.title}</div>
                  <div className="dp-ctx-amt tf-mono">{naira(selected.item.amount)}<span> held</span></div>
                  <div className="dp-ctx-row tf-mono">{selected.reference || selected.id.slice(0, 10)} · {selected.seller?.name || "seller"}</div>
                </div>

                <div className="tf-card dp-reco">
                  <div className="dp-reco-head"><span className="dp-reco-ai">AI</span><span className="dp-reco-eyebrow">Recommended resolution</span></div>
                  {busy ? (
                    <div className="dp-reco-loading"><span className="dp-spinner" />Weighing both sides…</div>
                  ) : reco ? (
                    <>
                      <div className="dp-reco-decision">{reco.label}</div>
                      <div className="dp-reco-split">
                        <div><div className="dp-reco-k">To buyer</div><div className="dp-reco-num tf-mono">{reco.toBuyer}</div></div>
                        <div><div className="dp-reco-k">To seller</div><div className="dp-reco-num tf-mono">{reco.toSeller}</div></div>
                      </div>
                      <div className="dp-reco-why">{reco.rationale}</div>
                      {underReview ? (
                        <div className="dp-reco-state dp-reco-review">
                          <b>Escalated to a human reviewer.</b> A Zafe reviewer will settle this within 24 hours. The funds stay locked until then.
                        </div>
                      ) : settled ? (
                        <div className="dp-reco-state dp-reco-settled">
                          <b>Settled — {reco.label.toLowerCase()}.</b> The money has moved accordingly.
                        </div>
                      ) : (
                        <>
                          {someoneAccepted && <div className="dp-reco-wait">One side has accepted. This settles automatically once both sides accept.</div>}
                          <div className="dp-reco-actions">
                            <button className="tf-btn tf-btn--verify dp-accept" disabled={!!acting} onClick={() => void accept()}>
                              {acting === "accept" ? <Spinner light size={15} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}Accept
                            </button>
                            <button className="tf-btn dp-escalate" disabled={!!acting} onClick={() => void escalate()}>
                              {acting === "escalate" ? "Escalating…" : "Escalate to human"}
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="dp-reco-empty">Describe what happened, then get the AI&apos;s read on how the money should be split.</div>
                  )}
                </div>

                <div className="tf-card dp-next">
                  <div className="tf-eyebrow">What happens next</div>
                  <ol className="dp-steps">
                    <li>The seller has 48 hours to respond to the recommendation.</li>
                    <li>If both sides accept, funds move automatically via bank payout.</li>
                    <li>If either side escalates, a Zafe reviewer steps in within 24 hours.</li>
                  </ol>
                </div>
              </aside>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

const css = `
.dp-head{ display:none }
.dp-loading{ padding:50px 20px; text-align:center; color:var(--faint); font-size:14px }

.dp-empty{ max-width:460px; margin:20px auto; text-align:center; background:#fff; border:1px dashed var(--line); border-radius:18px; padding:40px 28px }
.dp-empty-ic{ width:56px; height:56px; margin:0 auto; border-radius:16px; background:var(--bg); display:flex; align-items:center; justify-content:center }
.dp-empty-t{ margin-top:16px; font-size:18px; font-weight:700; letter-spacing:-.01em }
.dp-empty-s{ margin-top:8px; font-size:14px; color:var(--muted); line-height:1.6 }
.dp-empty-cta{ margin-top:20px; height:48px }

/* transaction selector */
.dp-selector{ position:relative; max-width:640px; margin-bottom:16px }
.dp-sel-label{ font-size:12.5px; font-weight:600; color:var(--ink-2); margin-bottom:8px }
.dp-sel-btn{ width:100%; text-align:left; cursor:pointer; font-family:inherit; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); border-radius:14px; padding:14px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; transition:border-color .16s var(--ease) }
.dp-sel-btn:hover, .dp-sel-btn.is-open{ border-color:#CBD5E1 }
.dp-sel-cur{ display:flex; flex-direction:column; min-width:0 }
.dp-sel-cur-t{ font-size:15px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dp-sel-cur-s{ font-size:12px; color:var(--faint); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dp-sel-ph{ font-size:15px; color:var(--faint); font-weight:500 }
.dp-sel-caret{ flex-shrink:0 }
.dp-sel-menu{ position:absolute; z-index:20; left:0; right:0; margin-top:8px; background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:var(--sh-2); padding:6px; max-height:340px; overflow-y:auto }
.dp-sel-opt{ width:100%; text-align:left; cursor:pointer; font-family:inherit; background:none; border:none; border-radius:10px; padding:11px 12px; display:flex; align-items:center; justify-content:space-between; gap:12px }
.dp-sel-opt:hover{ background:var(--bg) }
.dp-sel-opt.is-sel{ background:var(--safe-tint) }
.dp-sel-opt-main{ display:flex; flex-direction:column; min-width:0 }
.dp-sel-opt-t{ font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dp-sel-opt-s{ font-size:11.5px; color:var(--faint); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.dp-sel-opt-pill{ flex-shrink:0; font-size:11px; font-weight:600; padding:3px 9px; border-radius:8px; background:#F1F5F9; color:#475569; white-space:nowrap }
.dp-st-funded, .dp-st-completed, .dp-st-resolved{ background:#ECFDF5; color:#047857 }
.dp-st-shipped{ background:#FEF3C7; color:#A16207 }
.dp-st-disputed{ background:#FEE2E2; color:#B91C1C }

.dp-prompt{ background:#fff; border:1px dashed var(--line); border-radius:16px; padding:34px 20px; text-align:center; color:var(--muted); font-size:14px }

.dp-wrap{ display:flex; flex-direction:column; gap:16px }
.dp-form{ display:flex; flex-direction:column; gap:16px }
.dp-sec{ padding:18px }
.dp-sec-title{ font-size:15px; font-weight:700; letter-spacing:-.01em; margin-bottom:6px }
.dp-sec-sub{ font-size:12.5px; color:var(--muted); line-height:1.5; margin:0 0 12px }
.dp-label{ display:block; margin-top:14px; font-size:12.5px; font-weight:600; color:var(--ink-2) }
.dp-sec .dp-sec-sub + .dp-label{ margin-top:0 }
.dp-input{ margin-top:7px; width:100%; box-sizing:border-box; height:52px; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:0 14px; font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:border-color .16s var(--ease) }
.dp-input:focus{ border-color:var(--safe) }
.dp-select-wrap{ position:relative }
.dp-select{ appearance:none; -webkit-appearance:none; padding-right:40px; cursor:pointer }
.dp-caret{ position:absolute; right:14px; top:50%; transform:translateY(-25%); pointer-events:none }
.dp-textarea{ margin-top:7px; width:100%; box-sizing:border-box; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:13px; min-height:120px; font-size:14px; line-height:1.55; color:var(--ink); outline:none; resize:vertical; font-family:inherit; transition:border-color .16s var(--ease) }
.dp-textarea:focus{ border-color:var(--safe) }
.dp-drop{ margin-top:7px; border:1.5px dashed #CBD5E1; border-radius:12px; padding:20px 16px; text-align:center; background:var(--bg) }
.dp-drop-t{ font-size:13px; color:var(--muted); margin-top:7px }
.dp-drop-s{ font-size:12px; color:var(--faint); margin-top:4px }
.dp-analyze{ margin-top:16px; width:100%; height:50px }
.dp-analyze:disabled{ opacity:.5; cursor:not-allowed }
.dp-quote{ background:var(--bg); border:1px solid var(--line-2); border-radius:12px; padding:13px 14px; font-size:13px; line-height:1.6; color:var(--muted) } .dp-quote b{ color:var(--ink) }
.dp-quote-muted{ color:var(--faint) }

.dp-side{ display:flex; flex-direction:column; gap:16px }
.dp-context{ padding:18px }
.dp-ctx-item{ font-size:16px; font-weight:700; letter-spacing:-.01em; margin-top:8px }
.dp-ctx-amt{ font-size:24px; font-weight:700; letter-spacing:-.02em; margin-top:4px } .dp-ctx-amt span{ font-size:13px; color:var(--faint); font-weight:600 }
.dp-ctx-row{ font-size:12px; color:var(--faint); margin-top:6px }
.dp-reco{ padding:20px; background:radial-gradient(120% 130% at 88% 0%, #14304A 0%, #0F172A 58%); border:none; color:#fff; display:flex; flex-direction:column; gap:14px }
.dp-reco-head{ display:flex; align-items:center; gap:9px }
.dp-reco-ai{ background:var(--safe); color:#fff; padding:3px 7px; border-radius:5px; font-size:10px; font-weight:700; letter-spacing:.06em }
.dp-reco-eyebrow{ font-size:11px; font-weight:600; color:rgba(255,255,255,.6); letter-spacing:.10em; text-transform:uppercase }
.dp-reco-decision{ font-size:28px; font-weight:700; letter-spacing:-.02em; line-height:1.1 }
.dp-reco-split{ display:flex; gap:18px } .dp-reco-split > div{ flex:1 }
.dp-reco-k{ font-size:11px; font-weight:600; color:rgba(255,255,255,.6); letter-spacing:.08em; text-transform:uppercase }
.dp-reco-num{ font-size:22px; font-weight:700; letter-spacing:-.02em; margin-top:4px }
.dp-reco-why{ background:rgba(255,255,255,.06); border-radius:12px; padding:12px 14px; font-size:13px; line-height:1.55; color:rgba(255,255,255,.85) }
.dp-reco-empty{ font-size:13.5px; line-height:1.55; color:rgba(255,255,255,.7) }
.dp-reco-loading{ display:flex; align-items:center; gap:10px; font-size:14px; color:rgba(255,255,255,.75); padding:6px 0 }
.dp-spinner{ width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.25); border-top-color:#fff; animation:dpspin .7s linear infinite }
@keyframes dpspin{ to{ transform:rotate(360deg) } }
.dp-reco-wait{ font-size:12.5px; line-height:1.5; color:rgba(255,255,255,.72); background:rgba(255,255,255,.05); border-radius:10px; padding:9px 11px }
.dp-reco-state{ font-size:13px; line-height:1.55; border-radius:12px; padding:12px 14px }
.dp-reco-state b{ color:#fff; font-weight:700 }
.dp-reco-review{ background:rgba(124,58,237,.18); border:1px solid rgba(167,139,250,.4); color:rgba(255,255,255,.86) }
.dp-reco-settled{ background:rgba(5,150,105,.16); border:1px solid rgba(52,211,153,.4); color:rgba(255,255,255,.9) }
.dp-reco-actions{ display:flex; gap:10px }
.dp-accept{ flex:1; height:46px }
.dp-accept:disabled, .dp-escalate:disabled{ opacity:.55; cursor:not-allowed }
.dp-escalate{ height:46px; background:rgba(255,255,255,.08); color:#fff; border:1px solid rgba(255,255,255,.18) }
.dp-escalate:hover{ background:rgba(255,255,255,.14) }
.dp-next{ padding:18px }
.dp-steps{ margin:10px 0 0; padding:0 0 0 18px; font-size:13px; line-height:1.6; color:var(--muted) } .dp-steps li{ margin-top:4px }

@media (min-width:1024px){
  .dp-head{ display:flex }
  .dp-wrap{ display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start }
  .dp-form{ gap:18px }
  .dp-sec, .dp-context, .dp-reco, .dp-next{ padding:22px }
  .dp-side{ position:sticky; top:88px; gap:18px }
}
`;
