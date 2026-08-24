// "Your money is safe" — rebuilt v2 as a navy vault moment. Immersive (this is
// a high-emotion confirmation), navy + emerald. Hooks unchanged: data-bind
// amount/escrowId, data-nav timeline.
export const html = `<div style="width:100%; min-height:100dvh; overflow:hidden; position:relative; background:radial-gradient(120% 80% at 50% 10%, #14304A 0%, #0F172A 52%, #0A1524 100%); color:#fff;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0 34px; text-align:center;">
            <div style="position:relative; width:140px; height:140px; animation:floaty 5.5s ease-in-out infinite;">
              <div style="position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 35% 28%, #1e405f 0%, #0F172A 70%); box-shadow:0 30px 70px -14px rgba(0,0,0,.6), inset 0 0 0 1px rgba(5,150,105,.3);"></div>
              <div style="position:absolute; inset:-3px; border-radius:50%; border:3px solid transparent; border-top-color:#059669; border-right-color:#059669; box-shadow:0 0 22px rgba(5,150,105,.5);"></div>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2" style="position:absolute; top:44px; left:44px;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-linecap="round"/></svg>
            </div>
            <div data-bind="amount" style="margin-top:32px; font-size:36px; font-weight:700; letter-spacing:-.03em; font-variant-numeric:tabular-nums;">₦0</div>
            <h2 style="margin-top:8px; font-size:23px; font-weight:700; letter-spacing:-.02em; line-height:1.25;">is locked safely in escrow</h2>
            <p style="margin-top:14px; font-size:15px; color:#93A4BC; line-height:1.55; max-width:32ch;">The seller can now ship. Your money is released only when <b style="color:#fff;">you</b> confirm you got the item.</p>
            <div style="margin-top:22px; display:inline-flex; align-items:center; gap:8px; padding:8px 15px; border-radius:999px; background:rgba(5,150,105,.12); border:1px solid rgba(5,150,105,.26); font-size:12.5px; font-weight:600; color:#E2E8F0;"><span style="width:7px; height:7px; border-radius:50%; background:#059669;"></span><span data-bind="escrowId">Escrow held safe</span></div>
            <div style="position:absolute; left:34px; right:34px; bottom:40px;"><div class="navbtn" data-nav="timeline" style="height:56px; border-radius:16px; background:#fff; color:#0F172A; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:16px;">Track this deal</div></div>
          </div>
        </div>`;
