// Become a seller — rebuilt light (v2). Capture identity + payout so payouts
// have somewhere to land. Hooks unchanged: data-field fullName/idNumber/bankName/
// accountNumber/accountName, data-bind err, data-action verify + data-requires,
// data-nav back.
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:28px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="profile" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">Become a seller</h2></div>
          <!-- explainer -->
          <div style="margin:14px 20px 0; border-radius:16px; padding:14px 15px; background:#ECFDF5; border:1px solid #C7F0DE; display:flex; gap:11px; align-items:flex-start;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" style="flex-shrink:0; margin-top:1px;"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg><p style="font-size:12.5px; color:#065F46; line-height:1.5;"><b style="color:#064E3B;">Sellers must be verified to receive money.</b> Buyers pay in freely, but payouts only go to a verified identity.</p></div>
          <div style="padding:18px 20px 0;">
            <label style="font-size:12.5px; font-weight:600; color:#334155;">Full name (as on ID)</label>
            <input data-field="fullName" placeholder="e.g. Chidi Nwosu" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>
            <label style="display:block; margin-top:16px; font-size:12.5px; font-weight:600; color:#334155;">BVN or NIN</label>
            <input data-field="idNumber" inputmode="numeric" placeholder="11-digit BVN or NIN" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none; letter-spacing:2px;"/>
          </div>
          <!-- liveness -->
          <div style="margin:22px 20px 0;"><div style="font-size:12.5px; font-weight:600; color:#334155; margin-bottom:10px;">Liveness check</div>
            <div style="border-radius:18px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:20px; display:flex; flex-direction:column; align-items:center;">
              <div style="position:relative; width:120px; height:120px;">
                <div style="position:absolute; inset:0; border-radius:50%; background:#F1F5F9;"></div>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.4" style="position:absolute; top:30px; left:30px;"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                <div style="position:absolute; inset:-3px; border-radius:50%; border:3px solid transparent; border-top-color:#059669; border-right-color:#059669;"></div>
              </div>
              <div style="margin-top:14px; display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:#059669; font-weight:600;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.4"><path d="M20 6 9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>Liveness confirmed. Real person.</div>
              <p style="margin-top:6px; font-size:11.5px; color:#94A3B8;">Blink detected · face matches ID photo</p>
            </div>
          </div>
          <!-- payout account -->
          <div style="margin:18px 20px 0;"><label style="font-size:12.5px; font-weight:600; color:#334155;">Payout bank account, where you get paid</label>
            <input data-field="bankName" placeholder="Bank (e.g. GTBank, ALAT by Wema)" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>
            <input data-field="accountNumber" inputmode="numeric" placeholder="10-digit account number" style="margin-top:10px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>
            <input data-field="accountName" placeholder="Account name (as on the account)" style="margin-top:10px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>
          </div>
          <p data-bind="err" style="margin:14px 20px 0; font-size:13px; color:#DC2626; font-weight:500; line-height:1.4;"></p>
          <div style="margin:12px 20px 0;"><div class="navbtn" data-action="verify" data-requires="fullName,idNumber,bankName,accountNumber,accountName" style="height:56px; border-radius:15px; background:#0F172A; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:16px; color:#fff; box-shadow:0 14px 26px -12px rgba(15,23,42,.5);">Finish verification</div></div>
        </div>`;
