"use client";

/* Payment — the buyer funds the escrow here. Desktop keeps a checkout structure:
   a left column with the AI scam/Trust banner (from the pasted chat), the
   seller's standing, and the payment method / account, beside a sticky order
   summary carrying the amount and the Pay button. It stacks to a mobile column
   inside AppShell.

   The money-safety logic is unchanged: a risky deal needs the acknowledgement
   ticked; the SERVER funds the deal in demo mode; in live mode we only show the
   account to transfer into and never mark the deal funded ourselves — a
   verified webhook does that, and the button re-checks status. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_lib/AppShell";
import { createEscrowAccount, getCurrentDealId, getDeal, getSellerStanding, naira } from "@/lib/client";
import type { CollectionAccount } from "@/lib/payments";
import type { Deal } from "@/lib/deals/types";
import type { SellerStanding, StandingTone } from "@/lib/seller/standing";

const TONE: Record<StandingTone, { fg: string; bg: string; bd: string }> = {
  good: { fg: "#047857", bg: "#ECFDF5", bd: "#C7F0DE" },
  neutral: { fg: "#475569", bg: "#F1F5F9", bd: "#E2E8F0" },
  warn: { fg: "#B91C1C", bg: "#FEE2E2", bd: "#FCA5A5" },
};

function Shield({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function Warn({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>;
}
function Info({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>;
}

function trustBanner(deal: Deal) {
  const t = deal.trust;
  if (!t) return { fg: "#475569", bg: "#F1F5F9", icon: <Info />, title: "No chat scanned", body: "You didn't paste a chat, so we couldn't check for scam signs. The escrow still protects your money." };
  if (t.verdict === "safe") return { fg: "#047857", bg: "#ECFDF5", icon: <Shield />, title: `Looks safe · Trust Score ${t.score}/100`, body: t.headline };
  if (t.verdict === "caution") return { fg: "#B45309", bg: "#FEF3C7", icon: <Warn />, title: `Be careful · Trust Score ${t.score}/100`, body: t.headline };
  return { fg: "#DC2626", bg: "#FEE2E2", icon: <Warn />, title: `Scam signs detected · Trust Score ${t.score}/100`, body: t.headline };
}

export default function FundPage() {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [standing, setStanding] = useState<SellerStanding | null>(null);
  const [acked, setAcked] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [acct, setAcct] = useState<CollectionAccount | null>(null);
  const [waitNote, setWaitNote] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = getCurrentDealId();
    if (!id) return;
    let alive = true;
    (async () => {
      const d = await getDeal(id).catch(() => null);
      if (!d || !alive) return;
      setDeal(d);
      const contact = d.seller?.contact;
      if (contact) {
        const st = await getSellerStanding(contact).catch(() => null);
        if (st && alive) setStanding(st);
      }
    })();
    return () => { alive = false; };
  }, []);

  const risky = deal?.trust?.verdict === "risky";
  const awaiting = !!acct;

  async function fund() {
    if (busy) return;
    if (risky && !acked) { setNudge(true); return; }
    const id = getCurrentDealId();
    if (!id) { router.push("/locked"); return; }
    setBusy(true);
    setError("");

    // Live mode, account already shown: re-check whether the webhook confirmed.
    if (awaiting) {
      const d = await getDeal(id).catch(() => null);
      if (d && d.status !== "created") { router.push("/locked"); return; }
      setWaitNote(true);
      setBusy(false);
      return;
    }

    const res = await createEscrowAccount(id).catch(() => null);
    if (res?.funded) { router.push("/locked"); return; } // demo: server funded it
    if (!res) { setError("Couldn't start the payment just now. Please try again."); setBusy(false); return; }
    // Live: show the account and wait for the verified webhook.
    setAcct(res.account);
    setBusy(false);
  }

  function copyAcct(n: string) {
    navigator.clipboard?.writeText(n).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }).catch(() => {});
  }

  const amount = deal ? naira(deal.item.amount) : "—";
  const banner = deal ? trustBanner(deal) : null;
  const payLabel = busy ? "Working…" : awaiting ? "I've transferred, check status" : deal ? `Pay ${amount} into escrow` : "Pay into escrow";

  return (
    <AppShell current="new" user={{ name: "You", initials: "" }}>
      <style>{css}</style>

      <div className="tf-ph-head fn-head">
        <div><div className="tf-eyebrow">Payment</div><h1>Pay into escrow</h1></div>
      </div>

      <div className="fn-wrap">
        <div className="fn-main">
          {banner && (
            <div className="fn-banner" style={{ background: banner.bg, borderColor: `${banner.fg}33`, color: banner.fg }}>
              <span className="fn-banner-ic">{banner.icon}</span>
              <div><div className="fn-banner-title">{banner.title}</div><div className="fn-banner-body">{banner.body}</div></div>
            </div>
          )}

          {standing && (
            <div className="tf-card fn-standing" style={{ color: TONE[standing.tone].fg }}>
              <div className="fn-standing-top">
                <span className="fn-standing-label">{standing.tone === "good" ? <Shield /> : standing.tone === "warn" ? <Warn /> : <Info />}{standing.label}</span>
                <span className="fn-badge" style={standing.verified ? { color: "#047857", background: "#ECFDF5", borderColor: "#C7F0DE" } : { color: "#64748B", background: "#F1F5F9", borderColor: "#E2E8F0" }}>{standing.verified ? "VERIFIED" : "UNVERIFIED"}</span>
              </div>
              <div className="fn-standing-detail">{standing.detail}</div>
            </div>
          )}

          <div className="tf-card fn-pay">
            {!awaiting ? (
              <>
                <div className="tf-eyebrow">Payment method</div>
                <div className="fn-method is-on">
                  <span className="fn-method-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M4 10h16M5 10 12 4l7 6M6 10v11M18 10v11M10 10v11M14 10v11" /></svg></span>
                  <div className="fn-method-txt"><div className="fn-method-title">Bank transfer</div><div className="fn-method-sub">Pay to a dedicated escrow account. No fee.</div></div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p className="fn-method-note">On &ldquo;Pay&rdquo;, we open a one-time escrow account for this deal. Your money is held safe and only released when you confirm delivery.</p>
              </>
            ) : (
              <>
                <div className="tf-eyebrow">Send a transfer to this account</div>
                <div className="fn-va">
                  <div className="fn-va-row"><span className="fn-va-k">Bank</span><span className="fn-va-v">{acct.bankName}</span></div>
                  <div className="fn-va-row"><span className="fn-va-k">Account number</span><span className="fn-va-copy"><span className="fn-va-v tf-mono">{acct.accountNumber}</span><button className="fn-copy" onClick={() => copyAcct(acct.accountNumber)}>{copied ? "Copied" : "Copy"}</button></span></div>
                  <div className="fn-va-row"><span className="fn-va-k">Account name</span><span className="fn-va-v tf-mono">{deal?.reference ? `TRUSTFLOW / ${deal.reference}` : "TRUSTFLOW"}</span></div>
                  <div className="fn-va-row"><span className="fn-va-k">Amount</span><span className="fn-va-v tf-mono">{amount}</span></div>
                </div>
                <p className="fn-method-note">This one-time account expires shortly. We confirm your payment automatically once it lands. No screenshot needed.</p>
                {waitNote && <p className="fn-wait">Payment not received yet. Give it a moment after transferring, then check again.</p>}
              </>
            )}
          </div>

          {risky && (
            <>
              <button className={`fn-ack${acked ? " is-on" : ""}`} onClick={() => { setAcked((v) => !v); setNudge(false); }}>
                <span className="fn-ack-box">{acked && <svg width="13" height="13" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3.2" fill="none"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                I understand the risk, pay anyway
              </button>
              {nudge && !acked && <p className="fn-nudge">Tick the box to confirm before paying.</p>}
            </>
          )}

          {error && <p className="fn-error">{error}</p>}
        </div>

        {/* order summary */}
        <aside className="fn-summary tf-card">
          <div className="tf-eyebrow">Pay into escrow</div>
          <div className="fn-sum-amt tf-mono"><span>₦</span>{deal ? naira(deal.item.amount).replace("₦", "") : "—"}</div>
          <div className="fn-sum-rule" />
          <div className="fn-sum-row"><span>Item</span><span>{deal?.item.title || "—"}</span></div>
          <div className="fn-sum-row"><span>Seller</span><span>{deal?.seller?.name || "—"}</span></div>
          <div className="fn-sum-row fn-sum-last"><span>Released</span><span>On your confirm</span></div>
          <button className="tf-btn tf-btn--verify fn-pay-btn" disabled={busy || !deal} onClick={() => void fund()}>
            {!busy && !awaiting && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" /></svg>}
            {payLabel}
          </button>
          <div className="fn-safe"><Shield size={13} />Money is held safe. Encrypted end to end.</div>
        </aside>
      </div>
    </AppShell>
  );
}

