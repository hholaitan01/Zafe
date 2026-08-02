// Auto-generated from the TrustFlow design (screen "kyc"). Do not hand-edit.
export const html = `<div class="fscroll" style="width:366px; height:820px; border-radius:42px; overflow-y:auto; overflow-x:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 22px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="profile" style="width:40px; height:40px; border-radius:12px; background:#17171a; display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:800; letter-spacing:-.02em;">Become a seller</h2></div>
          <!-- explainer -->
          <div style="margin:14px 22px 0; border-radius:16px; padding:14px 15px; background:rgba(228,20,79,.09); border:1px solid rgba(228,20,79,.3); display:flex; gap:11px; align-items:flex-start;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff8fa8" stroke-width="1.9" style="flex-shrink:0; margin-top:1px;"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg><p style="font-size:12.5px; color:#ffc7d3; line-height:1.5;"><b style="color:#fff;">Sellers must be verified to receive money.</b> Buyers pay in freely — but payouts only go to a verified identity.</p></div>
          <div style="padding:18px 22px 0;">
            <label style="font-size:12px; font-weight:600; color:#9A9AA0;">Full name (as on ID)</label>
            <input data-field="fullName" placeholder="e.g. Chidi Nwosu" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            <label style="display:block; margin-top:16px; font-size:12px; font-weight:600; color:#9A9AA0;">BVN or NIN</label>
            <input data-field="idNumber" inputmode="numeric" placeholder="11-digit BVN or NIN" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none; letter-spacing:2px;"/>
          </div>
          <!-- liveness -->
          <div style="margin:22px 22px 0;"><div style="font-size:12px; font-weight:600; color:#9A9AA0; margin-bottom:10px;">Liveness check</div>
            <div style="border-radius:20px; background:#111318; border:1px solid #202024; padding:20px; display:flex; flex-direction:column; align-items:center;">
              <div style="position:relative; width:130px; height:130px;">
                <div style="position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 40% 32%, #23324a, #0d1420); box-shadow:inset 0 4px 14px rgba(0,0,0,.6);"></div>
                <svg width="66" height="66" viewBox="0 0 24 24" fill="none" stroke="#5a6b82" stroke-width="1.4" style="position:absolute; top:32px; left:32px;"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
                <div style="position:absolute; inset:-4px; border-radius:50%; border:3px solid transparent; border-top-color:#34D07E; border-right-color:#34D07E; box-shadow:0 0 18px rgba(52,208,126,.4);"></div>
              </div>
              <div style="margin-top:14px; display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:#34D07E; font-weight:700;"><span style="width:7px; height:7px; border-radius:50%; background:#34D07E; box-shadow:0 0 8px #34D07E;"></span>Liveness confirmed — real person</div>
              <p style="margin-top:6px; font-size:11.5px; color:#6d6d74;">Blink detected · face matches ID photo</p>
            </div>
          </div>
          <!-- payout account -->
          <div style="margin:18px 22px 0;"><label style="font-size:12px; font-weight:600; color:#9A9AA0;">Payout bank account — where you get paid</label>
            <input data-field="bankName" placeholder="Bank (e.g. GTBank, ALAT by Wema)" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            <input data-field="accountNumber" inputmode="numeric" placeholder="10-digit account number" style="margin-top:10px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            <input data-field="accountName" placeholder="Account name (as on the account)" style="margin-top:10px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
          </div>
          <p data-bind="err" style="margin:14px 22px 0; font-size:13px; color:#ff6b81; line-height:1.4;"></p>
          <div style="margin:12px 22px 24px;"><div class="navbtn" data-action="verify" data-requires="fullName,idNumber,bankName,accountNumber,accountName" style="height:56px; border-radius:14px; background:#E4144F; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px;">Finish verification</div></div>
        </div>`;
