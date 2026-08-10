"use client";

/* Human review queue — deals escalated from a dispute (status "under_review").
   A reviewer sees both sides' claims and the AI's original suggestion, then
   rules: release to the seller, refund the buyer, or split. The ruling moves the
   money server-side (the same guarded path as everything else). Admin-only: the
   API gates on isAdmin() (demo mode allows it; live mode on ADMIN_EMAILS), and a
   non-admin just sees a not-authorized state. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/app/_lib/States";
import { toast } from "@/app/_lib/Toast";
import { naira } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";
import type { DisputeDecision } from "@/lib/ai/types";

const SUGGESTION: Record<DisputeDecision, string> = {
  release_to_seller: "Release to seller",
  refund_buyer: "Refund buyer",
  split: "Split",
};

function ReviewCard({ deal, onResolved }: { deal: Deal; onResolved: (id: string) => void }) {
  const dp = deal.dispute;
  const suggested = dp?.resolution;
  const [decision, setDecision] = useState<DisputeDecision>(suggested?.decision ?? "release_to_seller");
  const [split, setSplit] = useState<number>(suggested?.splitBuyerPercent ?? 50);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function resolve() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/disputes/${deal.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, splitBuyerPercent: decision === "split" ? split : undefined, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(String(res.status));
      toast.success("Ruling applied. The funds have been settled.");
      onResolved(deal.id);
    } catch {
      toast.error("Couldn't apply the ruling. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="ad-card">
      <div className="ad-card-head">
        <div>
          <div className="ad-item">{deal.item.title}</div>
          <div className="ad-meta">{deal.reference || deal.id.slice(0, 10)} · escalated by {dp?.escalatedBy || "a party"}</div>
        </div>
        <div className="ad-amt">{naira(deal.item.amount)}</div>
      </div>

      <div className="ad-parties">
        <div className="ad-party">
          <div className="ad-party-h">Buyer{dp?.buyerAccepted ? " · accepted AI" : ""}</div>
          <p>{dp?.buyer?.claim || "No statement provided."}</p>
          <div className="ad-contact">{deal.buyerEmail || "buyer"}</div>
        </div>
        <div className="ad-party">
          <div className="ad-party-h">Seller{dp?.sellerAccepted ? " · accepted AI" : ""}</div>
          <p>{dp?.seller?.claim || "No response provided."}</p>
          <div className="ad-contact">{deal.seller?.name || deal.seller?.contact || "seller"}</div>
        </div>
      </div>

      {suggested && (
        <div className="ad-ai">
          <span className="ad-ai-tag">AI suggested</span>
          <span className="ad-ai-txt"><b>{SUGGESTION[suggested.decision]}{suggested.decision === "split" ? ` (${suggested.splitBuyerPercent}% buyer)` : ""}.</b> {suggested.rationale}</span>
        </div>
      )}

      <div className="ad-ruling">
        <div className="ad-ruling-h">Your ruling</div>
        <div className="ad-choices">
          {(Object.keys(SUGGESTION) as DisputeDecision[]).map((d) => (
            <button key={d} className={`ad-choice${decision === d ? " is-on" : ""}`} onClick={() => setDecision(d)}>{SUGGESTION[d]}</button>
          ))}
        </div>
        {decision === "split" && (
          <label className="ad-split">
            Buyer gets
            <input type="number" min={0} max={100} value={split} onChange={(e) => setSplit(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
            % · seller gets {100 - split}%
          </label>
        )}
        <textarea className="ad-note" placeholder="Reason for the ruling (shown on the deal timeline)." value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="ad-resolve" disabled={busy} onClick={() => void resolve()}>
          {busy ? <span className="ad-resolve-busy"><Spinner light size={15} />Applying…</span> : "Apply ruling & move funds"}
        </button>
      </div>
    </div>
  );
}

export default function AdminDisputesPage() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/disputes");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { deals: Deal[] };
      setDeals(data.deals);
    } catch {
      setError(true);
      setDeals([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const onResolved = (id: string) => setDeals((ds) => (ds ? ds.filter((d) => d.id !== id) : ds));

  return (
    <main className="ad">
      <style>{css}</style>
      <header className="ad-top">
        <div className="ad-wrap ad-toprow">
          <Link href="/dashboard" className="ad-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8.5 10.5H23.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" /><path d="M8.5 21.5H23.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" /><path d="M23.5 10.5L8.5 21.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" /></svg>
            <span>Zafe</span>
          </Link>
          <span className="ad-role">Review queue</span>
        </div>
      </header>

      <div className="ad-wrap ad-body">
        <div className="ad-eyebrow">Dispute resolution</div>
        <h1 className="ad-title">Human review queue</h1>
        <p className="ad-sub">Disputes a party escalated. The funds are locked until you rule. Your decision moves the money and is recorded on the deal.</p>

        {deals == null ? (
          <div className="ad-state">Loading the queue…</div>
        ) : error ? (
          <div className="ad-state">Couldn&apos;t load the queue. You may not have reviewer access, or there was a network error.</div>
        ) : deals.length === 0 ? (
          <div className="ad-state ad-empty">Nothing in the queue. Escalated disputes will appear here.</div>
        ) : (
          <div className="ad-list">
            {deals.map((d) => <ReviewCard key={d.id} deal={d} onResolved={onResolved} />)}
          </div>
        )}
      </div>
    </main>
  );
}

const css = `
.ad{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC;
  --card:#FFFFFF; --border:#E6EAF0; --safe:#059669; --safe-tint:#ECFDF5; --danger:#DC2626; --violet:#7C3AED;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--ink); background:var(--bg); min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5 }
.ad *{ box-sizing:border-box }
.ad a{ text-decoration:none }
.ad-wrap{ width:100%; max-width:820px; margin:0 auto; padding:0 22px }
.ad-top{ position:sticky; top:0; z-index:10; background:rgba(248,250,252,.85); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border) }
.ad-toprow{ display:flex; align-items:center; justify-content:space-between; height:60px }
.ad-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:16px; letter-spacing:-.02em; color:var(--ink) }
.ad-role{ font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--violet); background:#EDE9FE; padding:5px 10px; border-radius:8px }

.ad-body{ padding:34px 22px 72px }
.ad-eyebrow{ font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--violet) }
.ad-title{ margin-top:8px; font-size:32px; font-weight:800; letter-spacing:-.03em }
.ad-sub{ margin-top:10px; font-size:15px; color:var(--muted); max-width:60ch; line-height:1.6 }

.ad-state{ margin-top:26px; padding:34px 22px; text-align:center; color:var(--muted); font-size:14.5px; background:#fff; border:1px dashed var(--border); border-radius:16px }
.ad-empty{ color:var(--faint) }
.ad-list{ margin-top:26px; display:flex; flex-direction:column; gap:18px }

.ad-card{ background:#fff; border:1px solid var(--border); border-radius:18px; padding:20px; box-shadow:0 12px 30px -22px rgba(15,23,42,.25) }
.ad-card-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px }
.ad-item{ font-size:17px; font-weight:800; letter-spacing:-.01em }
.ad-meta{ font-size:12.5px; color:var(--faint); margin-top:3px }
.ad-amt{ font-size:20px; font-weight:800; letter-spacing:-.02em; white-space:nowrap; font-variant-numeric:tabular-nums }

.ad-parties{ display:grid; grid-template-columns:1fr; gap:12px; margin-top:16px }
.ad-party{ background:var(--bg); border:1px solid var(--border); border-radius:13px; padding:13px 14px }
.ad-party-h{ font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-2) }
.ad-party p{ margin-top:6px; font-size:13.5px; color:var(--ink-2); line-height:1.5 }
.ad-contact{ margin-top:7px; font-size:12px; color:var(--faint); font-variant-numeric:tabular-nums }

.ad-ai{ margin-top:14px; display:flex; gap:10px; align-items:flex-start; background:#EDE9FE; border:1px solid #DDD6FE; border-radius:12px; padding:12px 14px }
.ad-ai-tag{ flex-shrink:0; font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff; background:var(--violet); padding:3px 7px; border-radius:6px; margin-top:1px }
.ad-ai-txt{ font-size:13px; line-height:1.55; color:#4C1D95 } .ad-ai-txt b{ font-weight:700 }

.ad-ruling{ margin-top:16px; border-top:1px solid var(--border); padding-top:16px }
.ad-ruling-h{ font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--ink-2) }
.ad-choices{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap }
.ad-choice{ cursor:pointer; font-family:inherit; font-size:13.5px; font-weight:600; color:var(--ink-2); background:#fff; border:1px solid var(--border); border-radius:10px; padding:9px 13px; transition:all .14s var(--ease) }
.ad-choice:hover{ border-color:#CBD5E1 }
.ad-choice.is-on{ background:var(--ink); color:#fff; border-color:var(--ink) }
.ad-split{ display:flex; align-items:center; gap:8px; margin-top:12px; font-size:13.5px; color:var(--ink-2) }
.ad-split input{ width:70px; height:38px; border-radius:9px; border:1px solid var(--border); padding:0 10px; font-family:inherit; font-size:14px; text-align:center }
.ad-note{ margin-top:12px; width:100%; min-height:64px; border-radius:11px; border:1px solid var(--border); background:var(--bg); padding:11px 13px; font-family:inherit; font-size:13.5px; line-height:1.5; color:var(--ink); resize:vertical; outline:none }
.ad-note:focus{ border-color:var(--safe) }
.ad-resolve{ margin-top:14px; width:100%; height:48px; border:none; border-radius:12px; background:var(--safe); color:#fff; font-family:inherit; font-weight:700; font-size:15px; cursor:pointer; transition:transform .12s var(--ease), box-shadow .18s var(--ease) }
.ad-resolve:hover{ box-shadow:0 10px 22px -12px rgba(5,150,105,.6) }
.ad-resolve:disabled{ opacity:.6; cursor:not-allowed }
.ad-resolve-busy{ display:inline-flex; align-items:center; gap:8px }

@media (min-width:720px){ .ad-parties{ grid-template-columns:1fr 1fr } }
`;
