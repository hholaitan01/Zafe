// Request a payment — seller-initiated escrow (built in the TrustFlow style).
export const html = `<div class="fscroll" style="width:366px; height:820px; border-radius:42px; overflow-y:auto; overflow-x:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 22px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="selling" style="width:40px; height:40px; border-radius:12px; background:#17171a; display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:800; letter-spacing:-.02em;">Request a payment</h2></div>
          <div style="padding:6px 22px 0;">
            <p style="font-size:13.5px; color:#9A9AA0; line-height:1.5;">Ask a buyer to pay into escrow. Their money is held safely — you get paid the moment they confirm they received the item.</p>
            <div style="margin-top:22px;">
              <label style="font-size:12px; font-weight:600; color:#9A9AA0;">Amount</label>
              <div style="margin-top:8px; height:70px; border-radius:16px; background:#1A1A1D; border:1px solid #26262b; display:flex; align-items:center; padding:0 18px; gap:6px;"><span style="font-size:30px; font-weight:800; color:#6d6d74;">₦</span><input data-field="amount" data-money inputmode="numeric" placeholder="450,000" style="flex:1; min-width:0; background:transparent; border:none; outline:none; color:#fff; font-size:30px; font-weight:800; letter-spacing:-.02em;"/></div>
            </div>
            <div style="margin-top:16px;">
              <label style="font-size:12px; font-weight:600; color:#9A9AA0;">What are you selling?</label>
              <input data-field="title" placeholder="e.g. iPhone 14 Pro, 256GB" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            </div>
            <div style="margin-top:16px;">
              <label style="font-size:12px; font-weight:600; color:#9A9AA0;">Buyer's phone or email</label>
              <input data-field="buyer" placeholder="@username, phone or buyer@email.com" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            </div>
            <p data-bind="err" style="margin-top:16px; font-size:13px; color:#ff6b81; line-height:1.4;"></p>
            <div class="navbtn" data-action="request" data-requires="amount,title,buyer" style="margin:12px 0 24px; height:56px; border-radius:14px; background:#E4144F; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:700; font-size:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/></svg>Send payment request</div>
          </div>
        </div>`;
