// Handover code — rebuilt light (v2). Buyer sees their secret release code;
// seller enters it on the keypad to release payment. Hooks unchanged:
// data-tabs/data-tab/data-pane, data-keypad/data-code/data-dots/.kd,
// data-key/data-keyhint/data-keydone.
const digit = (n: string) =>
  `<div style="width:56px; height:70px; border-radius:14px; background:#0F172A; display:flex; align-items:center; justify-content:center; font-size:34px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums;">${n}</div>`;
const key = (n: string) =>
  `<span data-key="${n}" class="navbtn" style="height:58px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:600; color:#0F172A;">${n}</span>`;

export const html = `<div class="fscroll" data-tabs style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:24px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="timeline" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">Handover code</h2></div>
          <!-- segmented -->
          <div style="margin:14px 20px 0; height:46px; border-radius:14px; background:#EEF2F6; border:1px solid #E6EAF0; display:flex; padding:4px;">
            <span data-tab="pane-buyer" style="flex:1; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:13.5px; font-weight:600; cursor:pointer; background:#059669; color:#fff;">Buyer</span>
            <span data-tab="pane-seller" style="flex:1; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:13.5px; font-weight:600; cursor:pointer; background:transparent; color:#64748B;">Seller</span>
          </div>
          <!-- BUYER pane -->
          <div id="pane-buyer" data-pane style="padding:24px 20px 0;">
            <p style="font-size:13.5px; color:#64748B; line-height:1.5; text-align:center;">Your secret release code</p>
            <div style="margin:18px 0; display:flex; gap:10px; justify-content:center;">${digit("7")}${digit("2")}${digit("9")}${digit("4")}</div>
            <div style="border-radius:16px; background:#FEF3C7; border:1px solid #FCE3A6; padding:15px 16px; display:flex; gap:11px; align-items:flex-start;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A16207" stroke-width="1.9" style="flex-shrink:0;"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke-linecap="round"/></svg><p style="font-size:13px; color:#854D0E; line-height:1.5;">Give this code to the seller <b style="color:#713F12;">only when you have received and checked your item.</b> It releases your money.</p></div>
          </div>
          <!-- SELLER pane -->
          <div id="pane-seller" data-pane style="display:none; padding:22px 20px 0;">
            <p style="font-size:13.5px; color:#64748B; line-height:1.5; text-align:center;">Enter the buyer's code to release your payment</p>
            <div data-keypad data-code="7294" style="margin-top:18px;">
              <div data-dots style="display:flex; gap:12px; justify-content:center; margin-bottom:18px;">
                <div class="kd" style="width:16px; height:16px; border-radius:50%; background:#E2E8F0;"></div>
                <div class="kd" style="width:16px; height:16px; border-radius:50%; background:#E2E8F0;"></div>
                <div class="kd" style="width:16px; height:16px; border-radius:50%; background:#E2E8F0;"></div>
                <div class="kd" style="width:16px; height:16px; border-radius:50%; background:#E2E8F0;"></div>
              </div>
              <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">
                ${key("1")}${key("2")}${key("3")}${key("4")}${key("5")}${key("6")}${key("7")}${key("8")}${key("9")}
                <span style="height:58px;"></span>
                ${key("0")}
                <span data-key="del" class="navbtn" style="height:58px; border-radius:14px; display:flex; align-items:center; justify-content:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.8"><path d="M20 5H8L2 12l6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M14 9l-4 6M10 9l4 6" stroke-linecap="round"/></svg></span>
              </div>
              <div data-keyhint style="margin-top:16px; text-align:center; font-size:12px; color:#94A3B8;">Try the buyer's code: 7 2 9 4</div>
            </div>
            <!-- success -->
            <div data-keydone style="display:none; margin-top:26px; text-align:center;">
              <div style="width:96px; height:96px; margin:0 auto; border-radius:50%; background:radial-gradient(circle at 35% 28%, #c9ffe4, #10B981 46%, #047857); display:flex; align-items:center; justify-content:center; box-shadow:0 20px 50px -14px rgba(16,185,129,.55);"><svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
              <h3 style="margin-top:20px; font-size:22px; font-weight:700;">Code correct</h3>
              <p style="margin-top:10px; font-size:14px; color:#059669; line-height:1.5;">Money released to your account. Both Trust Scores updated.</p>
            </div>
          </div>
        </div>`;
