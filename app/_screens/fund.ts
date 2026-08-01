// Auto-generated from the TrustFlow design (screen "fund"). Do not hand-edit.
export const html = `<div style="width:366px; height:820px; border-radius:42px; overflow:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <!-- dimmed backdrop hint -->
          <div style="position:absolute; inset:0; background:rgba(0,0,0,.4);"></div>
          <!-- checkout sheet -->
          <div style="position:absolute; left:0; right:0; bottom:0; border-radius:28px 28px 42px 42px; background:#141416; border-top:1px solid #26262b; padding:12px 24px 28px;">
            <div style="width:44px; height:5px; border-radius:99px; background:#33333a; margin:0 auto 20px;"></div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;"><div style="font-size:13px; color:#9A9AA0;">Locking into escrow</div></div>
            <div style="display:flex; align-items:flex-end; gap:8px;"><span data-bind="amount" style="font-size:38px; font-weight:800; letter-spacing:-.03em;">₦450,000</span></div>
            <div style="margin-top:6px; display:inline-flex; align-items:center; gap:7px; padding:5px 11px; border-radius:999px; background:rgba(52,208,126,.13); color:#34D07E; font-size:11.5px; font-weight:700;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D07E" stroke-width="2.4"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>Held safe, not sent to seller yet</div>
            <!-- AI scam / Trust banner + seller standing, shown before you pay -->
            <div data-html="trustBanner" style="margin-top:14px;"></div>
            <div data-html="sellerStanding" style="margin-top:10px;"></div>
            <div style="margin-top:22px; font-size:13px; font-weight:700; color:#9A9AA0;">Pay with</div>
            <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">
              <div data-action="selectPay" data-pay="card" style="height:60px; border-radius:16px; background:#1A1A1D; border:1.5px solid #E4144F; display:flex; align-items:center; gap:13px; padding:0 16px;"><div style="width:40px; height:40px; border-radius:11px; background:#26262b; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg></div><div style="flex:1;"><div style="font-size:14.5px; font-weight:700;">Debit card</div><div style="font-size:12px; color:#9A9AA0;">•••• 4821 · ALAT</div></div><div data-radio style="width:20px; height:20px; border-radius:50%; border:6px solid #E4144F; box-shadow:inset 0 0 0 2px #141416;"></div></div>
              <div data-action="selectPay" data-pay="ussd" style="height:60px; border-radius:16px; background:#1A1A1D; border:1px solid #26262b; display:flex; align-items:center; gap:13px; padding:0 16px;"><div style="width:40px; height:40px; border-radius:11px; background:#26262b; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" stroke-width="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 18h6"/></svg></div><div style="flex:1;"><div style="font-size:14.5px; font-weight:700;">USSD</div><div style="font-size:12px; color:#9A9AA0;">Dial a short code to pay</div></div><div data-radio style="width:20px; height:20px; border-radius:50%; border:2px solid #33333a;"></div></div>
              <div data-action="selectPay" data-pay="bank" style="height:60px; border-radius:16px; background:#1A1A1D; border:1px solid #26262b; display:flex; align-items:center; gap:13px; padding:0 16px;"><div style="width:40px; height:40px; border-radius:11px; background:#26262b; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" stroke-width="1.8"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg></div><div style="flex:1;"><div style="font-size:14.5px; font-weight:700;">Bank transfer</div><div style="font-size:12px; color:#9A9AA0;">Move from any bank app</div></div><div data-radio style="width:20px; height:20px; border-radius:50%; border:2px solid #33333a;"></div></div>
            </div>
            <!-- live mode: the account the buyer transfers into (empty in demo) -->
            <div data-html="payPanel" style="margin-top:14px;"></div>
            <!-- risky deals: the buyer must tick this before the money can move -->
            <div data-html="riskAck" style="margin-top:16px;"></div>
            <div class="navbtn" data-action="fund" style="margin-top:16px; height:56px; border-radius:14px; background:#E4144F; display:flex; align-items:center; justify-content:center; gap:9px; font-weight:700; font-size:16px;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span data-bind="payLabel">Pay ₦450,000 into escrow</span></div>
          </div>
        </div>`;
