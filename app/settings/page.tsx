"use client";

/* Settings — account + activity + selling shortcuts, and sign out. Now inside
   the responsive app shell. Sign-out clears the session and all client storage
   (see lib/auth). */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser, signOut } from "@/lib/auth";

const Icon = ({ d }: { d: string }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const Chevron = () => <svg className="st-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>;

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("—");
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");

  useEffect(() => {
    let alive = true;
    getCurrentUser().then((u) => {
      if (!alive) return;
      const em = u?.email || "";
      const nm = u?.name || (em ? em.split("@")[0] : "You");
      setEmail(em || "Not signed in");
      setName(nm);
      setInitials(nm.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?");
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  async function doSignout() {
    try { await signOut(); } catch { /* proceed regardless */ }
    router.push("/login");
  }

  return (
    <AppShell current="profile" user={{ name: name || "You", initials }}>
      <style>{css}</style>

      <div className="tf-ph-head st-head">
        <div><div className="tf-eyebrow">Account</div><h1>Settings</h1></div>
      </div>

      <div className="st-wrap">
        <div className="st-group-label">Account</div>
        <div className="tf-card st-group">
          <Link href="/profile" className="st-row">
            <span className="st-ic"><Icon d='<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' /></span>
            <span className="st-main"><span className="st-title">Profile</span><span className="st-sub">Your name, verification & payout</span></span>
            <Chevron />
          </Link>
          <div className="st-row st-row-static">
            <span className="st-ic"><Icon d='<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>' /></span>
            <span className="st-main"><span className="st-title">Email</span><span className="st-sub">{email}</span></span>
          </div>
        </div>

        <div className="st-group-label">Activity</div>
        <div className="tf-card st-group">
          <Link href="/history" className="st-row">
            <span className="st-ic"><Icon d='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' /></span>
            <span className="st-main"><span className="st-title">History</span><span className="st-sub">All your escrows</span></span>
            <Chevron />
          </Link>
          <Link href="/notifications" className="st-row">
            <span className="st-ic"><Icon d='<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>' /></span>
            <span className="st-main"><span className="st-title">Notifications</span><span className="st-sub">Activity on your deals</span></span>
            <Chevron />
          </Link>
        </div>

        <div className="st-group-label">Selling</div>
        <div className="tf-card st-group">
          <Link href="/selling" className="st-row">
            <span className="st-ic st-ic-safe"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" /></svg></span>
            <span className="st-main"><span className="st-title">Sell on Zafe</span><span className="st-sub">Verify & manage your sales</span></span>
            <Chevron />
          </Link>
        </div>

        <button className="tf-btn st-signout" onClick={() => void doSignout()}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Sign out
        </button>
      </div>
    </AppShell>
  );
}

const css = `
.st-head{ display:none }
.st-wrap{ max-width:560px }
.st-group-label{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--faint); margin:20px 0 10px }
.st-group{ overflow:hidden }
.st-row{ display:flex; align-items:center; gap:13px; padding:15px 16px; border-bottom:1px solid var(--line-2); color:inherit }
.st-group .st-row:last-child{ border-bottom:none }
.st-row:not(.st-row-static){ cursor:pointer; transition:background .16s var(--ease) }
.st-row:not(.st-row-static):hover{ background:var(--bg) }
.st-ic{ width:38px; height:38px; border-radius:11px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.st-ic-safe{ background:var(--safe-tint) }
.st-main{ flex:1; min-width:0; display:flex; flex-direction:column }
.st-title{ font-size:14px; font-weight:600 }
.st-sub{ font-size:12.5px; color:var(--muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.st-chev{ flex-shrink:0 }
.st-signout{ margin-top:24px; width:100%; max-width:320px; height:52px; border-radius:14px; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); color:var(--danger); gap:8px; font-size:15px }
.st-signout:hover{ border-color:#FCA5A5 }
@media (min-width:1024px){ .st-head{ display:flex } }
`;
