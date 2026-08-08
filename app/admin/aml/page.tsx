"use client";

/* AML monitoring queue — deals that trip a transaction-monitoring rule (large or
   reportable amount, AI-risky, dispute lost), for a compliance officer to review
   and, where due, report to the NFIU. Read-only decision support; filing is a
   human step. Admin-only (the API gates on isAdmin). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { naira } from "@/lib/client";
import type { Deal } from "@/lib/deals/types";
import type { AmlFlag, FlagSeverity } from "@/lib/compliance/monitoring";

interface Item { deal: Deal; flags: AmlFlag[] }

const SEV: Record<FlagSeverity, { label: string; cls: string }> = {
  report: { label: "Report", cls: "report" },
  review: { label: "Review", cls: "review" },
  info: { label: "Note", cls: "info" },
};

export default function AmlQueuePage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/aml");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { items: Item[] };
      setItems(data.items);
    } catch {
      setError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = (items || []).reduce(
    (a, x) => { const s = x.flags[0]?.severity; if (s) a[s] += 1; return a; },
    { report: 0, review: 0, info: 0 } as Record<FlagSeverity, number>,
  );

  return (
    <main className="ml">
      <style>{css}</style>
      <header className="ml-top">
        <div className="ml-wrap ml-toprow">
          <Link href="/dashboard" className="ml-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#059669"/><path d="M11 16.2 14.6 20 21.5 12.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>TrustFlow</span>
          </Link>
          <span className="ml-role">AML monitoring</span>
        </div>
      </header>

      <div className="ml-wrap ml-body">
        <div className="ml-eyebrow">Anti-money-laundering</div>
        <h1 className="ml-title">Transaction monitoring queue</h1>
        <p className="ml-sub">Deals that tripped a monitoring rule. These are decision-support flags — a compliance officer confirms them and, where a threshold is met, files a report with the NFIU within the statutory window.</p>

        {items && items.length > 0 && (
          <div className="ml-counts">
            <span className="ml-count report">{counts.report} reportable</span>
            <span className="ml-count review">{counts.review} to review</span>
            <span className="ml-count info">{counts.info} note</span>
          </div>
        )}

        {items == null ? (
          <div className="ml-state">Loading the queue…</div>
        ) : error ? (
          <div className="ml-state">Couldn&apos;t load the queue. You may not have reviewer access, or there was a network error.</div>
        ) : items.length === 0 ? (
          <div className="ml-state ml-empty">Nothing flagged. Deals that trip a monitoring rule will appear here.</div>
        ) : (
          <div className="ml-list">
            {items.map(({ deal, flags }) => (
              <div className="ml-card" key={deal.id}>
                <div className="ml-chead">
                  <div>
                    <div className="ml-item">{deal.item.title}</div>
                    <div className="ml-meta">{deal.reference || deal.id.slice(0, 10)} · {deal.buyerEmail || "buyer"} → {deal.seller?.name || deal.seller?.contact || "seller"} · {deal.status}</div>
                  </div>
                  <div className="ml-amt">{naira(deal.item.amount)}</div>
                </div>
                <ul className="ml-flags">
                  {flags.map((f, i) => (
                    <li key={i} className="ml-flag">
                      <span className={`ml-sev ${SEV[f.severity].cls}`}>{SEV[f.severity].label}</span>
                      <span className="ml-flag-msg">{f.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const css = `
.ml{ --ground:#F8FAFC; --surface:#FFFFFF; --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8;
  --border:#E6EAF0; --safe:#059669; --report:#B91C1C; --report-bg:#FEE2E2; --review:#B45309; --review-bg:#FEF3C7;
  --info:#475569; --info-bg:#EEF2F6;
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; color:var(--ink); background:var(--ground);
  min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5 }
.ml *{ box-sizing:border-box } .ml a{ text-decoration:none }
.ml-wrap{ width:100%; max-width:840px; margin:0 auto; padding:0 22px }
.ml-top{ position:sticky; top:0; z-index:10; background:rgba(248,250,252,.85); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border) }
.ml-toprow{ display:flex; align-items:center; justify-content:space-between; height:60px }
.ml-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:16px; letter-spacing:-.02em; color:var(--ink) }
.ml-role{ font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--report); background:var(--report-bg); padding:5px 10px; border-radius:8px }
.ml-body{ padding:34px 22px 72px }
.ml-eyebrow{ font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--report) }
.ml-title{ margin-top:8px; font-size:32px; font-weight:800; letter-spacing:-.03em }
.ml-sub{ margin-top:10px; font-size:15px; color:var(--muted); max-width:62ch; line-height:1.6 }
.ml-counts{ margin-top:18px; display:flex; gap:10px; flex-wrap:wrap }
.ml-count{ font-size:12.5px; font-weight:700; padding:6px 12px; border-radius:999px }
.ml-count.report{ color:var(--report); background:var(--report-bg) }
.ml-count.review{ color:var(--review); background:var(--review-bg) }
.ml-count.info{ color:var(--info); background:var(--info-bg) }
.ml-state{ margin-top:24px; padding:34px 22px; text-align:center; color:var(--muted); font-size:14.5px; background:#fff; border:1px dashed var(--border); border-radius:16px }
.ml-empty{ color:var(--faint) }
.ml-list{ margin-top:22px; display:flex; flex-direction:column; gap:14px }
.ml-card{ background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px; box-shadow:0 12px 30px -22px rgba(15,23,42,.25) }
.ml-chead{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px }
.ml-item{ font-size:16.5px; font-weight:800; letter-spacing:-.01em }
.ml-meta{ font-size:12.5px; color:var(--faint); margin-top:3px }
.ml-amt{ font-size:19px; font-weight:800; letter-spacing:-.02em; white-space:nowrap; font-variant-numeric:tabular-nums }
.ml-flags{ list-style:none; margin:14px 0 0; padding:0; display:flex; flex-direction:column; gap:9px }
.ml-flag{ display:flex; gap:11px; align-items:flex-start }
.ml-sev{ flex-shrink:0; font-size:10.5px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; padding:3px 8px; border-radius:6px; margin-top:1px }
.ml-sev.report{ color:var(--report); background:var(--report-bg) }
.ml-sev.review{ color:var(--review); background:var(--review-bg) }
.ml-sev.info{ color:var(--info); background:var(--info-bg) }
.ml-flag-msg{ font-size:13.5px; color:var(--ink-2); line-height:1.5 }
`;
