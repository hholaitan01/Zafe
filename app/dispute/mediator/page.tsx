"use client";

/* Dispute mediator (Agent 2). A conversational version of the dispute judge: it
   interviews you, asks a few targeted questions for evidence, then recommends
   where the held money should go. Opened from a deal, it reads that deal's real
   item, amount, and chat server-side. The recommendation is a SUGGESTION: both
   sides still have to accept it before any money moves. */

import { useMemo, useState } from "react";
import AgentChat, { type ChatBubble } from "@/app/_lib/AgentChat";
import { fileMediatedDispute, getCachedDeal, getCurrentDealId, mediateDispute, naira } from "@/lib/client";
import type { DisputeResult } from "@/lib/ai/types";

const LABEL: Record<string, string> = { release_to_seller: "Pay the seller", refund_buyer: "Full refund", split: "Partial refund" };

const INTRO: ChatBubble = {
  role: "assistant",
  content: "I'm Zafe's dispute mediator. Tell me what went wrong with this deal in your own words, and I'll ask a couple of questions before I recommend where the held money should go.",
};

export default function DisputeMediatorPage() {
  const dealId = typeof window !== "undefined" ? getCurrentDealId() ?? undefined : undefined;
  const deal = dealId ? getCachedDeal(dealId) : null;
  const amount = deal?.item.amount ?? 450000;
  const currency = deal?.item.currency ?? "NGN";
  const item = useMemo(() => ({ title: deal?.item.title ?? "the item", currency }), [deal, currency]);

  const [messages, setMessages] = useState<ChatBubble[]>([INTRO]);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<DisputeResult | null>(null);
  const [filing, setFiling] = useState(false);
  const [filed, setFiled] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  async function fileIt() {
    if (!dealId || filing || filed) return;
    setFiling(true);
    setFileError(null);
    try {
      const turns = messages.filter((m) => m !== INTRO);
      await fileMediatedDispute(dealId, turns);
      setFiled(true);
    } catch {
      setFileError("Couldn't file it just now. Please try again.");
    } finally {
      setFiling(false);
    }
  }

  async function onSend(text: string) {
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const turns = next.filter((m) => m !== INTRO);
      const res = await mediateDispute(turns, { dealId, item, amount });
      if (res.kind === "question") {
        setMessages((m) => [...m, { role: "assistant", content: res.question }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Thanks. Here is my recommendation. It only takes effect if both you and the seller accept it." }]);
        setDecision(res.decision);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try sending that again." }]);
    } finally {
      setLoading(false);
    }
  }

  const buyerShare = decision
    ? decision.decision === "refund_buyer"
      ? amount
      : decision.decision === "split"
        ? Math.round(amount * (decision.splitBuyerPercent / 100))
        : 0
    : 0;

  const card = decision ? (
    <div className="med-card">
      <style>{cardCss}</style>
      <div className="med-verdict">{LABEL[decision.decision] ?? "Recommendation"}</div>
      <div className="med-splits">
        <div className="med-split"><span>To you</span><strong>{naira(buyerShare)}</strong></div>
        <div className="med-split"><span>To seller</span><strong>{naira(amount - buyerShare)}</strong></div>
      </div>
      <p className="med-rationale">{decision.rationale}</p>
      {decision.buyerPoints.length > 0 && (
        <div className="med-points"><div className="med-points-h">In your favour</div><ul>{decision.buyerPoints.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
      )}
      {decision.sellerPoints.length > 0 && (
        <div className="med-points"><div className="med-points-h">For the seller</div><ul>{decision.sellerPoints.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
      )}
      <div className="med-meta">Confidence {decision.confidence}%{decision.mode !== "live" ? " · demo" : ""}</div>
      {filed ? (
        <>
          <div className="med-filed">Filed on your dispute. Both sides now accept it before any money moves.</div>
          <a className="med-cta" href="/dispute">Review and accept in your dispute</a>
        </>
      ) : dealId ? (
        <>
          {fileError && <div className="med-err">{fileError}</div>}
          <button className="med-cta" onClick={fileIt} disabled={filing}>{filing ? "Filing…" : "File this on my dispute"}</button>
          <div className="med-note">This attaches the recommendation to your deal. No money moves until both sides accept it.</div>
        </>
      ) : (
        <>
          <a className="med-cta" href="/dispute">Open this in your dispute</a>
          <div className="med-note">Open the mediator from one of your deals to file this recommendation onto it.</div>
        </>
      )}
    </div>
  ) : null;

  return (
    <AgentChat
      title="Dispute mediator"
      subtitle="AI mediation. Both sides must accept the outcome."
      back="/dispute"
      messages={messages}
      loading={loading}
      onSend={onSend}
      placeholder="Describe what happened"
      disabled={Boolean(decision)}
      pinned={card}
    />
  );
}

const cardCss = `
.med-card{ background:#fff; border:1px solid #E6EAF0; border-radius:16px; padding:18px; box-shadow:0 12px 30px -18px rgba(15,23,42,.22);
  font-family:'IBM Plex Sans',system-ui,sans-serif }
.med-verdict{ font-size:18px; font-weight:800; color:#0F172A; letter-spacing:-.01em }
.med-splits{ display:flex; gap:12px; margin-top:12px }
.med-split{ flex:1; background:#F8FAFC; border:1px solid #E6EAF0; border-radius:12px; padding:11px 13px }
.med-split span{ display:block; font-size:11.5px; color:#64748B; font-weight:600 }
.med-split strong{ display:block; font-size:18px; color:#0F172A; margin-top:2px; font-variant-numeric:tabular-nums }
.med-rationale{ margin:14px 0 0; font-size:14px; line-height:1.55; color:#334155 }
.med-points{ margin-top:12px }
.med-points-h{ font-size:11.5px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; color:#64748B }
.med-points ul{ margin:5px 0 0; padding-left:18px }
.med-points li{ font-size:13.5px; line-height:1.5; color:#334155 }
.med-meta{ margin-top:14px; font-size:12px; color:#64748B }
.med-cta{ display:block; width:100%; text-align:center; margin-top:14px; padding:13px; border-radius:12px; border:none; background:#0F172A; color:#F8FAFC;
  font-family:inherit; font-weight:700; font-size:14.5px; text-decoration:none; cursor:pointer; transition:background .18s cubic-bezier(.22,1,.36,1) }
.med-cta:hover:not(:disabled){ background:#1e293b }
.med-cta:disabled{ opacity:.6; cursor:not-allowed }
.med-filed{ margin-top:14px; padding:10px 12px; border-radius:10px; background:#ECFDF5; border:1px solid #C7F0DE; color:#047857; font-size:13px; font-weight:600 }
.med-note{ margin-top:9px; font-size:12px; color:#64748B; text-align:center; line-height:1.5 }
.med-err{ margin-top:12px; font-size:13px; color:#DC2626; font-weight:500 }
`;
