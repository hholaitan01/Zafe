// Payment — redesigned light. A proper "confirm & pay" screen: the escrow
// amount up top, the trust signals (AI scan + seller standing) before you pay,
// then the payment method and the pay button. Wiring hooks unchanged:
// data-bind amount/payLabel, data-html trustBanner/sellerStanding/payPanel/riskAck,
// data-action selectPay (data-pay/data-radio) + fund, data-nav back.
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:24px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="new-escrow" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">Confirm &amp; pay</h2></div>
          <div style="padding:6px 20px 0;">
            <!-- amount summary -->
            <div style="margin-top:12px; border-radius:20px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:18px;">
              <div style="font-size:13px; color:#64748B;">Locking into escrow</div>
              <div data-bind="amount" style="margin-top:4px; font-size:36px; font-weight:700; letter-spacing:-.03em; font-variant-numeric:tabular-nums;">₦0</div>
              <div style="margin-top:10px; display:inline-flex; align-items:center; gap:7px; padding:6px 11px; border-radius:999px; background:#ECFDF5; border:1px solid #C7F0DE; color:#059669; font-size:12px; font-weight:600;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"/></svg>Held safe, not sent to the seller yet</div>
            </div>

            <!-- trust signals -->
            <div data-html="trustBanner" style="margin-top:14px;"></div>
            <div data-html="sellerStanding" style="margin-top:10px;"></div>

            <!-- payment method -->
            <div style="margin-top:22px; font-size:13px; font-weight:700; color:#334155;">Pay with</div>
            <div style="margin-top:12px; display:flex; flex-direction:column; gap:10px;">
              <div class="navbtn" data-action="selectPay" data-pay="card" style="height:62px; border-radius:15px; background:#fff; border:1.5px solid #059669; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; gap:13px; padding:0 15px;"><div style="width:40px; height:40px; border-radius:11px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.7"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg></div><div style="flex:1;"><div style="font-size:14.5px; font-weight:600;">Debit card</div><div style="font-size:12px; color:#64748B;">•••• 4821 · ALAT</div></div><div data-radio style="width:20px; height:20px; border-radius:50%; border:6px solid #059669; box-shadow:inset 0 0 0 2px #fff;"></div></div>
              <div class="navbtn" data-action="selectPay" data-pay="ussd" style="height:62px; border-radius:15px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; gap:13px; padding:0 15px;"><div style="width:40px; height:40px; border-radius:11px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.7"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 18h6"/></svg></div><div style="flex:1;"><div style="font-size:14.5px; font-weight:600;">USSD</div><div style="font-size:12px; color:#64748B;">Dial a short code to pay</div></div><div data-radio style="width:20px; height:20px; border-radius:50%; border:2px solid #CBD5E1;"></div></div>
              <div class="navbtn" data-action="selectPay" data-pay="bank" style="height:62px; border-radius:15px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; gap:13px; padding:0 15px;"><div style="width:40px; height:40px; border-radius:11px; background:#F1F5F9; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" stroke-width="1.7"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg></div><div style="flex:1;"><div style="font-size:14.5px; font-weight:600;">Bank transfer</div><div style="font-size:12px; color:#64748B;">Move from any bank app</div></div><div data-radio style="width:20px; height:20px; border-radius:50%; border:2px solid #CBD5E1;"></div></div>
            </div>

            <div data-html="payPanel" style="margin-top:14px;"></div>
            <div data-html="riskAck" style="margin-top:16px;"></div>

            <div class="navbtn" data-action="fund" style="margin-top:18px; height:56px; border-radius:15px; background:#0F172A; display:flex; align-items:center; justify-content:center; gap:9px; font-weight:600; font-size:16px; color:#fff; box-shadow:0 14px 26px -12px rgba(15,23,42,.5);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span data-bind="payLabel">Pay into escrow</span></div>
            <p style="margin-top:12px; text-align:center; font-size:12px; color:#94A3B8; line-height:1.5;">Your money is released to the seller only when you confirm delivery.</p>
          </div>
        </div>`;
