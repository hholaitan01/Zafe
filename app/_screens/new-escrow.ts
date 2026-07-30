// From the TrustFlow design (screen "new-escrow") — wired to the backend by H2O
// (real inputs + a createDeal action). If regenerated from the design, re-apply
// the data-field / data-action hooks below.
export const html = `<div class="fscroll" style="width:366px; height:820px; border-radius:42px; overflow-y:auto; overflow-x:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 22px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#17171a; display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:800; letter-spacing:-.02em;">New Escrow</h2></div>
          <div style="padding:6px 22px 0;">
            <p style="font-size:13.5px; color:#9A9AA0; line-height:1.5;">Set up a protected deal. Your money stays locked until you confirm you got what you paid for.</p>
            <div style="margin-top:22px;">
              <label style="font-size:12px; font-weight:600; color:#9A9AA0;">Amount</label>
              <div style="margin-top:8px; height:70px; border-radius:16px; background:#1A1A1D; border:1px solid #26262b; display:flex; align-items:center; padding:0 18px; gap:6px;"><span style="font-size:30px; font-weight:800; color:#6d6d74;">₦</span><input data-field="amount" inputmode="numeric" placeholder="450,000" style="flex:1; min-width:0; background:transparent; border:none; outline:none; color:#fff; font-size:30px; font-weight:800; letter-spacing:-.02em;"/></div>
            </div>
            <div style="margin-top:16px;">
              <label style="font-size:12px; font-weight:600; color:#9A9AA0;">Item description</label>
              <input data-field="title" placeholder="e.g. MacBook Air M2, Space Grey, 256GB" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            </div>
            <div style="margin-top:16px;">
              <label style="font-size:12px; font-weight:600; color:#9A9AA0;">Seller's phone or email</label>
              <input data-field="seller" placeholder="+234 803 555 0142 or seller@email.com" style="margin-top:8px; width:100%; box-sizing:border-box; height:56px; border-radius:14px; background:#1A1A1D; border:1px solid #26262b; padding:0 16px; font-size:15px; color:#fff; outline:none;"/>
            </div>
            <!-- PASTE CHAT box, hero of this screen -->
            <div style="margin-top:22px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;"><label style="font-size:13px; font-weight:700; color:#fff;">Paste your chat with the seller</label><span style="font-size:10px; font-weight:800; color:#7C3AED; background:rgba(124,58,237,.16); padding:3px 7px; border-radius:6px;">AI SCANS THIS</span></div>
              <textarea data-field="chat" placeholder="Paste your WhatsApp/Instagram chat here, e.g.&#10;Seller: This is the last one, pay into my personal account now before someone else buys it.&#10;You: Can we do a quick video call to confirm it's real?&#10;Seller: No time abeg, just send the money sharp sharp — trust me." style="width:100%; box-sizing:border-box; border-radius:18px; background:#120a14; border:1.5px dashed rgba(124,58,237,.5); padding:16px; min-height:150px; font-size:12.5px; color:#cfcfd6; line-height:1.55; outline:none; resize:vertical; font-family:inherit;"></textarea>
              <p style="margin-top:10px; font-size:12px; color:#6d6d74; line-height:1.5;">Our AI reads this conversation to spot scam warning signs before you pay.</p>
            </div>
            <div class="navbtn" data-action="createDeal" style="margin:24px 0; height:56px; border-radius:14px; background:#E4144F; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:700; font-size:16px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>Run Trust Score</div>
          </div>
        </div>`;
