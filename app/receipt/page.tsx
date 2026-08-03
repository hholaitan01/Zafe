"use client";

/* Receipt — the proof a completed escrow leaves behind. Rebuilt in the v2 light
   language and bound to the real deal (amount, parties, item, ref, timeline).
   A centred document card that reads well at any width. Share copies a plain
   summary; Done returns home. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentDealId, getDeal, naira } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}`;
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
  const ref = deal?.reference || deal?.id.slice(0, 12) || "—";

  function share() {
    if (!deal) return;
    const text = `TrustFlow receipt\n${naira(deal.item.amount)} · ${deal.item.title}\nSeller: ${deal.seller?.name || "—"}\nRef: ${ref}\nReleased: ${fmtDateTime(releasedAt)}`;
    if (navigator.share) { navigator.share({ title: "TrustFlow receipt", text }).catch(() => {}); return; }
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }

  return (
    <main className="rc">
      <style>{css}</style>
      <div className="rc-inner">
        <div className="rc-card rc-enter">
          <div className="rc-head">
            <div className="rc-check"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
            <div className="rc-head-label">Transaction successful</div>
            <div className="rc-amount tf-mono">{deal ? naira(deal.item.amount) : "—"}</div>
            <div className="rc-pill">RELEASED TO SELLER</div>
          </div>

          <div className="rc-rows">
            <Row k="Item" v={deal?.item.title || "—"} />
            <Row k="Seller" v={deal?.seller?.name || "—"} />
            {deal?.buyerEmail && <Row k="Buyer" v={deal.buyerEmail} />}
            <Row k="Released" v={fmtDateTime(releasedAt)} />
            <Row k="Reference" v={ref} mono />
            <Row k="Transaction ID" v={deal?.id || "—"} mono />
          </div>

          <div className="rc-foot">
            <svg width="16" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#0F172A" /><path d="M11 16.2 14.6 20 21.5 12.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Secured by TrustFlow escrow</span>
          </div>
        </div>

        <div className="rc-actions">
          <button className="tf-btn rc-share" onClick={share}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 15V3M8 7l4-4 4 4" /></svg>
            {copied ? "Copied" : "Share receipt"}
          </button>
          <button className="tf-btn rc-done" onClick={() => router.push("/dashboard")}>Done</button>
        </div>
      </div>
    </main>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return <div className="rc-row"><span className="rc-row-k">{k}</span><span className={`rc-row-v${mono ? " tf-mono" : ""}`}>{v}</span></div>;
}

const css = `
.rc{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC; --card:#fff;
  --line:#E6EAF0; --line-2:#EEF2F6; --safe:#059669; --safe-2:#10B981; --safe-tint:#ECFDF5;
  --ease:cubic-bezier(.22,1,.36,1); font-family:'IBM Plex Sans',system-ui,sans-serif; color:var(--ink);
  background:var(--bg); min-height:100dvh; display:flex; align-items:flex-start; justify-content:center; padding:32px 20px 40px; -webkit-font-smoothing:antialiased }
.rc *{ box-sizing:border-box }
.tf-mono{ font-family:ui-monospace,'SF Mono',Menlo,monospace; font-variant-numeric:tabular-nums }
.rc-inner{ width:100%; max-width:440px }
.rc-card{ background:var(--card); border:1px solid var(--line); border-radius:22px; box-shadow:0 24px 48px -24px rgba(15,23,42,.30); overflow:hidden }
.rc-enter{ animation:rcIn .5s var(--ease) both } @keyframes rcIn{ from{ opacity:0; transform:translateY(12px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){ .rc-enter{ animation:none } }
.rc-head{ padding:28px 24px 22px; text-align:center; border-bottom:1.5px dashed var(--line) }
.rc-check{ width:64px; height:64px; margin:0 auto; border-radius:50%; background:radial-gradient(circle at 35% 30%, #6EE7B7, var(--safe-2) 55%, var(--safe)); display:flex; align-items:center; justify-content:center; box-shadow:0 14px 30px -10px rgba(5,150,105,.5) }
.rc-head-label{ margin-top:14px; font-size:13px; color:var(--muted) }
.rc-amount{ margin-top:4px; font-size:32px; font-weight:700; letter-spacing:-.03em }
.rc-pill{ margin-top:10px; display:inline-flex; align-items:center; padding:5px 12px; border-radius:999px; background:var(--safe-tint); color:#047857; font-size:11px; font-weight:700; letter-spacing:.04em }
.rc-rows{ padding:18px 24px }
.rc-row{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:9px 0; font-size:13.5px }
.rc-row-k{ color:var(--muted); flex-shrink:0 }
.rc-row-v{ font-weight:600; text-align:right; word-break:break-word; min-width:0 }
.rc-foot{ padding:14px 24px 20px; border-top:1.5px dashed var(--line); display:flex; align-items:center; justify-content:center; gap:8px; font-size:12.5px; font-weight:600; color:var(--muted) }
.rc-actions{ margin-top:20px; display:flex; gap:12px }
.rc-btn, .tf-btn{ flex:1; height:54px; border-radius:14px; display:inline-flex; align-items:center; justify-content:center; gap:8px; font-family:inherit; font-weight:600; font-size:15px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), border-color .18s var(--ease), background .18s var(--ease) }
.tf-btn:active{ transform:scale(.98) }
.rc-share{ background:#fff; border-color:var(--line); color:var(--ink); box-shadow:0 1px 2px rgba(15,23,42,.05) } .rc-share:hover{ border-color:#CBD5E1 }
.rc-done{ background:var(--ink); color:#fff } .rc-done:hover{ background:#06152A }
`;
