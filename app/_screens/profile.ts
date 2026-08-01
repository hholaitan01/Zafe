// Auto-generated from the TrustFlow design (screen "profile"). Do not hand-edit.
export const html = `<div class="fscroll" style="width:366px; height:820px; border-radius:42px; overflow-y:auto; overflow-x:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:12px 22px 0; display:flex; flex-direction:column; align-items:center;">
            <div data-bind="initials" style="width:76px; height:76px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ff9dbb, #E4144F 55%, #7C3AED); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:26px;"></div>
            <div data-bind="name" style="margin-top:12px; font-size:20px; font-weight:800;">&nbsp;</div>
            <div style="margin-top:6px; display:inline-flex; align-items:center; gap:7px; padding:6px 13px; border-radius:999px; background:rgba(52,208,126,.15); color:#34D07E; font-size:12.5px; font-weight:700;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D07E" stroke-width="2.4"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg><span data-bind="scoreLine">Loading…</span></div>
          </div>
          <!-- line chart -->
          <div style="margin:22px 22px 0; border-radius:20px; background:#141416; border:1px solid #202024; padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center;"><span style="font-size:13.5px; font-weight:700;">Score over time</span><span style="font-size:12px; color:#34D07E; font-weight:700;">▲ +18 this year</span></div>
            <svg viewBox="0 0 300 90" style="width:100%; height:90px; margin-top:14px; overflow:visible;"><defs><linearGradient id="tfgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34D07E" stop-opacity=".35"/><stop offset="1" stop-color="#34D07E" stop-opacity="0"/></linearGradient></defs><path d="M0 70 L50 62 L100 66 L150 44 L200 40 L250 22 L300 14" fill="none" stroke="#34D07E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 70 L50 62 L100 66 L150 44 L200 40 L250 22 L300 14 L300 90 L0 90 Z" fill="url(#tfgrad)"/><circle cx="300" cy="14" r="4.5" fill="#34D07E" stroke="#0B0B0D" stroke-width="2"/></svg>
            <div style="display:flex; justify-content:space-between; font-size:10.5px; color:#6d6d74; margin-top:6px;"><span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Now</span></div>
          </div>
          <!-- bank details -->
          <div style="margin:16px 22px 0; border-radius:18px; background:#141416; border:1px solid #202024; padding:16px; display:flex; align-items:center; gap:13px;"><div style="width:42px; height:42px; border-radius:12px; background:#1e1e22; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" stroke-width="1.8"><path d="M3 21h18M5 21V10l7-5 7 5v11"/></svg></div><div style="flex:1;"><div style="font-size:14px; font-weight:700;">Payout account</div><div data-bind="payout" style="font-size:12.5px; color:#9A9AA0; margin-top:2px;">—</div></div><span class="navbtn" data-nav="seller" style="font-size:12.5px; color:#E4144F; font-weight:700;">Edit</span></div>
          <!-- become a seller + sign out -->
          <div class="navbtn" data-nav="seller" style="margin:12px 22px 0; border-radius:18px; background:#141416; border:1px solid #202024; padding:16px; display:flex; align-items:center; gap:13px;"><div style="width:42px; height:42px; border-radius:12px; background:rgba(228,20,79,.14); display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E4144F" stroke-width="1.9"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg></div><div style="flex:1;"><div style="font-size:14px; font-weight:700;">Sell on TrustFlow</div><div style="font-size:12.5px; color:#9A9AA0; margin-top:2px;">Verify to receive payouts &amp; manage your sales</div></div><svg width="18" height="18" viewBox="0 0 24 24" stroke="#6d6d74" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg></div>
          <div class="navbtn" data-action="signout" style="margin:12px 22px 0; height:52px; border-radius:14px; background:transparent; border:1px solid #33333a; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; color:#ff8fa8;">Sign out</div>
          <!-- completed deals -->
          <div style="margin:22px 22px 0; font-size:13px; font-weight:700; color:#9A9AA0;">COMPLETED DEALS</div>
          <div data-html="completed" style="margin:12px 22px 0; display:flex; flex-direction:column; gap:10px;">
            <div style="padding:16px; text-align:center; color:#6d6d74; font-size:13px;">Loading…</div>
          </div>
          <div style="height:40px;"></div>
        </div>`;
