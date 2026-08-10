"use client";

/* Receipt — the proof a completed escrow leaves behind, styled like a bank
   transfer receipt: a logo panel, a "Payment Released" confirmation, divider
   rows, and a scalloped bottom edge, on a deep canvas with Share / Done. Bound
   to the real deal (amount, parties, item, reference, release time). */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentDealId, getDeal } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";

function money(n: number): string {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDateTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${date} at ${time}`;
}
/** A long, deterministic session id from the deal, in the style banks print. */
function sessionId(deal: Deal): string {
  if (deal.payoutRef && /\d{10,}/.test(deal.payoutRef)) return deal.payoutRef;
  let digits = "";
  for (const c of deal.id + deal.reference) digits += (c.charCodeAt(0) * 7 % 100).toString().padStart(2, "0");
  return `100004${digits}${String(deal.item.amount)}`.replace(/\D/g, "").padEnd(30, "0").slice(0, 30);
}

export default function ReceiptPage() {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    getDeal(id).then((d) => alive && setDeal(d)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const releasedAt = deal ? [...deal.timeline].reverse().find((e) => e.status === "completed" || e.status === "resolved")?.at || deal.updatedAt : undefined;
  const ref = deal?.reference || deal?.id.slice(0, 12) || "";
  const seller = deal?.seller?.name || "Seller";
  const payoutAcct = deal?.sellerPayout?.accountNumber;
  const payoutBank = deal?.sellerPayout ? (deal.sellerPayout as { bankCode?: string }).bankCode : undefined;
  const beneficiary = payoutAcct ? `${payoutBank || "Bank"} - ${payoutAcct}` : "Escrow release account";

  function share() {
    if (!deal) return;
    const text = `Zafe receipt\n${money(deal.item.amount)} released for ${deal.item.title}\nTo: ${seller}\nRef: ${ref}\n${fmtDateTime(releasedAt)}`;
    if (navigator.share) { navigator.share({ title: "Zafe receipt", text }).catch(() => {}); return; }
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }

  return (
    <main className="rc">
      <style>{css}</style>
      <div className="rc-inner">
        <div className="rc-card rc-enter">
          {/* logo panel */}
          <div className="rc-logo">
            <span className="rc-mark"><svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8.5 10.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" /><path d="M8.5 21.5H23.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" /><path d="M23.5 10.5L8.5 21.5" stroke="#10B981" strokeWidth="4.2" strokeLinecap="round" /></svg></span>
            <span className="rc-wordmark">Zafe<span>Escrow</span></span>
          </div>

          <div className="rc-status">
            <span className="rc-check"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
            Payment Released
          </div>

          <div className="rc-rows">
            <Row k="Total amount" v={deal ? money(deal.item.amount) : ""} strong />
            <Row k="From" v={deal?.buyerEmail ? deal.buyerEmail.split("@")[0].toUpperCase() : "BUYER (ESCROW)"} strong />
            <Row k="Beneficiary account" v={beneficiary} strong />
            <Row k="Recipient" v={seller.toUpperCase()} strong />
            <Row k="Transaction ID" v={ref} mono />
            <Row k="Session ID" v={deal ? sessionId(deal) : ""} mono />
            <Row k="Item" v={deal?.item.title || ""} />
            <Row k="Date / Time" v={fmtDateTime(releasedAt)} last />
          </div>

          <div className="rc-scallop" aria-hidden="true" />
        </div>

        <div className="rc-actions">
          <button className="rc-btn rc-share" onClick={share}>{copied ? "Copied" : "Share Receipt"}</button>
          <button className="rc-btn rc-done" onClick={() => router.push("/dashboard")}>Done</button>
        </div>
      </div>
    </main>
  );
}

function Row({ k, v, strong, mono, last }: { k: string; v: string; strong?: boolean; mono?: boolean; last?: boolean }) {
  return (
    <div className={`rc-row${last ? " rc-row-last" : ""}`}>
      <span className="rc-k">{k}</span>
      <span className={`rc-v${strong ? " rc-v-strong" : ""}${mono ? " tf-mono" : ""}`}>{v || "—"}</span>
    </div>
  );
}

const css = `
.rc{ --paper:#0E2036; --ink:#0F172A; --muted:#6B7280; --faint:#9CA3AF; --line:#EEF0F3; --safe:#10B981;
  --ease:cubic-bezier(.22,1,.36,1); font-family:'IBM Plex Sans',system-ui,sans-serif;
  background:linear-gradient(180deg,#0E2036,#0B1626); min-height:100dvh; display:flex; justify-content:center;
  padding:28px 18px 34px; -webkit-font-smoothing:antialiased }
.rc *{ box-sizing:border-box }
.tf-mono{ font-family:ui-monospace,'SF Mono',Menlo,monospace; font-variant-numeric:tabular-nums }
.rc-inner{ width:100%; max-width:460px }

.rc-card{ position:relative; background:#fff; color:var(--ink); border-radius:20px 20px 0 0; padding:22px 22px 26px; box-shadow:0 30px 60px -28px rgba(0,0,0,.55) }
.rc-enter{ animation:rcIn .5s var(--ease) both } @keyframes rcIn{ from{ opacity:0; transform:translateY(12px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .rc-enter{ animation:none } }

.rc-logo{ background:#F4F7FA; border-radius:14px; padding:22px; display:flex; align-items:center; justify-content:center; gap:10px }
.rc-mark{ width:38px; height:38px; border-radius:11px; background:#fff; border:1px solid var(--line); display:flex; align-items:center; justify-content:center }
.rc-wordmark{ font-size:19px; font-weight:800; letter-spacing:-.02em; color:var(--ink); display:flex; flex-direction:column; line-height:1 }
.rc-wordmark span{ font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--faint); margin-top:3px }

.rc-status{ display:flex; align-items:center; justify-content:center; gap:10px; margin-top:24px; font-size:21px; font-weight:800; letter-spacing:-.02em }
.rc-check{ width:26px; height:26px; border-radius:50%; background:var(--safe); display:flex; align-items:center; justify-content:center; flex-shrink:0 }

.rc-rows{ margin-top:22px }
.rc-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:16px 0; border-bottom:1px solid var(--line) }
.rc-row-last{ border-bottom:none }
.rc-k{ font-size:15px; color:var(--muted); flex-shrink:0 }
.rc-v{ font-size:15px; text-align:right; word-break:break-word; min-width:0; color:var(--ink) }
.rc-v-strong{ font-weight:800; letter-spacing:-.01em }

.rc-scallop{ position:absolute; left:0; right:0; bottom:-13px; height:14px;
  background:radial-gradient(circle 9px at 11px -1px, var(--paper) 0 9px, transparent 9.5px) repeat-x;
  background-size:22px 14px }

.rc-actions{ margin-top:26px; display:flex; flex-direction:column; gap:12px }
.rc-btn{ width:100%; height:56px; border-radius:14px; font-family:inherit; font-weight:700; font-size:16px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), background .18s var(--ease), border-color .18s var(--ease) }
.rc-btn:active{ transform:scale(.99) }
.rc-share{ background:#fff; color:var(--ink) } .rc-share:hover{ background:#F1F5F9 }
.rc-done{ background:transparent; color:#fff; border-color:rgba(255,255,255,.35) } .rc-done:hover{ border-color:rgba(255,255,255,.6) }
`;
