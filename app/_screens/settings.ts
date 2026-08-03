// Settings — account + activity + selling links. Rebuilt light (v2).
// Hooks unchanged: data-nav rows, data-bind email, data-action signout.
const row = (nav: string, title: string, sub: string, icon: string, last = false) =>
  `<div class="navbtn" data-nav="${nav}" style="padding:15px 16px; display:flex; align-items:center; gap:13px;${last ? "" : " border-bottom:1px solid #EEF2F6;"}"><div style="width:38px; height:38px; border-radius:11px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;">${icon}</div><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:600; color:#0F172A;">${title}</div><div style="font-size:12.5px; color:#64748B; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub}</div></div><svg width="18" height="18" viewBox="0 0 24 24" stroke="#94A3B8" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg></div>`;

const ic = (p: string) => `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.8">${p}</svg>`;
const label = (t: string) => `<div style="margin:22px 20px 0; font-size:12px; font-weight:700; color:#64748B; letter-spacing:.04em;">${t}</div>`;
const groupOpen = `<div style="margin:12px 20px 0; border-radius:18px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); overflow:hidden;">`;

export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:28px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">Settings</h2></div>
          ${label("ACCOUNT")}
          ${groupOpen}
            ${row("profile", "Profile", "Your name, verification &amp; payout", ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'))}
            <div style="padding:15px 16px; display:flex; align-items:center; gap:13px;"><div style="width:38px; height:38px; border-radius:11px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;">${ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>')}</div><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:600; color:#0F172A;">Email</div><div data-bind="email" style="font-size:12.5px; color:#64748B; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">—</div></div></div>
          </div>
          ${label("ACTIVITY")}
          ${groupOpen}
            ${row("history", "History", "All your escrows", ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/>'))}
            ${row("notifications", "Notifications", "Activity on your deals", ic('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'), true)}
          </div>
          ${label("SELLING")}
          ${groupOpen}
            ${row("selling", "Sell on TrustFlow", "Verify &amp; manage your sales", '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg>', true)}
          </div>
          <div class="navbtn" data-action="signout" style="margin:24px 20px 0; height:52px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:15px; color:#DC2626;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Sign out</div>
        </div>`;
