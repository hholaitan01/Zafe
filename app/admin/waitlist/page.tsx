"use client";

/* Waitlist admin — read the pre-launch sign-ups. Admin-only: the API gates on
   isAdmin() (open in demo mode, ADMIN_EMAILS in live), and a non-admin just sees
   a not-authorized state. Read-only: view the list, or download it as CSV. */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { WaitlistRow } from "@/lib/waitlist/store";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminWaitlistPage() {
  const [rows, setRows] = useState<WaitlistRow[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const res = await fetch("/api/admin/waitlist");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { entries: WaitlistRow[] };
      setRows(data.entries);
    } catch {
      setError(true);
      setRows([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="ad">
      <style>{css}</style>
      <header className="ad-top">
        <div className="ad-wrap ad-toprow">
          <Link href="/dashboard" className="ad-brand">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8.5 10.5H23.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" /><path d="M8.5 21.5H23.5" stroke="#059669" strokeWidth="4.2" strokeLinecap="round" /><path d="M23.5 10.5L8.5 21.5" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" /></svg>
            <span>Zafe</span>
          </Link>
          <span className="ad-role">Waitlist</span>
        </div>
      </header>

      <div className="ad-wrap ad-body">
        <div className="ad-headrow">
          <div>
            <h1 className="ad-title">Waitlist sign-ups</h1>
            <p className="ad-sub">Everyone who has asked for early access, newest first.{rows && rows.length > 0 ? ` ${rows.length} total.` : ""}</p>
          </div>
          {rows && rows.length > 0 && (
            <a className="ad-csv" href="/api/admin/waitlist?format=csv" download>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
              Download CSV
            </a>
          )}
        </div>

        {rows == null ? (
          <div className="ad-state">Loading sign-ups…</div>
        ) : error ? (
          <div className="ad-state">Couldn&apos;t load the list. You may not have admin access, or there was a network error.</div>
        ) : rows.length === 0 ? (
          <div className="ad-state ad-empty">No sign-ups yet. They will appear here as people join.</div>
        ) : (
          <div className="ad-tablewrap">
            <table className="ad-table">
              <thead>
                <tr><th>Email</th><th>Name</th><th>Source</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.email}>
                    <td className="ad-email">{r.email}</td>
                    <td>{r.name || <span className="ad-dash">—</span>}</td>
                    <td>{r.source || <span className="ad-dash">—</span>}</td>
                    <td className="ad-when">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const css = `
.ad{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8; --bg:#F8FAFC;
  --card:#FFFFFF; --border:#E6EAF0; --safe:#059669; --safe-tint:#ECFDF5;
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  color:var(--ink); background:var(--bg); min-height:100dvh; -webkit-font-smoothing:antialiased; line-height:1.5 }
.ad *{ box-sizing:border-box }
.ad a{ text-decoration:none }
.ad-wrap{ width:100%; max-width:900px; margin:0 auto; padding:0 22px }
.ad-top{ position:sticky; top:0; z-index:10; background:rgba(248,250,252,.85); backdrop-filter:saturate(1.4) blur(12px); border-bottom:1px solid var(--border) }
.ad-toprow{ display:flex; align-items:center; justify-content:space-between; height:60px }
.ad-brand{ display:inline-flex; align-items:center; gap:9px; font-weight:700; font-size:16px; letter-spacing:-.02em; color:var(--ink) }
.ad-role{ font-size:12.5px; font-weight:600; color:var(--muted); letter-spacing:.02em }

.ad-body{ padding-top:28px; padding-bottom:80px }
.ad-headrow{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap }
.ad-title{ font-size:26px; font-weight:700; letter-spacing:-.02em }
.ad-sub{ margin-top:6px; font-size:14px; color:var(--muted); max-width:60ch }
.ad-csv{ display:inline-flex; align-items:center; gap:8px; height:42px; padding:0 15px; border-radius:11px; background:var(--ink); color:#fff; font-weight:600; font-size:14px; flex-shrink:0;
  transition:transform .12s var(--ease), background .18s var(--ease) }
.ad-csv:active{ transform:scale(.98) } .ad-csv:hover{ background:#06152A }

.ad-state{ margin-top:22px; padding:22px; border-radius:14px; background:var(--card); border:1px solid var(--border); color:var(--muted); font-size:14.5px }
.ad-empty{ text-align:center }

.ad-tablewrap{ margin-top:20px; background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 1px 2px rgba(15,23,42,.05) }
.ad-table{ width:100%; border-collapse:collapse; font-size:14px }
.ad-table th{ text-align:left; font-size:11.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); padding:12px 16px; background:#F8FAFC; border-bottom:1px solid var(--border) }
.ad-table td{ padding:13px 16px; border-bottom:1px solid var(--border-2, #EEF2F6) }
.ad-table tr:last-child td{ border-bottom:none }
.ad-table tbody tr:hover{ background:#FBFCFE }
.ad-email{ font-weight:600 }
.ad-when{ color:var(--muted); white-space:nowrap }
.ad-dash{ color:var(--faint) }
`;
