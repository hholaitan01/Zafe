"use client";

/* Admin audit log — the trail of privileged actions: who resolved a dispute,
   re-drove a money-move, or deactivated an account, and when. Read-only.
   Admin-only (the API gates on the audit.read capability). */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface AuditEntry {
  id: string;
  at: string;
  actorEmail: string;
  actorRole?: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
}

const ACTION_LABEL: Record<string, string> = {
  "dispute.resolve": "Dispute resolved",
  "settlement.retry": "Money-move re-driven",
  "account.deactivate": "Account deactivated",
};

/** A compact one-line summary of an entry's action-specific detail. */
function metaSummary(e: AuditEntry): string {
  const m = e.meta ?? {};
  if (e.action === "dispute.resolve") {
    const d = String(m.decision ?? "");
    const pct = typeof m.splitBuyerPercent === "number" ? ` (${m.splitBuyerPercent}% to buyer)` : "";
    return d ? `${d}${pct}` : "";
  }
  if (e.action === "settlement.retry") {
    return [m.kind, m.newStatus].filter(Boolean).join(" → ");
  }
  return "";
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/audit");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { entries: AuditEntry[] };
      setEntries(data.entries);
    } catch {
      setError(true);
      setEntries([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="au">
      <style>{css}</style>
      <header className="au-top">
        <div className="au-wrap au-toprow">
          <Link href="/dashboard" className="au-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8.5 10.5H23.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round"/><path d="M8.5 21.5H23.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round"/><path d="M23.5 10.5L8.5 21.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round"/></svg>
            <span>Zafe</span>
          </Link>
          <span className="au-role">Audit log</span>
        </div>
      </header>

      <div className="au-wrap au-body">
        <div className="au-eyebrow">Accountability</div>
        <h1 className="au-title">Every privileged action, on the record</h1>
        <p className="au-sub">Who resolved a dispute, re-drove a stuck money-move, or deactivated an account. Append-only, newest first.</p>

        {entries == null ? (
          <div className="au-state">Loading the log…</div>
        ) : error ? (
          <div className="au-state">Couldn&apos;t load the audit log. You may not have access, or there was a network error.</div>
        ) : entries.length === 0 ? (
          <div className="au-state au-empty">No actions recorded yet. Entries appear as reviewers resolve disputes and re-drive money-moves.</div>
        ) : (
          <div className="au-list">
            {entries.map((e) => {
              const summary = metaSummary(e);
              return (
                <div className="au-row" key={e.id}>
                  <div className="au-rmain">
                    <span className="au-action">{ACTION_LABEL[e.action] ?? e.action}</span>
                    <span className="au-detail">
                      {e.actorEmail}{e.actorRole ? ` · ${e.actorRole}` : ""}
                      {e.target ? ` · ${e.target}` : ""}
                      {summary ? ` · ${summary}` : ""}
                    </span>
                  </div>
                  <span className="au-when">{new Date(e.at).toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
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
.au{ --ground:#F8FAFC; --surface:#FFFFFF; --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8;
  --border:#E6EAF0; --safe:#059669; --safe-bg:#ECFDF5;
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; color:var(--ink); background:var(--ground);
  min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5 }
.au *{ box-sizing:border-box } .au a{ text-decoration:none }
.au-wrap{ width:100%; max-width:840px; margin:0 auto; padding:0 22px }
.au-top{ position:sticky; top:0; z-index:10; background:rgba(248,250,252,.85); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border) }
.au-toprow{ display:flex; align-items:center; justify-content:space-between; height:60px }
.au-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:16px; letter-spacing:-.02em; color:var(--ink) }
.au-role{ font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--safe); background:var(--safe-bg); padding:5px 10px; border-radius:8px }
.au-body{ padding:34px 22px 72px }
.au-eyebrow{ font-size:12px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--safe) }
.au-title{ margin-top:8px; font-size:32px; font-weight:800; letter-spacing:-.03em }
.au-sub{ margin-top:10px; font-size:15px; color:var(--muted); max-width:62ch; line-height:1.6 }
.au-state{ margin-top:24px; padding:34px 22px; text-align:center; color:var(--muted); font-size:14.5px; background:#fff; border:1px dashed var(--border); border-radius:16px }
.au-empty{ color:var(--faint) }
.au-list{ margin-top:24px; display:flex; flex-direction:column; gap:8px }
.au-row{ display:flex; align-items:center; justify-content:space-between; gap:14px; background:#fff; border:1px solid var(--border); border-radius:12px; padding:13px 16px }
.au-rmain{ display:flex; flex-direction:column; gap:3px; min-width:0 }
.au-action{ font-size:14px; font-weight:700; letter-spacing:-.01em }
.au-detail{ font-size:12.5px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.au-when{ flex-shrink:0; font-size:12px; color:var(--faint); text-align:right; font-variant-numeric:tabular-nums }
`;
