"use client";

/* ==========================================================================
   AppShell — the responsive frame for the in-app surfaces.

   • Desktop (>=1024px): a persistent 256px left SideNav + a 64px TopBar, with
     the page content in a max-1200px column. This is the Claude Design app
     structure, rebuilt in our navy/emerald light system (IBM Plex Sans).
   • Mobile (<1024px): the SideNav/TopBar collapse; a compact mobile top bar
     and a fixed bottom nav take over, and the content stacks.

   Pages render their content as children and pass `current` (active nav id)
   plus the signed-in `user`. Kit classes (.tf-*) are defined once here.
   ========================================================================== */

import Link from "next/link";
import type { ReactNode } from "react";

type NavId = "dashboard" | "new" | "activity" | "disputes" | "profile";

const NAV: { id: NavId; label: string; href: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
  { id: "new", label: "New transaction", href: "/new-escrow", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" strokeLinecap="round" /></> },
  { id: "activity", label: "Activity", href: "/history", icon: <><path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" /><circle cx="3.5" cy="6" r="1.3" /><circle cx="3.5" cy="12" r="1.3" /><circle cx="3.5" cy="18" r="1.3" /></> },
  { id: "disputes", label: "Disputes", href: "/dispute", icon: <><path d="M12 3v18M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0zM7 7h10" strokeLinecap="round" strokeLinejoin="round" /></> },
  { id: "profile", label: "Profile", href: "/profile", icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> },
];

function NavIcon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2.5 27 7v8.5c0 7-4.6 11.6-11 13.5-6.4-1.9-11-6.5-11-13.5V7z" fill="#0F172A" />
      <path d="M11 16.2 14.6 20 21.5 12.5" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface ShellUser {
  name: string;
  initials: string;
  photo?: string;
  score?: number | string;
}

export default function AppShell({
  current,
  user,
  children,
}: {
  current: NavId;
  user: ShellUser;
  children: ReactNode;
}) {
  const avatarStyle = user.photo
    ? { backgroundImage: `url("${user.photo}")`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <div className="tf-app">
      <style>{kit}</style>

      {/* ---- Desktop side nav ---- */}
      <aside className="tf-side">
        <Link href="/dashboard" className="tf-side-brand"><Mark /><span>TrustFlow</span></Link>
        <div className="tf-side-group">
          <div className="tf-side-label">Workspace</div>
          {NAV.map((n) => (
            <Link key={n.id} href={n.href} className={`tf-side-item${current === n.id ? " is-active" : ""}`}>
              <NavIcon>{n.icon}</NavIcon>
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
        <div className="tf-side-demo">
          <div className="tf-eyebrow">Demo</div>
          <p>Sandbox mode. No real money moves until live keys are set.</p>
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="tf-main">
        {/* Desktop top bar */}
        <header className="tf-topbar">
          <div className="tf-search"><NavIcon size={16}><><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></></NavIcon><span>Search transactions, sellers, refs</span></div>
          <div className="tf-topbar-right">
            <Link href="/notifications" className="tf-icon-btn" aria-label="Notifications"><NavIcon size={18}><><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></></NavIcon></Link>
            <div className="tf-topbar-meta"><div className="tf-topbar-name">{user.name}</div>{user.score != null && <div className="tf-topbar-role">Trust Score · {user.score}/100</div>}</div>
            <div className="tf-avatar" style={avatarStyle}>{user.photo ? "" : user.initials}</div>
          </div>
        </header>

        {/* Mobile top bar */}
        <header className="tf-mtop">
          <div className="tf-mtop-user">
            <Link href="/profile" className="tf-avatar tf-avatar-sm" style={avatarStyle}>{user.photo ? "" : user.initials}</Link>
            <div><div className="tf-mtop-hi">Welcome,</div><div className="tf-mtop-name">{user.name}</div></div>
          </div>
          <div className="tf-mtop-actions">
            <Link href="/notifications" className="tf-icon-btn" aria-label="Notifications"><NavIcon size={18}><><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></></NavIcon></Link>
            <Link href="/settings" className="tf-icon-btn" aria-label="Settings"><NavIcon size={18}><><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.42l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.4 9.6L6.34 9.54A2 2 0 1 1 9.17 6.7l.06.06A1.65 1.65 0 0 0 12 5.6V4.5a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 19.42 9l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 15z" /></></NavIcon></Link>
          </div>
        </header>

        <main className="tf-content">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="tf-bottom" aria-label="Primary">
          <Link href="/dashboard" className={`tf-bnav${current === "dashboard" ? " is-active" : ""}`}><NavIcon size={22}><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></NavIcon><span>Home</span></Link>
          <Link href="/history" className={`tf-bnav${current === "activity" ? " is-active" : ""}`}><NavIcon size={22}><><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.3" /><circle cx="3.5" cy="12" r="1.3" /><circle cx="3.5" cy="18" r="1.3" /></></NavIcon><span>Activity</span></Link>
          <Link href="/new-escrow" className="tf-bnav-orb" aria-label="New transaction"><NavIcon size={24}><path d="M12 5v14M5 12h14" /></NavIcon></Link>
          <Link href="/dispute" className={`tf-bnav${current === "disputes" ? " is-active" : ""}`}><NavIcon size={22}><path d="M12 3v18M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0zM7 7h10" /></NavIcon><span>Disputes</span></Link>
          <Link href="/profile" className={`tf-bnav${current === "profile" ? " is-active" : ""}`}><NavIcon size={22}><><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></></NavIcon><span>Profile</span></Link>
        </nav>
      </div>
    </div>
  );
}

const kit = `
.tf-app{ --ink:#0F172A; --ink-2:#334155; --muted:#64748B; --faint:#94A3B8;
  --bg:#F8FAFC; --card:#FFFFFF; --line:#E6EAF0; --line-2:#EEF2F6;
  --safe:#059669; --safe-2:#10B981; --safe-tint:#ECFDF5; --gold:#A16207; --danger:#DC2626;
  --sh-1:0 1px 2px rgba(15,23,42,.05); --sh-2:0 12px 30px -14px rgba(15,23,42,.18);
  --ease:cubic-bezier(.22,1,.36,1);
  font-family:var(--font,'IBM Plex Sans',system-ui,sans-serif); color:var(--ink); background:var(--bg);
  min-height:100dvh; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
  font-optical-sizing:auto; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
.tf-app *{ box-sizing:border-box }
.tf-app a{ text-decoration:none; color:inherit }

/* mono for numeric refs */
.tf-mono{ font-family:ui-monospace,'SF Mono',Menlo,monospace; font-variant-numeric:tabular-nums }

/* ---- desktop shell ---- */
.tf-side{ display:none }
.tf-topbar{ display:none }
.tf-main{ min-height:100dvh; display:flex; flex-direction:column }
.tf-content{ flex:1; padding:20px 20px 108px; width:100%; max-width:640px; margin:0 auto; animation:tfContentIn .28s var(--ease) both }
@keyframes tfContentIn{ from{ opacity:0; transform:translateY(6px) } to{ opacity:1; transform:none } }

.tf-avatar{ width:40px; height:40px; border-radius:50%; background:#0F172A; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; overflow:hidden; flex-shrink:0 }
.tf-avatar-sm{ width:42px; height:42px }
.tf-icon-btn{ width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); display:flex; align-items:center; justify-content:center; color:var(--ink-2);
  transition:transform .14s var(--ease), border-color .18s var(--ease) }
.tf-icon-btn:active{ transform:scale(.92) }
@media (hover:hover) and (pointer:fine){ .tf-icon-btn:hover{ border-color:#CBD5E1 } }
.tf-eyebrow{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--faint) }

/* ---- mobile top bar ---- */
/* A translucent floating layer: content scrolls under it and blurs through,
   rather than an opaque strip that eats a fixed band of the screen (§materials). */
.tf-mtop{ position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; padding:14px 20px 10px;
  background:rgba(248,250,252,.72); backdrop-filter:blur(18px) saturate(180%); -webkit-backdrop-filter:blur(18px) saturate(180%) }
.tf-mtop-user{ display:flex; align-items:center; gap:12px; min-width:0 }
.tf-mtop-hi{ font-size:12.5px; color:var(--muted); font-weight:500 }
.tf-mtop-name{ font-size:16.5px; font-weight:700; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.tf-mtop-actions{ display:flex; gap:10px; flex-shrink:0 }

/* ---- mobile bottom nav ---- */
.tf-bottom{ position:fixed; left:0; right:0; bottom:0; z-index:30; max-width:520px; margin:0 auto; height:76px;
  background:linear-gradient(180deg,rgba(248,250,252,0),#F8FAFC 38%);
  backdrop-filter:blur(16px) saturate(160%); -webkit-backdrop-filter:blur(16px) saturate(160%);
  display:flex; align-items:center; justify-content:space-around; padding:0 14px 12px; }
.tf-bnav{ display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--faint); font-size:10px; font-weight:500; padding:6px 8px;
  transition:color .2s var(--ease), transform .18s var(--ease) }
.tf-bnav svg{ transition:transform .24s var(--ease) }
.tf-bnav:active{ transform:scale(.9) }
.tf-bnav.is-active{ color:var(--ink) }
.tf-bnav.is-active svg{ transform:scale(1.08) }
.tf-bnav-orb{ width:56px; height:56px; border-radius:50%; background:var(--safe); color:#fff; display:flex; align-items:center; justify-content:center; box-shadow:0 14px 26px -10px rgba(5,150,105,.6); margin-top:-18px; border:3px solid #F8FAFC;
  transition:transform .2s var(--ease), box-shadow .2s var(--ease) }
.tf-bnav-orb:active{ transform:scale(.9); box-shadow:0 8px 18px -10px rgba(5,150,105,.7) }

/* ---- shared content atoms ---- */
.tf-card{ background:var(--card); border:1px solid var(--line); border-radius:18px; box-shadow:var(--sh-1) }
.tf-pill{ display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.04em; white-space:nowrap }
.tf-pill .dot{ width:6px; height:6px; border-radius:50% }
.tf-btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; height:44px; padding:0 18px; border-radius:12px; font-family:inherit; font-weight:600; font-size:14.5px; cursor:pointer; border:1px solid transparent; transition:transform .12s var(--ease), background .18s var(--ease), border-color .18s var(--ease) }
.tf-btn:active{ transform:scale(.98) }
.tf-btn--primary{ background:var(--ink); color:#fff }
.tf-btn--primary:hover{ background:#06152A }
.tf-btn--verify{ background:var(--safe); color:#fff }
.tf-btn--verify:hover{ background:#047857 }
.tf-btn--secondary{ background:#fff; color:var(--ink); border-color:var(--line); box-shadow:var(--sh-1) }
.tf-btn--secondary:hover{ border-color:#CBD5E1 }
.tf-ph-head{ display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:20px }
.tf-ph-head h1{ margin:6px 0 0; font-size:26px; font-weight:700; letter-spacing:-.02em }

@media (min-width:1024px){
  .tf-app{ display:grid; grid-template-columns:256px 1fr }
  .tf-mtop, .tf-bottom{ display:none }
  .tf-side{ display:flex; flex-direction:column; gap:24px; width:256px; height:100vh; position:sticky; top:0;
    background:#fff; border-right:1px solid var(--line); padding:22px 16px }
  .tf-side-brand{ display:flex; align-items:center; gap:10px; padding:0 8px 4px; font-size:20px; font-weight:700; letter-spacing:-.01em }
  .tf-side-group{ display:flex; flex-direction:column; gap:2px }
  .tf-side-label{ padding:0 10px 6px; font-size:11px; font-weight:600; color:var(--faint); letter-spacing:.10em; text-transform:uppercase }
  .tf-side-item{ display:flex; align-items:center; gap:11px; padding:10px; border-radius:10px; color:var(--muted); font-size:14px; font-weight:500; border:1px solid transparent; transition:background .18s var(--ease), transform .12s var(--ease) }
  .tf-side-item:hover{ background:var(--bg) }
  .tf-side-item:active{ transform:scale(.98) }
  .tf-side-item.is-active{ background:var(--bg); color:var(--ink); border-color:var(--line); box-shadow:var(--sh-1); font-weight:600 }
  .tf-side-demo{ margin-top:auto; background:var(--bg); border:1px solid var(--line); border-radius:14px; padding:14px }
  .tf-side-demo p{ font-size:12.5px; line-height:1.45; color:var(--muted); margin:6px 0 0 }
  .tf-topbar{ display:flex; align-items:center; justify-content:space-between; height:64px; padding:0 32px; position:sticky; top:0; z-index:10;
    background:rgba(248,250,252,.72); backdrop-filter:blur(18px) saturate(180%); -webkit-backdrop-filter:blur(18px) saturate(180%); border-bottom:1px solid rgba(230,234,240,.7) }
  .tf-search{ display:flex; align-items:center; gap:8px; width:340px; padding:9px 14px; border-radius:999px; background:#fff; border:1px solid var(--line); color:var(--faint); font-size:13px }
  .tf-topbar-right{ display:flex; align-items:center; gap:14px }
  .tf-topbar-meta{ text-align:right; line-height:1.2 }
  .tf-topbar-name{ font-size:13px; font-weight:600 }
  .tf-topbar-role{ font-size:11px; color:var(--faint) }
  .tf-content{ padding:30px 44px 60px; max-width:1180px; margin:0 }
  .tf-ph-head h1{ font-size:30px }
}

/* Motion off: keep the layout, drop the movement (§reduced motion). */
@media (prefers-reduced-motion:reduce){
  .tf-content{ animation:none }
  .tf-btn, .tf-icon-btn, .tf-bnav, .tf-bnav svg, .tf-bnav-orb, .tf-side-item{ transition:none }
}
/* Transparency off: the floating chrome goes solid so text never fights a blur. */
@media (prefers-reduced-transparency:reduce){
  .tf-mtop, .tf-topbar{ background:var(--bg); backdrop-filter:none; -webkit-backdrop-filter:none }
  .tf-bottom{ backdrop-filter:none; -webkit-backdrop-filter:none }
}
/* More contrast: firm up the soft borders that carry structure. */
@media (prefers-contrast:more){
  .tf-card{ border-color:#CBD5E1 }
  .tf-topbar{ border-bottom-color:var(--line) }
  .tf-side-item.is-active{ border-color:#94A3B8 }
}
`;
