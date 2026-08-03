// My sales — the seller's side. Rebuilt light (v2). verifyBanner + sales are
// generated in selling/page.tsx. Hooks unchanged: data-html, data-nav.
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:28px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">My sales</h2></div>
          <!-- verify banner (only when not yet verified) -->
          <div data-html="verifyBanner" style="margin:14px 20px 0;"></div>
          <!-- request a payment -->
          <div class="navbtn" data-nav="request" style="margin:16px 20px 0; height:58px; border-radius:16px; background:#059669; display:flex; align-items:center; gap:11px; padding:0 16px; font-weight:600; font-size:15px; color:#fff; box-shadow:0 14px 26px -12px rgba(5,150,105,.55);"><div style="width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.16); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2.3" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></div>Request a payment</div>
          <div style="margin:24px 20px 0; font-size:12px; font-weight:700; color:#64748B; letter-spacing:.04em;">YOUR SALES</div>
          <div data-html="sales" class="js-fade-in" style="margin:12px 20px 0; display:flex; flex-direction:column; gap:10px;">
            <div style="padding:18px; text-align:center; color:#94A3B8; font-size:13px;">Loading your sales…</div>
          </div>
        </div>`;
