"use client";

/* Dispute — file a case and see the AI mediator's recommendation. Desktop keeps
   the imported design's structure: a form column (reason, what happened,
   evidence, and the seller's response) beside a sticky sidebar carrying the
   navy AI-recommendation card and a "what happens next" panel. It stacks to a
   mobile column inside AppShell. The recommendation is real: it runs the AI
   dispute judge on the case and binds its decision, split, and rationale. */

import { useEffect, useRef, useState } from "react";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentDealId, getDeal, judgeDispute, naira } from "@/lib/client";

const REASONS = [
  { v: "never-arrived", label: "Item never arrived" },
  { v: "item-not-as-described", label: "Item not as described" },
  { v: "damaged", label: "Item arrived damaged" },
  { v: "counterfeit", label: "Counterfeit / fake" },
  { v: "other", label: "Other" },
];
const LABEL: Record<string, string> = { release_to_seller: "Pay the seller", refund_buyer: "Full refund", split: "Partial refund" };
const SELLER = { claim: "Item was as agreed when shipped. Willing to refund part of it.", evidence: ["Pre-ship photo"] };

interface Reco { label: string; toBuyer: string; toSeller: string; rationale: string }

export default function DisputePage() {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("item-not-as-described");
  const [statement, setStatement] = useState("Item arrived but it doesn't match what we agreed in the chat. Photos attached. The seller now disputes what was promised.");
  const [reco, setReco] = useState<Reco | null>(null);
  const [busy, setBusy] = useState(true);
  const amountRef = useRef(0);

  async function analyze(amt: number, claim: string) {
    setBusy(true);
    try {
      const r = await judgeDispute({
        item: { title: "disputed item", amount: amt, currency: "NGN" },
        amount: amt,
        buyer: { claim, evidence: ["Photo", "Chat log"] },
        seller: SELLER,
      });
      const buyerShare = r.decision === "refund_buyer" ? amt : r.decision === "split" ? Math.round(amt * (r.splitBuyerPercent / 100)) : 0;
      setReco({ label: LABEL[r.decision] ?? "Reviewed", toBuyer: naira(buyerShare), toSeller: naira(amt - buyerShare), rationale: r.rationale });
    } catch {
      setReco(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      let amt = 450000;
      const id = getCurrentDealId();
      if (id) {
        try { const d = await getDeal(id); if (d?.item?.amount) amt = d.item.amount; } catch { /* default */ }
      }
      if (!alive) return;
      setAmount(amt);
      amountRef.current = amt;
      void analyze(amt, statement);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell current="disputes" user={{ name: "You", initials: "" }}>
      <style>{css}</style>

      <div className="tf-ph-head dp-head">
        <div><div className="tf-eyebrow">Resolution centre</div><h1>Open a dispute</h1></div>
      </div>

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
            <textarea value={statement} onChange={(e) => setStatement(e.target.value)} className="dp-textarea" />

            <label className="dp-label">Attach evidence</label>
            <div className="dp-drop">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
              <div className="dp-drop-t">Drop screenshots, delivery photos, or invoices here</div>
              <div className="dp-drop-s">PNG / JPG / PDF up to 8MB each</div>
            </div>

            <button className="tf-btn tf-btn--primary dp-analyze" disabled={busy || !statement.trim()} onClick={() => void analyze(amountRef.current, statement)}>
              {busy ? "Analysing the case…" : "Get AI recommendation"}
            </button>
          </div>

          <div className="tf-card dp-sec">
            <div className="dp-sec-title">Seller&apos;s response</div>
            <div className="dp-quote"><b>The seller</b> · replied<br />&ldquo;{SELLER.claim}&rdquo;</div>
          </div>
        </div>

        <aside className="dp-side">
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
                <div className="dp-reco-actions">
                  <button className="tf-btn tf-btn--verify dp-accept"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Accept</button>
                  <button className="tf-btn dp-escalate">Escalate to human</button>
                </div>
              </>
            ) : (
              <div className="dp-reco-why">Couldn&apos;t reach the mediator. Try &ldquo;Get AI recommendation&rdquo; again.</div>
            )}
          </div>

          <div className="tf-card dp-next">
            <div className="tf-eyebrow">What happens next</div>
            <ol className="dp-steps">
              <li>The seller has 48 hours to respond to the recommendation.</li>
              <li>If both sides accept, funds move automatically via bank payout.</li>
              <li>If either side escalates, a TrustFlow reviewer steps in within 24 hours.</li>
            </ol>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

const css = `
.dp-head{ display:none }
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

.dp-side{ display:flex; flex-direction:column; gap:16px }
.dp-reco{ padding:20px; background:radial-gradient(120% 130% at 88% 0%, #14304A 0%, #0F172A 58%); border:none; color:#fff; display:flex; flex-direction:column; gap:14px }
.dp-reco-head{ display:flex; align-items:center; gap:9px }
.dp-reco-ai{ background:var(--safe); color:#fff; padding:3px 7px; border-radius:5px; font-size:10px; font-weight:700; letter-spacing:.06em }
.dp-reco-eyebrow{ font-size:11px; font-weight:600; color:rgba(255,255,255,.6); letter-spacing:.10em; text-transform:uppercase }
.dp-reco-decision{ font-size:28px; font-weight:700; letter-spacing:-.02em; line-height:1.1 }
.dp-reco-split{ display:flex; gap:18px }
.dp-reco-split > div{ flex:1 }
.dp-reco-k{ font-size:11px; font-weight:600; color:rgba(255,255,255,.6); letter-spacing:.08em; text-transform:uppercase }
.dp-reco-num{ font-size:22px; font-weight:700; letter-spacing:-.02em; margin-top:4px }
.dp-reco-why{ background:rgba(255,255,255,.06); border-radius:12px; padding:12px 14px; font-size:13px; line-height:1.55; color:rgba(255,255,255,.85) }
.dp-reco-loading{ display:flex; align-items:center; gap:10px; font-size:14px; color:rgba(255,255,255,.75); padding:6px 0 }
.dp-spinner{ width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.25); border-top-color:#fff; animation:dpspin .7s linear infinite }
@keyframes dpspin{ to{ transform:rotate(360deg) } }
.dp-reco-actions{ display:flex; gap:10px }
.dp-accept{ flex:1; height:46px }
.dp-escalate{ height:46px; background:rgba(255,255,255,.08); color:#fff; border:1px solid rgba(255,255,255,.18) }
.dp-escalate:hover{ background:rgba(255,255,255,.14) }

.dp-next{ padding:18px }
.dp-steps{ margin:10px 0 0; padding:0 0 0 18px; font-size:13px; line-height:1.6; color:var(--muted) }
.dp-steps li{ margin-top:4px }

@media (min-width:1024px){
  .dp-head{ display:flex }
  .dp-wrap{ display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start }
  .dp-form{ gap:18px }
  .dp-sec, .dp-reco, .dp-next{ padding:22px }
  .dp-side{ position:sticky; top:88px; gap:18px }
}
`;
