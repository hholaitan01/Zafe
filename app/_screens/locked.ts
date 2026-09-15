// "Payment secured" — the escrow-secured screen the buyer lands on after paying.
// Light emerald/white system, modelled on a clean payment-success layout: a
// check emblem, the held amount, the escrow reference, and a row of actions
// (receipt, track, share). Hooks: data-bind amount / escrowId, data-nav
// receipt|timeline|dashboard, data-action shareReceipt.
const card = "background:#fff; border:1px solid #E6EAF0; border-radius:16px; box-shadow:0 1px 2px rgba(15,23,42,.05);";
const tile = "width:44px; height:44px; border-radius:12px; background:#ECFDF5; display:flex; align-items:center; justify-content:center; margin:0 auto;";

export const html = `<div style="width:100%; min-height:100dvh; background:#F8FAFC; color:#0F172A; display:flex; flex-direction:column; font-family:'Plus Jakarta Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased;">
          <div style="display:flex; align-items:center; justify-content:flex-end; padding:14px 20px 4px;">
            <div class="navbtn" data-nav="dashboard" style="color:#059669; font-weight:700; font-size:15.5px; padding:6px 4px;">Done</div>
          </div>

          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:14px 26px 0;">
            <div style="width:76px; height:76px; border-radius:50%; background:#059669; display:flex; align-items:center; justify-content:center; box-shadow:0 18px 36px -14px rgba(5,150,105,.55); animation:tfPop .45s cubic-bezier(.22,1,.36,1) both;">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <div style="margin-top:16px; font-size:21px; font-weight:800; letter-spacing:-.02em;">Payment secured</div>
            <div data-bind="amount" class="tf-mono" style="margin-top:8px; font-size:38px; font-weight:800; letter-spacing:-.03em; line-height:1; font-variant-numeric:tabular-nums;">&#8358;0</div>
            <p style="margin-top:10px; font-size:14px; line-height:1.55; color:#64748B; max-width:30ch;">Held safe in escrow. Released only when <b style="color:#0F172A; font-weight:700;">you</b> confirm the item arrived.</p>
          </div>

          <div style="margin:22px 20px 0; ${card} padding:15px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <span style="font-size:14px; font-weight:600; color:#334155;">Escrow reference</span>
            <span data-bind="escrowId" class="tf-mono" style="font-size:14px; font-weight:700; color:#047857;">TF</span>
          </div>

          <div style="margin:12px 20px 0; display:grid; grid-template-columns:repeat(3,1fr); gap:12px;">
            <div class="navbtn" data-nav="receipt" style="${card} padding:16px 8px; display:flex; flex-direction:column; align-items:center; gap:9px;">
              <span style="${tile}"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-2.7-1.6L14 21l-2-1.4L10 21l-2.3-1.6L5 21z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg></span>
              <span style="font-size:12.5px; font-weight:600; color:#0F172A;">Receipt</span>
            </div>
            <div class="navbtn" data-nav="timeline" style="${card} padding:16px 8px; display:flex; flex-direction:column; align-items:center; gap:9px;">
              <span style="${tile}"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8"/><path d="M11 6h8M11 18h8M11 12h5"/></svg></span>
              <span style="font-size:12.5px; font-weight:600; color:#0F172A;">Track deal</span>
            </div>
            <div class="navbtn" data-action="shareReceipt" style="${card} padding:16px 8px; display:flex; flex-direction:column; align-items:center; gap:9px;">
              <span style="${tile}"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg></span>
              <span style="font-size:12.5px; font-weight:600; color:#0F172A;">Share</span>
            </div>
          </div>
        </div>`;
