// "Your money is held safe" — the escrow-secured screen the buyer lands on after
// paying. Rebuilt in the light emerald/white system so it's consistent with the
// payment sheet and the rest of the app (was a dark vault moment). Hooks
// unchanged: data-bind amount / escrowId, data-nav timeline + dashboard.
export const html = `<div style="width:100%; min-height:100dvh; background:#F8FAFC; color:#0F172A; display:flex; flex-direction:column; font-family:'Plus Jakarta Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased;">
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:32px 28px;">
            <div style="position:relative; width:88px; height:88px; animation:floaty 5.5s ease-in-out infinite;">
              <div style="position:absolute; inset:-7px; border-radius:50%; border:1.5px solid rgba(5,150,105,.22);"></div>
              <div style="position:absolute; inset:0; border-radius:50%; background:#059669; display:flex; align-items:center; justify-content:center; box-shadow:0 22px 44px -16px rgba(5,150,105,.55);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.4"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>
              </div>
            </div>
            <div data-bind="amount" class="tf-mono" style="margin-top:30px; font-size:40px; font-weight:800; letter-spacing:-.03em; line-height:1; font-variant-numeric:tabular-nums;">&#8358;0</div>
            <h1 style="margin-top:8px; font-size:22px; font-weight:800; letter-spacing:-.02em; line-height:1.25;">is held safe in escrow</h1>
            <p style="margin-top:12px; font-size:14.5px; line-height:1.6; color:#64748B; max-width:32ch;">The seller can ship now. Your money is released only when <b style="color:#0F172A; font-weight:700;">you</b> confirm the item arrived.</p>
            <div style="margin-top:20px; display:inline-flex; align-items:center; gap:8px; padding:8px 14px; border-radius:999px; background:#ECFDF5; border:1px solid rgba(5,150,105,.22); font-size:12.5px; font-weight:700; color:#047857;"><span style="width:7px; height:7px; border-radius:50%; background:#059669;"></span><span data-bind="escrowId">Escrow held safe</span></div>
          </div>
          <div style="padding:0 24px calc(28px + env(safe-area-inset-bottom,0px)); display:flex; flex-direction:column; gap:10px;">
            <div class="navbtn" data-nav="timeline" style="height:54px; border-radius:14px; background:#059669; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15.5px; box-shadow:0 12px 24px -12px rgba(5,150,105,.5);">Track this deal</div>
            <div class="navbtn" data-nav="dashboard" style="height:50px; border-radius:14px; background:transparent; color:#334155; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14.5px;">Back to home</div>
          </div>
        </div>`;
