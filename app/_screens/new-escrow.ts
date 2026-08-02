// New escrow — redesigned in the v2 language. The amount is the hero; item and
// counterparty follow; the chat paste is an optional AI-scan add-on. Wiring
// hooks (data-field amount/title/seller/chat, data-bind err, data-action
// createDeal + data-requires, data-nav) are unchanged.
export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">New escrow</h2></div>
          <div style="padding:6px 20px 28px;">
            <p style="font-size:14px; color:#64748B; line-height:1.5;">Your money is held safe and only released when you confirm you got what you paid for.</p>

            <!-- amount hero -->
            <div style="margin-top:20px; border-radius:20px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:18px 18px 20px;">
              <label style="font-size:12.5px; font-weight:600; color:#64748B;">Amount to protect</label>
              <div style="margin-top:10px; display:flex; align-items:center; gap:6px;"><span style="font-size:34px; font-weight:700; color:#94A3B8;">₦</span><input data-field="amount" data-money inputmode="numeric" placeholder="0" style="flex:1; min-width:0; background:transparent; border:none; outline:none; color:#0F172A; font-size:34px; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums;"/></div>
            </div>

            <!-- item -->
            <label style="display:block; margin-top:18px; font-size:13px; font-weight:600; color:#334155;">What are you buying?</label>
            <input data-field="title" placeholder="e.g. MacBook Air M2, Space Grey, 256GB" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>

            <!-- seller -->
            <label style="display:block; margin-top:16px; font-size:13px; font-weight:600; color:#334155;">Who are you paying?</label>
            <input data-field="seller" placeholder="@username, phone or seller@email.com" style="margin-top:7px; width:100%; box-sizing:border-box; height:54px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; padding:0 15px; font-size:15px; color:#0F172A; outline:none;"/>
            <p style="margin-top:8px; font-size:12.5px; color:#64748B; line-height:1.5;">We'll show you their TrustFlow standing on the next screen, before you pay.</p>

            <!-- optional AI chat scan -->
            <div style="margin-top:22px; border-radius:18px; background:#F1F5F9; border:1px solid #E2E8F0; padding:16px;">
              <div style="display:flex; align-items:center; gap:9px; margin-bottom:9px;"><div style="width:30px; height:30px; border-radius:9px; background:#ECFDF5; display:flex; align-items:center; justify-content:center;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M7 12h10"/></svg></div><div><div style="font-size:13.5px; font-weight:600; color:#0F172A;">Scan your chat for scams</div><div style="font-size:12px; color:#64748B;">Optional. Paste it and our AI checks it first.</div></div></div>
              <textarea data-field="chat" placeholder="Paste your WhatsApp or Instagram chat with the seller…" style="margin-top:4px; width:100%; box-sizing:border-box; border-radius:12px; background:#fff; border:1px solid #E2E8F0; padding:13px; min-height:96px; font-size:13px; color:#0F172A; line-height:1.55; outline:none; resize:vertical; font-family:inherit;"></textarea>
            </div>

            <p data-bind="err" style="margin-top:16px; font-size:13px; color:#DC2626; font-weight:500; line-height:1.4;"></p>
            <div class="navbtn" data-action="createDeal" data-requires="amount,title,seller" style="margin-top:14px; height:56px; border-radius:15px; background:#0F172A; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:600; font-size:16px; color:#fff; box-shadow:0 14px 26px -12px rgba(15,23,42,.5);">Continue to payment<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>
          </div>
        </div>`;