const css = `
.fn-head{ display:none }
.fn-wrap{ display:flex; flex-direction:column; gap:16px }
.fn-main{ display:flex; flex-direction:column; gap:14px }

.fn-banner{ border:1px solid; border-radius:14px; padding:14px; display:flex; gap:11px }
.fn-banner-ic{ flex-shrink:0; margin-top:1px }
.fn-banner-title{ font-size:13.5px; font-weight:700; letter-spacing:-.01em }
.fn-banner-body{ font-size:12.5px; color:var(--ink-2); line-height:1.5; margin-top:3px }

.fn-standing{ padding:14px }
.fn-standing-top{ display:flex; align-items:center; justify-content:space-between; gap:8px }
.fn-standing-label{ display:inline-flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700 }
.fn-badge{ font-size:10px; font-weight:700; padding:2px 7px; border-radius:6px; border:1px solid; letter-spacing:.04em }
.fn-standing-detail{ font-size:12.5px; color:var(--muted); line-height:1.5; margin-top:6px }

.fn-pay{ padding:18px }
.fn-method{ margin-top:12px; display:grid; grid-template-columns:44px 1fr auto; gap:12px; align-items:center; padding:14px; border-radius:14px; border:1.5px solid var(--safe); background:var(--safe-tint) }
.fn-method-ic{ width:44px; height:44px; border-radius:11px; background:var(--safe); display:flex; align-items:center; justify-content:center }
.fn-method-title{ font-size:14px; font-weight:600 }
.fn-method-sub{ font-size:12px; color:var(--muted); margin-top:2px }
.fn-method-note{ font-size:12.5px; color:var(--muted); line-height:1.55; margin-top:12px }

.fn-va{ margin-top:12px; border:1px solid var(--line); border-radius:14px; background:var(--bg); padding:16px; display:flex; flex-direction:column; gap:11px }
.fn-va-row{ display:flex; align-items:center; justify-content:space-between; gap:10px }
.fn-va-k{ font-size:12.5px; color:var(--muted) }
.fn-va-v{ font-size:14px; font-weight:600; color:var(--ink); text-align:right }
.fn-va-copy{ display:flex; align-items:center; gap:8px }
.fn-copy{ font-size:12px; font-weight:600; color:var(--ink); background:#fff; border:1px solid var(--line); border-radius:8px; padding:5px 10px; cursor:pointer } .fn-copy:hover{ border-color:#CBD5E1 }
.fn-wait{ margin-top:8px; font-size:12px; color:#B45309; font-weight:600 }

.fn-ack{ width:100%; text-align:left; font-family:inherit; border-radius:14px; background:#FEF2F2; border:1px solid #FECACA; padding:13px 14px; display:flex; align-items:center; gap:11px; font-size:13px; font-weight:600; color:#B91C1C; cursor:pointer }
.fn-ack-box{ width:22px; height:22px; border-radius:7px; border:2px solid #DC2626; background:#fff; flex-shrink:0; display:flex; align-items:center; justify-content:center }
.fn-ack.is-on .fn-ack-box{ background:#DC2626; border-color:#DC2626 }
.fn-nudge{ font-size:11.5px; color:#DC2626; font-weight:600; margin-top:8px }
.fn-error{ font-size:13px; color:var(--danger); font-weight:500; line-height:1.5; background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; padding:12px 14px }

.fn-summary{ padding:20px; display:flex; flex-direction:column; gap:12px }
.fn-sum-amt{ font-size:36px; font-weight:700; letter-spacing:-.03em; line-height:1 } .fn-sum-amt span{ color:var(--faint); font-size:22px; margin-right:1px }
.fn-sum-rule{ height:1px; background:var(--line) }
.fn-sum-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:13px; padding:2px 0 }
.fn-sum-row span:first-child{ color:var(--muted); flex-shrink:0 }
.fn-sum-row span:last-child{ font-weight:600; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0 }
.fn-pay-btn{ margin-top:6px; height:54px; font-size:15.5px; width:100% }
.fn-pay-btn:disabled{ opacity:.55; cursor:not-allowed }
.fn-safe{ font-size:12px; color:var(--muted); display:flex; align-items:center; gap:7px; justify-content:center }

@media (min-width:1024px){
  .fn-head{ display:flex }
  .fn-wrap{ display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start }
  .fn-main{ gap:16px }
  .fn-pay{ padding:22px }
  .fn-summary{ position:sticky; top:88px }
}
`;
