// Profile — genuinely redesigned (v2), content modelled on the Claude Design
// profile: identity hero, Trust Score history (chart + stat strip), payout
// bank cards, preference toggles, identity-verification list, danger zone.
// Rebuilt for mobile in the navy/emerald language. Working bits preserved:
// name-edit locks (data-field firstName/otherNames/lastName/username +
// data-action saveNames), photo (#tf-photo + data-photo), signout.
const card = (inner: string, mt = 14) =>
  `<div style="margin:${mt}px 20px 0; border-radius:18px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); padding:18px;">${inner}</div>`;
const eyebrow = (t: string) => `<div style="font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#94A3B8;">${t}</div>`;
const field = (name: string, label: string, ph: string) =>
  `<label style="display:block; margin-top:14px; font-size:12.5px; font-weight:600; color:#334155;">${label}</label><input data-field="${name}" placeholder="${ph}" style="margin-top:6px; width:100%; box-sizing:border-box; height:50px; border-radius:12px; background:#F8FAFC; border:1px solid #E6EAF0; padding:0 14px; font-size:15px; color:#0F172A; outline:none;"/>`;
const toggle = (key: string, title: string, sub: string, on: boolean, last = false) =>
  `<div style="display:flex; align-items:center; gap:14px; padding:14px 0;${last ? "" : " border-bottom:1px solid #EEF2F6;"}"><div style="flex:1; min-width:0;"><div style="font-size:14px; font-weight:600; color:#0F172A;">${title}</div><div style="font-size:12px; color:#64748B; margin-top:2px; line-height:1.4;">${sub}</div></div><div class="navbtn" data-action="toggle" data-toggle="${key}" data-on="${on ? "1" : "0"}" style="width:40px; height:23px; border-radius:999px; background:${on ? "#059669" : "#CBD5E1"}; position:relative; flex-shrink:0; transition:background .2s cubic-bezier(.22,1,.36,1);"><div style="position:absolute; top:2px; left:${on ? "19px" : "2px"}; width:19px; height:19px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(15,23,42,.2); transition:left .2s cubic-bezier(.22,1,.36,1);"></div></div></div>`;

