// Dashboard — redesigned (not a re-skin of the old layout). Leads with the
// product's core value: money currently protected in escrow, computed from real
// deals. Trust score is demoted to a secondary card. Wiring hooks unchanged
// (data-nav / data-action / data-bind / data-html / data-photo / .ring / .score-num).
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:112px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <!-- top bar -->
          <div style="padding:8px 20px 0; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;"><div data-photo="photo" data-bind="initials" style="width:42px; height:42px; border-radius:50%; background:#0F172A; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14.5px; color:#fff; overflow:hidden;"></div><div><div data-bind="greeting" style="font-size:12.5px; color:#64748B; font-weight:500;">Welcome,</div><div data-bind="name" style="font-size:16.5px; font-weight:700; letter-spacing:-.01em; color:#0F172A;">&nbsp;</div></div></div>
            <div style="display:flex; gap:10px;"><div class="navbtn" data-nav="notifications" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div><div class="navbtn" data-nav="settings" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.42l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.4 9.6L6.34 9.54A2 2 0 1 1 9.17 6.7l.06.06A1.65 1.65 0 0 0 12 5.6V4.5a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 19.42 9l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 15z"/></svg></div></div>
          </div>
          <!-- VAULT hero: money protected right now -->
          <div style="margin:18px 20px 0; border-radius:26px; padding:24px 22px; background:radial-gradient(120% 130% at 85% 0%, #14304A 0%, #0F172A 55%); position:relative; overflow:hidden; box-shadow:0 24px 48px -22px rgba(15,23,42,.5);">
            <div style="position:absolute; top:-40px; right:-30px; width:150px; height:150px; border-radius:50%; background:radial-gradient(circle at 40% 40%, rgba(16,185,129,.35), transparent 70%);"></div>
            <div style="position:relative;">
              <div style="display:inline-flex; align-items:center; gap:7px; font-size:12px; font-weight:600; letter-spacing:.04em; color:#6EE7B7;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" stroke-width="2"><path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"/></svg>PROTECTED IN ESCROW</div>
              <div data-bind="heldAmount" style="margin-top:12px; font-size:46px; font-weight:700; letter-spacing:-.04em; line-height:1; color:#fff; font-variant-numeric:tabular-nums;">₦0</div>
              <div data-bind="heldSub" style="margin-top:10px; font-size:13.5px; color:#93A4BC; line-height:1.5; max-width:30ch;">Nothing in escrow yet. Start a protected deal and your money stays locked until you confirm.</div>
            </div>
          </div>
          <!-- actions -->
          <div style="margin:16px 20px 0;">
            <div class="navbtn" data-nav="new-escrow" style="height:56px; border-radius:16px; background:#059669; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:600; font-size:16px; color:#fff; box-shadow:0 14px 26px -12px rgba(5,150,105,.6);"><svg width="19" height="19" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.3" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Start a protected deal</div>
            <div style="margin-top:11px; display:flex; gap:11px;">
              <div class="navbtn" data-nav="history" style="flex:1; height:50px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:14px; color:#334155;"><svg width="17" height="17" viewBox="0 0 24 24" stroke="#334155" stroke-width="1.9" fill="none"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></svg>History</div>
              <div class="navbtn" data-nav="selling" style="flex:1; height:50px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:14px; color:#334155;"><svg width="17" height="17" viewBox="0 0 24 24" stroke="#334155" stroke-width="1.9" fill="none"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg>Sell</div>
            </div>
          </div>
          <!-- trust score (secondary) -->
          <div class="navbtn" data-nav="profile" style="margin:14px 20px 0; border-radius:18px; padding:16px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; gap:15px;">
            <div style="position:relative; width:56px; height:56px; flex-shrink:0;">
              <div class="ring" style="position:absolute; inset:0; border-radius:50%; background:conic-gradient(#10B981 calc(var(--p)*3.6deg), #E6EAF0 0);"></div>
              <div style="position:absolute; inset:6px; border-radius:50%; background:#fff; display:flex; align-items:center; justify-content:center;"><span class="score-num" style="font-size:19px; font-weight:700; letter-spacing:-.02em; color:#0F172A;">—</span></div>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:13px; font-weight:600; color:#64748B;">Your trust score</div>
              <div data-bind="repLabel" style="font-size:15px; font-weight:700; color:#0F172A; margin-top:2px;">Loading…</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" stroke="#94A3B8" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg>
          </div>
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
            <div class="navbtn" data-nav="new-escrow" style="position:absolute; bottom:50px; left:50%; transform:translateX(-50%); width:60px; height:60px; border-radius:50%; background:#059669; display:flex; align-items:center; justify-content:center; box-shadow:0 14px 28px -10px rgba(5,150,105,.6); pointer-events:auto; border:3px solid #F8FAFC;"><svg width="24" height="24" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>
          </div>
        </div>`;
