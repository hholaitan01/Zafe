// Profile — account details (rebuilt in the TrustFlow style).
const field = (name: string, label: string, ph: string) =>
  `<label style="display:block; margin-top:14px; font-size:12px; font-weight:600; color:#9A9AA0;">${label}</label><input data-field="${name}" placeholder="${ph}" style="margin-top:6px; width:100%; box-sizing:border-box; height:50px; border-radius:12px; background:#1A1A1D; border:1px solid #26262b; padding:0 14px; font-size:15px; color:#fff; outline:none;"/>`;

export const html = `<div class="fscroll" style="width:366px; height:820px; border-radius:42px; overflow-y:auto; overflow-x:hidden; position:relative; background:#0B0B0D;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.7;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 22px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#17171a; display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:800; letter-spacing:-.02em;">Profile</h2></div>
          <div style="padding:14px 22px 0; display:flex; flex-direction:column; align-items:center;">
            <label style="position:relative; width:84px; height:84px; cursor:pointer;">
              <div data-photo="photo" data-bind="initials" style="width:84px; height:84px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ff9dbb, #E4144F 55%, #7C3AED); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:28px; overflow:hidden;"></div>
              <div style="position:absolute; right:-2px; bottom:-2px; width:28px; height:28px; border-radius:50%; background:#E4144F; border:3px solid #0B0B0D; display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
              <input id="tf-photo" type="file" accept="image/*" style="position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer;"/>
            </label>
            <div data-bind="name" style="margin-top:12px; font-size:20px; font-weight:800;">&nbsp;</div>
            <div style="margin-top:6px; display:inline-flex; align-items:center; gap:7px; padding:6px 13px; border-radius:999px; background:rgba(52,208,126,.15); color:#34D07E; font-size:12.5px; font-weight:700;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D07E" stroke-width="2.4"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg><span data-bind="scoreLine">Loading…</span></div>
          </div>
          <!-- personal details -->
          <div style="margin:22px 22px 0; font-size:13px; font-weight:700; color:#9A9AA0;">PERSONAL DETAILS</div>
          <div style="margin:12px 22px 0; border-radius:18px; background:#141416; border:1px solid #202024; padding:16px;">
            <label style="font-size:12px; font-weight:600; color:#9A9AA0;">First name</label>
            <input data-field="firstName" placeholder="First name" style="margin-top:6px; width:100%; box-sizing:border-box; height:50px; border-radius:12px; background:#1A1A1D; border:1px solid #26262b; padding:0 14px; font-size:15px; color:#fff; outline:none;"/>
            ${field("otherNames", "Other names", "Optional")}
            ${field("lastName", "Last name", "Last name")}
            ${field("username", "Username", "@yourhandle")}
            <p data-bind="err" style="margin:12px 0 0; font-size:12.5px; color:#ff6b81; line-height:1.4;"></p>
            <p data-bind="lockNote" style="margin:8px 0 0; font-size:11.5px; color:#6d6d74; line-height:1.4;"></p>
            <div class="navbtn" data-action="saveNames" style="margin-top:14px; height:48px; border-radius:12px; background:#E4144F; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14.5px;"><span data-bind="saveLabel">Save</span></div>
          </div>
          <!-- account -->
          <div style="margin:22px 22px 0; font-size:13px; font-weight:700; color:#9A9AA0;">ACCOUNT</div>
          <div style="margin:12px 22px 0; border-radius:18px; background:#141416; border:1px solid #202024; overflow:hidden;">
            <div class="navbtn" data-nav="seller" style="padding:15px 16px; display:flex; align-items:center; gap:13px; border-bottom:1px solid #202024;"><div style="width:38px; height:38px; border-radius:11px; background:#1e1e22; display:flex; align-items:center; justify-content:center;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" stroke-width="1.8"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg></div><div style="flex:1;"><div style="font-size:14px; font-weight:700;">Identity verification</div><div data-bind="idStatus" style="font-size:12.5px; margin-top:2px; color:#9A9AA0;">—</div></div><svg width="18" height="18" viewBox="0 0 24 24" stroke="#6d6d74" stroke-width="2" fill="none"><path d="M9 18l6-6-6-6"/></svg></div>
            <div style="padding:15px 16px; display:flex; align-items:center; gap:13px; border-bottom:1px solid #202024;"><div style="width:38px; height:38px; border-radius:11px; background:#1e1e22; display:flex; align-items:center; justify-content:center;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></div><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:700;">Email address</div><div data-bind="email" style="font-size:12.5px; margin-top:2px; color:#9A9AA0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">—</div></div></div>
            <div class="navbtn" data-nav="seller" style="padding:15px 16px; display:flex; align-items:center; gap:13px;"><div style="width:38px; height:38px; border-radius:11px; background:#1e1e22; display:flex; align-items:center; justify-content:center;"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" stroke-width="1.8"><path d="M3 21h18M5 21V10l7-5 7 5v11"/></svg></div><div style="flex:1;"><div style="font-size:14px; font-weight:700;">Payout account</div><div data-bind="payout" style="font-size:12.5px; margin-top:2px; color:#9A9AA0;">—</div></div><span style="font-size:12.5px; color:#E4144F; font-weight:700;">Edit</span></div>
          </div>
          <div class="navbtn" data-nav="selling" style="margin:18px 22px 0; height:56px; border-radius:16px; background:#E4144F; display:flex; align-items:center; justify-content:center; gap:10px; font-weight:700; font-size:16px; box-shadow:0 12px 26px -12px rgba(228,20,79,.8);"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg>Be a Seller</div>
          <div class="navbtn" data-action="signout" style="margin:12px 22px 0; height:52px; border-radius:14px; background:transparent; border:1px solid #33333a; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; color:#ff8fa8;">Sign out</div>
          <div style="height:40px;"></div>
        </div>`;
