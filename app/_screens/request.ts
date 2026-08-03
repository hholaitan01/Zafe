// Request a payment — seller-initiated escrow. Rebuilt light (v2). Hooks
// unchanged: data-field amount/title/buyer, data-bind err, data-action request
// + data-requires, data-nav back.
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:28px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="selling" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">Request a payment</h2></div>
          <div style="padding:6px 20px 28px;">
            <p style="font-size:14px; color:#64748B; line-height:1.5;">Ask a buyer to pay into escrow. Their money is held safely, and you get paid the moment they confirm they received the item.</p>

            <div style="margin-top:20px; border-radius:20px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:18px 18px 20px;">
              <label style="font-size:12.5px; font-weight:600; color:#64748B;">Amount to request</label>
              <div style="margin-top:10px; display:flex; align-items:center; gap:6px;"><span style="font-size:34px; font-weight:700; color:#94A3B8;">₦</span><input data-field="amount" data-money inputmode="numeric" placeholder="0" style="flex:1; min-width:0; background:transparent; border:none; outline:none; color:#0F172A; font-size:34px; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums;"/></div>
            </div>

            <label style="display:block; margin-top:18px; font-size:13px; font-weight:600; color:#334155;">What are you selling?</label>
            <input data-field="title" placeholder="e.g. iPhone 14 Pro, 256GB" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>

            <label style="display:block; margin-top:16px; font-size:13px; font-weight:600; color:#334155;">Buyer's phone or email</label>
            <input data-field="buyer" placeholder="@username, phone or buyer@email.com" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>

            <p data-bind="err" style="margin-top:16px; font-size:13px; color:#DC2626; font-weight:500; line-height:1.4;"></p>
            <div class="navbtn" data-action="request" data-requires="amount,title,buyer" style="margin-top:14px; height:56px; border-radius:15px; background:#0F172A; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:600; font-size:16px; color:#fff; box-shadow:0 14px 26px -12px rgba(15,23,42,.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/></svg>Send payment request</div>
          </div>
        </div>`;