export const html = `<div class="fscroll" style="width:100%; min-height:100dvh; overflow-x:hidden; position:relative; background:#F8FAFC; color:#0F172A; padding-bottom:32px;">
          <div style="height:44px; display:flex; align-items:center; justify-content:space-between; padding:0 26px; font-size:13px; font-weight:600;"><span>9:41</span><span style="opacity:.5;">▂▃▄ ᯤ ▮</span></div>
          <div style="padding:8px 20px 0; display:flex; align-items:center; gap:14px;"><div class="navbtn" data-nav="dashboard" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" stroke="#0F172A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></div><h2 style="font-size:20px; font-weight:700; letter-spacing:-.02em;">Profile</h2></div>

          <!-- identity hero -->
          ${card(`
            <div style="display:flex; align-items:center; gap:15px;">
              <label style="position:relative; width:66px; height:66px; cursor:pointer; flex-shrink:0;">
                <div data-photo="photo" data-bind="initials" style="width:66px; height:66px; border-radius:50%; background:#0F172A; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; overflow:hidden;"></div>
                <div style="position:absolute; right:-2px; bottom:-2px; width:24px; height:24px; border-radius:50%; background:#059669; border:3px solid #fff; display:flex; align-items:center; justify-content:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
                <input id="tf-photo" type="file" accept="image/*" style="position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer;"/>
              </label>
              <div style="flex:1; min-width:0;">
                <div data-bind="name" style="font-size:19px; font-weight:700; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">&nbsp;</div>
                <div data-bind="email" style="font-size:12.5px; color:#64748B; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">—</div>
                <div style="margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; background:#ECFDF5; border:1px solid #C7F0DE; color:#047857; font-size:11px; font-weight:600; letter-spacing:.02em;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg><span data-bind="verifyPill">Identity</span></div>
              </div>
            </div>`)}

          <!-- trust score history -->
          ${card(`
            <div style="display:flex; align-items:flex-start; justify-content:space-between;">
              <div>${eyebrow("Trust Score")}<div data-bind="scoreBig" style="font-size:44px; font-weight:700; letter-spacing:-.03em; line-height:1; color:#059669; margin-top:6px; font-variant-numeric:tabular-nums;">—</div></div>
              <div style="text-align:right;"><div data-bind="scoreDelta" style="font-size:13px; font-weight:600; color:#059669;">&nbsp;</div><div data-bind="riskRange" style="font-size:12px; color:#64748B; margin-top:4px;">&nbsp;</div></div>
            </div>
            <div data-html="scoreChart" style="margin-top:14px;"></div>
            <div style="margin-top:12px; padding-top:14px; border-top:1px solid #EEF2F6; display:grid; grid-template-columns:repeat(3,1fr);">
              <div><div style="font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8;">Total</div><div data-bind="statTotal" style="font-size:20px; font-weight:700; margin-top:3px;">0</div></div>
              <div style="border-left:1px solid #EEF2F6; padding-left:14px;"><div style="font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8;">Successful</div><div data-bind="statSuccess" style="font-size:20px; font-weight:700; margin-top:3px;">0</div></div>
              <div style="border-left:1px solid #EEF2F6; padding-left:14px;"><div style="font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8;">Disputes</div><div data-bind="statDisputes" style="font-size:20px; font-weight:700; margin-top:3px;">0</div></div>
            </div>`)}

          <!-- payout account -->
          ${card(`
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;"><div style="font-size:15px; font-weight:700;">Payout account</div><span class="navbtn" data-nav="seller" style="font-size:12.5px; color:#059669; font-weight:600;">Manage</span></div>
            <div data-html="payoutCard"></div>
            <div style="margin-top:12px; font-size:12px; color:#64748B; line-height:1.5; display:flex; align-items:flex-start; gap:6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" style="flex-shrink:0; margin-top:1px;"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>Verified by the bank's account lookup. Payouts arrive in under 60 seconds.</div>`)}

          <!-- personal details (editable names) -->
          <div style="margin:22px 20px 0;">${eyebrow("Personal details")}</div>
          ${card(`
            <label style="font-size:12.5px; font-weight:600; color:#334155;">First name</label>
            <input data-field="firstName" placeholder="First name" style="margin-top:6px; width:100%; box-sizing:border-box; height:50px; border-radius:12px; background:#F8FAFC; border:1px solid #E6EAF0; padding:0 14px; font-size:15px; color:#0F172A; outline:none;"/>
            ${field("otherNames", "Other names", "Optional")}
            ${field("lastName", "Last name", "Last name")}
            ${field("username", "Username", "@yourhandle")}
            <p data-bind="err" style="margin:12px 0 0; font-size:12.5px; color:#DC2626; line-height:1.4;"></p>
            <p data-bind="lockNote" style="margin:8px 0 0; font-size:11.5px; color:#94A3B8; line-height:1.4;"></p>
            <div class="navbtn" data-action="saveNames" style="margin-top:14px; height:48px; border-radius:12px; background:#0F172A; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:14.5px; color:#fff;"><span data-bind="saveLabel">Save</span></div>
          `, 12)}

          <!-- identity verification -->
          <div style="margin:22px 20px 0;">${eyebrow("Identity verification")}</div>
          ${card(`<div data-html="verifyList"></div>`, 12)}

          <!-- preferences -->
          <div style="margin:22px 20px 0;">${eyebrow("Preferences")}</div>
          ${card(`
            ${toggle("email", "Email notifications", "Status changes, disputes, payouts.", true)}
            ${toggle("whatsapp", "WhatsApp updates", "A message when a buyer pays or a seller ships.", false)}
            ${toggle("twofa", "Two-factor auth", "Required to release funds over ₦500,000.", true)}
            ${toggle("autoconfirm", "Auto-confirm after 72h", "If delivered and you don't act, funds release automatically.", false, true)}
          `, 12)}

          <!-- danger zone -->
          <div style="margin:22px 20px 0;">${eyebrow("Account")}</div>
          <div class="navbtn" data-action="signout" style="margin:12px 20px 0; height:52px; border-radius:14px; background:#fff; border:1px solid #E6EAF0; box-shadow:0 1px 2px rgba(15,23,42,.05); display:flex; align-items:center; justify-content:center; gap:8px; font-weight:600; font-size:15px; color:#DC2626;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Sign out</div>
        </div>`;
