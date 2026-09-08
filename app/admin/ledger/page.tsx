"use client";

/* Reconciliation view — the money at a glance from Zafe's own double-entry
   ledger: what is held in escrow, what has moved, what Zafe earned, and whether
   the books balance. Read-only decision support. Admin-only (the API gates on
   isAdmin). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { naira } from "@/lib/client";
import type { LedgerEntry } from "@/lib/ledger/types";

interface Summary {
  balanced: boolean;
  escrowHeld: number;
  funded: number;
  paidOut: number;
  refunded: number;
  revenue: number;
  entryCount: number;
}

interface Exception {
  key: string;
  dealId: string;
  kind: "payout" | "refund";
  state: "pending" | "succeeded" | "failed";
  error?: string;
  attempts: number;
  updatedAt: string;
}

interface Discrepancy {
  dealId: string;
  status: string;
  code: string;
  detail: string;
}

const KIND: Record<string, string> = { fund: "Funded", payout: "Payout", refund: "Refund" };

/** A short, human age like "3m" / "2h" / "1d" for how long an exception has sat. */
function ageOf(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** The escrow movement for a row: +in on funding, −out on payout/refund. */
function escrowDelta(entry: LedgerEntry): number {
  return entry.legs.filter((l) => l.account === "escrow").reduce((s, l) => s + l.amount, 0);
}

export default function LedgerPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryMsg, setRetryMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/ledger");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { summary: Summary; entries: LedgerEntry[]; exceptions?: Exception[]; discrepancies?: Discrepancy[] };
      setSummary(data.summary);
      setEntries(data.entries);
      setExceptions(data.exceptions ?? []);
      setDiscrepancies(data.discrepancies ?? []);
    } catch {
      setError(true);
      setEntries([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const retry = useCallback(async (key: string) => {
    setRetrying(key);
    setRetryMsg((m) => ({ ...m, [key]: "" }));
    try {
      const res = await fetch("/api/admin/ledger/retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setRetryMsg((m) => ({ ...m, [key]: "Re-driven. Reloading…" }));
        await load();
      } else {
        setRetryMsg((m) => ({ ...m, [key]: data.error || "Could not re-drive this move." }));
      }
    } catch {
      setRetryMsg((m) => ({ ...m, [key]: "Network error. Try again." }));
    } finally {
      setRetrying(null);
    }
  }, [load]);

  return (
    <main className="lg">
      <style>{css}</style>
      <header className="lg-top">
        <div className="lg-wrap lg-toprow">
          <Link href="/dashboard" className="lg-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8.5 10.5H23.5" stroke="#059669" stroke-width="4.2" stroke-linecap="round"/><path d="M8.5 21.5H23.5" stroke="#059669" stroke-width="4.2" stroke-linecap="round"/><path d="M23.5 10.5L8.5 21.5" stroke="#0F172A" stroke-width="4.2" stroke-linecap="round"/></svg>
            <span>Zafe</span>
          </Link>
          <span className="lg-role">Reconciliation</span>
        </div>
      </header>

      <div className="lg-wrap lg-body">
        <div className="lg-eyebrow">Internal ledger</div>
        <h1 className="lg-title">The money, reconciled</h1>
        <p className="lg-sub">Derived from Zafe&apos;s own double-entry record of every move, independent of the payment provider. Escrow held should match the funds sitting in the provider pool.</p>

        {summary && (
          <div className="lg-status">
            {summary.balanced
              ? <span className="lg-ok">Books balance. All accounts sum to zero across {summary.entryCount} {summary.entryCount === 1 ? "entry" : "entries"}.</span>
              : <span className="lg-bad">Books do not balance. Investigate before trusting the totals below.</span>}
          </div>
        )}

        {summary && (
          <div className="lg-tiles">
            <div className="lg-tile lg-held">
              <div className="lg-tlabel">Escrow held</div>
              <div className="lg-tval">{naira(summary.escrowHeld)}</div>
            </div>
            <div className="lg-tile">
              <div className="lg-tlabel">Funded in</div>
              <div className="lg-tval">{naira(summary.funded)}</div>
            </div>
            <div className="lg-tile">
              <div className="lg-tlabel">Paid to sellers</div>
              <div className="lg-tval">{naira(summary.paidOut)}</div>
            </div>
            <div className="lg-tile">
              <div className="lg-tlabel">Refunded</div>
              <div className="lg-tval">{naira(summary.refunded)}</div>
            </div>
            <div className="lg-tile">
              <div className="lg-tlabel">Revenue</div>
              <div className="lg-tval">{naira(summary.revenue)}</div>
            </div>
          </div>
        )}

        {(exceptions.length > 0 || discrepancies.length > 0) && (
          <section className="lg-attn">
            <h2 className="lg-h2 lg-h2-attn">Needs attention</h2>

            {exceptions.length > 0 && (
              <>
                <div className="lg-attn-label">Settlement exceptions — a money-move that failed or is stuck</div>
                <div className="lg-list">
                  {exceptions.map((x) => (
                    <div className="lg-xrow" key={x.key}>
                      <div className="lg-rmain">
                        <span className={`lg-kind lg-${x.kind}`}>{KIND[x.kind] ?? x.kind}</span>
                        <span className="lg-memo">
                          {x.state === "failed" ? "Failed" : "Stuck (pending)"} · {x.attempts} attempt{x.attempts === 1 ? "" : "s"} · {ageOf(x.updatedAt)}
                          {x.error ? ` · ${x.error}` : ""}
                        </span>
                      </div>
                      <div className="lg-rside">
                        <button className="lg-retry" onClick={() => void retry(x.key)} disabled={retrying === x.key}>
                          {retrying === x.key ? "Re-driving…" : "Retry"}
                        </button>
                      </div>
                      {retryMsg[x.key] && <div className="lg-xmsg">{retryMsg[x.key]}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {discrepancies.length > 0 && (
              <>
                <div className="lg-attn-label">Ledger discrepancies — a deal and the ledger disagree</div>
                <div className="lg-list">
                  {discrepancies.map((d, i) => (
                    <div className="lg-xrow" key={`${d.dealId}-${d.code}-${i}`}>
                      <div className="lg-rmain">
                        <span className="lg-kind lg-warn">{d.status}</span>
                        <span className="lg-memo">{d.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        <h2 className="lg-h2">Recent entries</h2>
        {entries == null ? (
          <div className="lg-state">Loading the ledger…</div>
        ) : error ? (
          <div className="lg-state">Couldn&apos;t load the ledger. You may not have reviewer access, or there was a network error.</div>
        ) : entries.length === 0 ? (
          <div className="lg-state lg-empty">No entries yet. They appear as deals are funded, paid out, and refunded.</div>
        ) : (
          <div className="lg-list">
            {entries.map((e) => {
              const delta = escrowDelta(e);
              return (
                <div className="lg-row" key={e.ref}>
                  <div className="lg-rmain">
                    <span className={`lg-kind lg-${e.kind}`}>{KIND[e.kind] ?? e.kind}</span>
                    <span className="lg-memo">{e.memo || e.ref}</span>
                  </div>
                  <div className="lg-rside">
                    <span className={`lg-amt ${delta < 0 ? "out" : "in"}`}>{delta < 0 ? "−" : "+"}{naira(Math.abs(delta))}</span>
                    <span className="lg-when">{new Date(e.createdAt).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const css = `
.lg{ --ground:#F8FAFC; --surface:#FFFFFF; --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8;
  --border:#E6EAF0; --safe:#059669; --safe-bg:#ECFDF5; --bad:#B91C1C; --bad-bg:#FEE2E2;
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; color:var(--ink); background:var(--ground);
  min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5 }
.lg *{ box-sizing:border-box } .lg a{ text-decoration:none }
.lg-wrap{ width:100%; max-width:840px; margin:0 auto; padding:0 22px }
.lg-top{ position:sticky; top:0; z-index:10; background:rgba(248,250,252,.85); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border) }
.lg-toprow{ display:flex; align-items:center; justify-content:space-between; height:60px }
.lg-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:16px; letter-spacing:-.02em; color:var(--ink) }
.lg-role{ font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--safe); background:var(--safe-bg); padding:5px 10px; border-radius:8px }
.lg-body{ padding:34px 22px 72px }
.lg-eyebrow{ font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--safe) }
.lg-title{ margin-top:8px; font-size:32px; font-weight:800; letter-spacing:-.03em }
.lg-sub{ margin-top:10px; font-size:15px; color:var(--muted); max-width:62ch; line-height:1.6 }
.lg-status{ margin-top:20px; font-size:13.5px; font-weight:600 }
.lg-ok{ color:var(--safe) } .lg-bad{ color:var(--bad) }
.lg-tiles{ margin-top:16px; display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px }
.lg-tile{ background:#fff; border:1px solid var(--border); border-radius:14px; padding:16px 18px }
.lg-held{ border-color:var(--safe); background:var(--safe-bg) }
.lg-tlabel{ font-size:12px; font-weight:600; color:var(--muted); letter-spacing:.01em }
.lg-tval{ margin-top:8px; font-size:22px; font-weight:800; letter-spacing:-.02em; font-variant-numeric:tabular-nums }
.lg-held .lg-tval{ color:var(--safe) }
.lg-h2{ margin-top:38px; font-size:15px; font-weight:700; letter-spacing:-.01em }
.lg-state{ margin-top:16px; padding:34px 22px; text-align:center; color:var(--muted); font-size:14.5px; background:#fff; border:1px dashed var(--border); border-radius:16px }
.lg-empty{ color:var(--faint) }
.lg-list{ margin-top:14px; display:flex; flex-direction:column; gap:8px }
.lg-row{ display:flex; align-items:center; justify-content:space-between; gap:14px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:13px 16px }
.lg-rmain{ display:flex; align-items:center; gap:11px; min-width:0 }
.lg-kind{ flex-shrink:0; font-size:10.5px; font-weight:700; letter-spacing:.03em; text-transform:uppercase; padding:3px 8px; border-radius:6px; color:var(--ink-2); background:#EEF2F6 }
.lg-fund{ color:var(--safe); background:var(--safe-bg) }
.lg-memo{ font-size:13.5px; color:var(--ink-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.lg-rside{ display:flex; align-items:center; gap:14px; flex-shrink:0 }
.lg-amt{ font-size:15px; font-weight:800; letter-spacing:-.01em; font-variant-numeric:tabular-nums }
.lg-amt.in{ color:var(--safe) } .lg-amt.out{ color:var(--ink) }
.lg-when{ font-size:12px; color:var(--faint); min-width:52px; text-align:right }
.lg-attn{ margin-top:38px }
.lg-h2-attn{ margin-top:0; color:var(--bad) }
.lg-attn-label{ margin-top:16px; font-size:12.5px; font-weight:600; color:var(--muted) }
.lg-xrow{ display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap; background:var(--bad-bg); border:1px solid #F5C2C2; border-radius:12px; padding:13px 16px }
.lg-warn{ color:var(--bad); background:#fff }
.lg-retry{ flex-shrink:0; font-family:inherit; font-size:12.5px; font-weight:700; color:#fff; background:var(--ink); border:none; border-radius:9px; padding:8px 14px; cursor:pointer; transition:transform .18s cubic-bezier(.22,1,.36,1),opacity .18s ease }
.lg-retry:hover:not(:disabled){ transform:translateY(-1px) }
.lg-retry:active:not(:disabled){ transform:scale(.98) }
.lg-retry:disabled{ opacity:.55; cursor:default }
.lg-xmsg{ flex-basis:100%; font-size:12.5px; color:var(--ink-2); margin-top:2px }
`;
