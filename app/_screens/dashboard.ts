// Dashboard — rebuilt in the v2 "trust fintech" language (light, navy ink,
// emerald "safe" accents, IBM Plex Sans). Wiring hooks (data-nav / data-action /
// data-bind / data-html / data-photo / .ring / .score-num) are unchanged, so
// dashboard/page.tsx keeps working.
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:110px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <!-- top bar -->
          <div style="padding:8px 20px 0; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;"><div data-photo="photo" data-bind="initials" style="width:44px; height:44px; border-radius:50%; background:#0F172A; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; color:#fff; overflow:hidden;"></div><div><div data-bind="greeting" style="font-size:12.5px; color:#64748B; font-weight:500;">Welcome,</div><div data-bind="name" style="font-size:17px; font-weight:700; letter-spacing:-.01em; color:#0F172A;">&nbsp;</div></div></div>
            <div style="display:flex; gap:10px;"><div class="navbtn" data-nav="notifications" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div><div class="navbtn" data-nav="settings" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.42l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.4 9.6L6.34 9.54A2 2 0 1 1 9.17 6.7l.06.06A1.65 1.65 0 0 0 12 5.6V4.5a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 19.42 9l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 15z"/></svg></div></div>
          </div>
          <!-- trust score hero -->
          <div style="margin:20px 20px 0; border-radius:22px; padding:22px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05), 0 18px 40px -22px rgba(15,23,42,.18); position:relative;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div>
                <div style="font-size:12.5px; color:#64748B; font-weight:600; letter-spacing:.02em;">TRUST SCORE</div>
                <div style="display:flex; align-items:flex-end; gap:7px; margin-top:8px;"><span class="score-num" style="font-size:52px; font-weight:700; letter-spacing:-.04em; line-height:1; color:#0F172A;">—</span><span style="font-size:15px; color:#94A3B8; margin-bottom:9px;">/ 100</span></div>
                <div style="margin-top:12px; display:inline-flex; align-items:center; gap:7px; padding:6px 12px; border-radius:999px; background:#ECFDF5; border:1px solid #C7F0DE; color:#059669; font-size:12.5px; font-weight:600;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2"><path d="M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg><span data-bind="repLabel">Loading…</span></div>
              </div>
              <div style="position:relative; width:96px; height:96px;">
                <div class="ring" style="position:absolute; inset:0; border-radius:50%; background:conic-gradient(#10B981 calc(var(--p)*3.6deg), #E6EAF0 0);"></div>
                <div style="position:absolute; inset:9px; border-radius:50%; background:#fff; box-shadow:inset 0 1px 4px rgba(15,23,42,.06);"></div>
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 3 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" fill="rgba(16,185,129,.12)" stroke="#059669" stroke-width="1.5"/><path d="M15.5 9.5 10.8 14.5 8.5 12.2" stroke="#059669" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
              </div>
            </div>
          </div>
          <!-- primary actions -->
          <div style="margin:14px 20px 0; display:flex; gap:12px;">
            <div class="navbtn" data-nav="new-escrow" style="flex:1; height:60px; border-radius:16px; background:#0F172A; display:flex; align-items:center; gap:11px; padding:0 16px; font-weight:600; font-size:15px; color:#fff; box-shadow:0 12px 24px -12px rgba(15,23,42,.5);"><div style="width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>New Escrow</div>
            <div class="navbtn" data-nav="history" style="flex:1; height:60px; border-radius:16px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; gap:11px; padding:0 16px; font-weight:600; font-size:15px; color:#0F172A;"><div style="width:34px; height:34px; border-radius:10px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#334155" stroke-width="1.9" fill="none"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg></div>History</div>
          </div>
          <!-- reputation summary -->
          <div style="margin:14px 20px 0; border-radius:16px; padding:15px 16px; background:#ECFDF5; border:1px solid #C7F0DE; display:flex; align-items:flex-start; gap:11px;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" style="flex-shrink:0; margin-top:1px;"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg><div data-bind="repSummary" style="font-size:12.5px; color:#065F46; line-height:1.5;">Every safe deal you complete raises your score. Trusted traders get priority dispute reviews.</div></div>
          <!-- active escrows -->
          <div style="margin:24px 20px 0; display:flex; align-items:center; justify-content:space-between;"><span style="font-size:16px; font-weight:700; letter-spacing:-.01em;">Active escrows</span><span class="navbtn" data-nav="history" style="font-size:13.5px; color:#059669; font-weight:600;">See all</span></div>
          <div data-html="deals" class="js-fade-in" style="margin:12px 20px 0; display:flex; flex-direction:column; gap:10px;">
            <div style="padding:18px; text-align:center; color:#94A3B8; font-size:13px;">Loading your escrows…</div>
          </div>
          <!-- bottom nav -->
          <div style="position:fixed; left:0; right:0; bottom:0; max-width:440px; margin:0 auto; height:88px; background:linear-gradient(180deg, rgba(248,250,252,0), #F8FAFC 42%); pointer-events:none;">
            <div style="position:absolute; bottom:20px; left:20px; right:20px; height:60px; border-radius:20px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 10px 30px -14px rgba(15,23,42,.2); display:flex; align-items:center; justify-content:space-between; padding:0 42px; pointer-events:auto;">
              <div style="display:flex; flex-direction:column; align-items:center; gap:3px; color:#0F172A;"><svg width="22" height="22" viewBox="0 0 24 24" fill="#0F172A"><path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg><span style="font-size:10px; font-weight:600;">Home</span></div>
              <div class="navbtn" data-nav="profile" style="display:flex; flex-direction:column; align-items:center; gap:3px; color:#94A3B8;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.9"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg><span style="font-size:10px;">Profile</span></div>
            </div>
            <div class="navbtn" data-nav="new-escrow" style="position:absolute; bottom:50px; left:50%; transform:translateX(-50%); width:60px; height:60px; border-radius:50%; background:#0F172A; display:flex; align-items:center; justify-content:center; box-shadow:0 14px 28px -10px rgba(15,23,42,.55); pointer-events:auto; border:3px solid #F8FAFC;"><svg width="24" height="24" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>
          </div>
        </div>`;
