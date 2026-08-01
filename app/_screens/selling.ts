// My sales — the seller's side (built in the TrustFlow style; no Figma source).
export const html = `<div class="fscroll" style="width:366px; height:820px; border-radius:42px; overflow-y:auto; overflow-x:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 22px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#17171a; display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:800; letter-spacing:-.02em;">My sales</h2></div>
          <!-- verify banner (only when not yet verified) -->
          <div data-html="verifyBanner" style="margin:14px 22px 0;"></div>
          <!-- request a payment -->
          <div class="navbtn" data-nav="request" style="margin:16px 22px 0; height:60px; border-radius:16px; background:#E4144F; display:flex; align-items:center; gap:11px; padding:0 16px; font-weight:700; font-size:15px; box-shadow:0 12px 26px -10px rgba(228,20,79,.8);"><div style="width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>Request a payment</div>
          <div style="margin:22px 22px 0; font-size:13px; font-weight:700; color:#9A9AA0;">YOUR SALES</div>
          <div data-html="sales" style="margin:12px 22px 0; display:flex; flex-direction:column; gap:10px;">
            <div style="padding:18px; text-align:center; color:#6d6d74; font-size:13px;">Loading your sales…</div>
          </div>
          <div style="height:40px;"></div>
        </div>`;
