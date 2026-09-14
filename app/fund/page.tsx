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

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CheckIcon, type CheckIconHandle } from "@animateicons/react/lucide/check-icon";
import AppShell from "@/app/_lib/AppShell";
import { createEscrowAccount, getCurrentDealId, getDeal, getSellerStanding, naira } from "@/lib/client";
import type { CollectionAccount } from "@/lib/payments";
import { computeFee } from "@/lib/payments/fee";
import type { Deal } from "@/lib/deals/types";
import type { SellerStanding, StandingTone } from "@/lib/seller/standing";

/* Seller standing reads emerald when good, calm grey otherwise. No red here —
   this is a reputation summary, not an active danger prompt. */
const TONE: Record<StandingTone, "pos" | "neutral"> = {
  good: "pos",
  neutral: "neutral",
  warn: "neutral",
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
  if (!t) return { tone: "neutral", icon: <Info />, title: "No chat scanned", body: "You didn't paste a chat, so we couldn't check for scam signs. The escrow still protects your money." };
  if (t.verdict === "safe") return { tone: "pos", icon: <Shield />, title: `Looks safe · Trust Score ${t.score}/100`, body: t.headline };
  if (t.verdict === "caution") return { tone: "neutral", icon: <Warn />, title: `Be careful · Trust Score ${t.score}/100`, body: t.headline };
  // The one place red stays: an active scam warning on the money-moving screen.
  return { tone: "danger", icon: <Warn />, title: `Scam signs detected · Trust Score ${t.score}/100`, body: t.headline };
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
  // The payment overlay: "confirm" = a review sheet before we move money;
  // "sent" = the held-safe confirmation. "none" while paying inline (live VA).
  const [sheet, setSheet] = useState<"none" | "confirm" | "sent">("none");
  const checkRef = useRef<CheckIconHandle>(null);

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

  // Draw the check once the success sheet mounts.
  useEffect(() => {
    if (sheet === "sent") {
      const t = setTimeout(() => checkRef.current?.startAnimation(), 60);
      return () => clearTimeout(t);
    }
  }, [sheet]);

  // Open the review sheet. The risk gate stays in front of it: a flagged deal
  // must be acknowledged before we'll even show Confirm.
  function openConfirm() {
    if (busy) return;
    if (risky && !acked) { setNudge(true); return; }
    setError("");
    setSheet("confirm");
  }

  // Confirm tapped inside the sheet: this is where money actually moves.
  async function confirmPay() {
    if (busy) return;
    const id = getCurrentDealId();
    if (!id) { router.push("/locked"); return; }
    setBusy(true);
    setError("");
    const res = await createEscrowAccount(id).catch(() => null);
    if (res?.funded) { setBusy(false); setSheet("sent"); return; } // demo: server funded it
    if (!res) { setError("Couldn't start the payment just now. Please try again."); setBusy(false); return; }
    // Live: close the sheet and show the account to transfer into; a verified
    // webhook marks it funded and the button below re-checks status.
    setAcct(res.account);
    setBusy(false);
    setSheet("none");
  }

  // Live mode, account already shown: re-check whether the webhook confirmed.
  async function checkStatus() {
    if (busy) return;
    const id = getCurrentDealId();
    if (!id) { router.push("/locked"); return; }
    setBusy(true);
    setError("");
    const d = await getDeal(id).catch(() => null);
    if (d && d.status !== "created") { router.push("/locked"); return; }
    setWaitNote(true);
    setBusy(false);
  }

  function copyAcct(n: string) {
    navigator.clipboard?.writeText(n).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }).catch(() => {});
  }

  const buyerFee = deal ? computeFee(deal.item.amount).buyerShare : 0;
  const totalDue = acct?.amountDue ?? (deal ? deal.item.amount + buyerFee : 0);
  const amount = deal ? naira(totalDue) : "—";
  const banner = deal ? trustBanner(deal) : null;
  const payLabel = busy ? "Working…" : awaiting ? "I've transferred, check status" : deal ? `Pay ${amount} into escrow` : "Pay into escrow";

  return (
    <AppShell darkAware current="new" user={{ name: "You", initials: "" }}>
      <style>{css}</style>

      <div className="tf-ph-head fn-head">
        <div><div className="tf-eyebrow">Payment</div><h1>Pay into escrow</h1></div>
      </div>

      <div className="fn-wrap">
        <div className="fn-main">
          {banner && (
            <div className={`fn-banner fn-banner--${banner.tone}`}>
              <span className="fn-banner-ic">{banner.icon}</span>
              <div><div className="fn-banner-title">{banner.title}</div><div className="fn-banner-body">{banner.body}</div></div>
            </div>
          )}

          {standing && (
            <div className={`tf-card fn-standing fn-standing--${TONE[standing.tone]}`}>
              <div className="fn-standing-top">
                <span className="fn-standing-label">{standing.tone === "good" ? <Shield /> : standing.tone === "warn" ? <Warn /> : <Info />}{standing.label}</span>
                <span className={`fn-badge fn-badge--${standing.verified ? "on" : "off"}`}>{standing.verified ? "VERIFIED" : "UNVERIFIED"}</span>
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
                  <div className="fn-method-txt"><div className="fn-method-title">Bank transfer</div><div className="fn-method-sub">Pay to a dedicated escrow account.</div></div>
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
          <div className="fn-sum-amt tf-mono"><span>₦</span>{deal ? naira(totalDue).replace("₦", "") : "—"}</div>
          <div className="fn-sum-rule" />
          <div className="fn-sum-row"><span>Item price</span><span>{deal ? naira(deal.item.amount) : "—"}</span></div>
          <div className="fn-sum-row"><span>Escrow fee (your half)</span><span>{deal ? naira(buyerFee) : "—"}</span></div>
          <div className="fn-sum-row"><span>Item</span><span>{deal?.item.title || "—"}</span></div>
          <div className="fn-sum-row"><span>Seller</span><span>{deal?.seller?.name || "—"}</span></div>
          <div className="fn-sum-row fn-sum-last"><span>Released</span><span>On your confirm</span></div>
          <button className="tf-btn tf-btn--verify fn-pay-btn" disabled={busy || !deal} onClick={() => (awaiting ? void checkStatus() : openConfirm())}>
            {!busy && !awaiting && <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" /></svg>}
            {payLabel}
          </button>
          <div className="fn-safe"><Shield size={13} />Money is held safe. Encrypted end to end.</div>
        </aside>
      </div>

      {sheet !== "none" && createPortal(
        <div className="pm-scrim" onClick={() => { if (busy) return; sheet === "sent" ? router.push("/locked") : setSheet("none"); }}>
          <div className="pm-sheet" role="dialog" aria-modal="true" aria-label={sheet === "confirm" ? "Confirm payment" : "Payment secured"} onClick={(e) => e.stopPropagation()}>
            {sheet === "confirm" ? (
              <>
                <div className="pm-head">
                  <div className="pm-title">Confirm payment</div>
                  <button className="pm-x" aria-label="Close" onClick={() => !busy && setSheet("none")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </div>

                <div className="pm-method">
                  <span className="pm-method-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M4 10h16M5 10 12 4l7 6M6 10v11M18 10v11M10 10v11M14 10v11" /></svg></span>
                  <div><div className="pm-method-t">Bank transfer</div><div className="pm-method-s">Into a dedicated escrow account</div></div>
                </div>

                <div className="pm-sum">
                  <div className="pm-sum-h">Summary</div>
                  <div className="pm-row"><span>Paying</span><span>{deal?.item.title || "Escrow deal"}</span></div>
                  <div className="pm-row"><span>To</span><span>{deal?.seller?.name || "Seller"}, in escrow</span></div>
                  <div className="pm-row"><span>Escrow fee (your half)</span><span className="tf-mono">{deal ? naira(buyerFee) : "—"}</span></div>
                  <div className="pm-row pm-total"><span>Total</span><span className="tf-mono">{amount}</span></div>
                </div>

                {error && <p className="pm-err" role="alert">{error}</p>}

                <button className="pm-cta" disabled={busy} onClick={() => void confirmPay()}>
                  {busy ? <span className="pm-spin" aria-hidden /> : null}
                  {busy ? "Confirming…" : "Confirm payment"}
                </button>
                <div className="pm-safe">
                  <Shield size={13} />Held safe. Released only when you confirm delivery.
                </div>
              </>
            ) : (
              <>
                <div className="pm-done-ic" aria-hidden>
                  <CheckIcon ref={checkRef} size={34} color="#ffffff" duration={0.55} />
                </div>
                <div className="pm-done-t">Payment secured</div>
                <p className="pm-done-s">Your <b>{amount}</b> is held safe in escrow. The seller can ship now. It&apos;s released only when you confirm the item arrived.</p>
                <button className="pm-cta" onClick={() => router.push("/locked")}>View my escrow</button>
                <button className="pm-alt" onClick={() => router.push("/dashboard")}>Back to home</button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
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
.fn-banner-body{ font-size:12.5px; line-height:1.5; margin-top:3px; opacity:.85 }
.fn-banner--pos{ background:var(--safe-tint); border-color:rgba(5,150,105,.22); color:var(--safe-2) }
.fn-banner--neutral{ background:var(--line-2); border-color:var(--line); color:var(--ink-2) }
.fn-banner--danger{ background:#FEF2F2; border-color:#FECACA; color:#B91C1C }

.fn-standing{ padding:14px }
.fn-standing--pos{ color:var(--safe-2) } .fn-standing--neutral{ color:var(--ink-2) }
.fn-standing-top{ display:flex; align-items:center; justify-content:space-between; gap:8px }
.fn-standing-label{ display:inline-flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700 }
.fn-badge{ font-size:10px; font-weight:700; padding:2px 7px; border-radius:6px; border:1px solid; letter-spacing:.04em }
.fn-badge--on{ color:var(--safe-2); background:var(--safe-tint); border-color:rgba(5,150,105,.28) }
.fn-badge--off{ color:var(--muted); background:var(--line-2); border-color:var(--line) }
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
.fn-copy{ font-size:12px; font-weight:600; color:var(--ink); background:var(--card); border:1px solid var(--line); border-radius:8px; padding:5px 10px; cursor:pointer } .fn-copy:hover{ border-color:#CBD5E1 }
.fn-wait{ margin-top:8px; font-size:12px; color:var(--ink-2); font-weight:600 }

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

/* ---- payment overlay: confirm sheet + secured card ---- */
.pm-scrim{ position:fixed; inset:0; z-index:70; background:rgba(8,15,30,.55);
  backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px);
  display:flex; align-items:flex-end; justify-content:center; animation:pmFade .22s var(--ease) both }
.pm-sheet{ width:100%; max-width:460px; background:var(--card); color:var(--ink);
  border-radius:24px 24px 0 0; padding:20px 20px calc(22px + env(safe-area-inset-bottom,0px));
  box-shadow:0 -22px 50px -20px rgba(8,15,30,.45); animation:pmUp .34s var(--ease) both }
.pm-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px }
.pm-title{ font-size:18px; font-weight:700; letter-spacing:-.01em }
.pm-x{ width:34px; height:34px; border-radius:50%; border:none; background:var(--line-2); color:var(--ink-2);
  display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .16s var(--ease) }
.pm-x:hover{ background:var(--line) }
.pm-method{ display:flex; align-items:center; gap:12px; padding:13px; border-radius:14px; background:var(--safe-tint); border:1px solid rgba(5,150,105,.18) }
.pm-method-ic{ width:38px; height:38px; border-radius:11px; background:var(--safe); display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.pm-method-t{ font-size:14px; font-weight:600 }
.pm-method-s{ font-size:12px; color:var(--muted); margin-top:1px }
.pm-sum{ margin-top:14px; border:1px solid var(--line); border-radius:14px; padding:13px 15px }
.pm-sum-h{ font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--faint,#94A3B8); margin-bottom:8px }
.pm-row{ display:flex; align-items:center; justify-content:space-between; gap:14px; font-size:13.5px; padding:6px 0 }
.pm-row span:first-child{ color:var(--muted); flex-shrink:0 }
.pm-row span:last-child{ font-weight:600; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0 }
.pm-total{ margin-top:4px; padding-top:11px; border-top:1px solid var(--line); font-size:15px }
.pm-total span:last-child{ font-weight:800 }
.pm-err{ margin-top:12px; font-size:13px; font-weight:500; color:var(--danger); background:#FEF2F2; border:1px solid #FECACA; border-radius:12px; padding:11px 13px }
.pm-cta{ width:100%; height:54px; margin-top:16px; border:none; border-radius:14px; background:var(--safe); color:#fff;
  font-family:inherit; font-size:15.5px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:9px;
  box-shadow:0 12px 24px -12px rgba(5,150,105,.55); transition:transform .12s var(--ease), background .18s var(--ease) }
.pm-cta:hover{ background:var(--safe-2) }
.pm-cta:active{ transform:scale(.99) }
.pm-cta:disabled{ opacity:.6; cursor:not-allowed }
.pm-spin{ width:16px; height:16px; border-radius:50%; border:2px solid rgba(255,255,255,.4); border-top-color:#fff; animation:pmSpin .6s linear infinite }
.pm-safe{ display:flex; align-items:center; justify-content:center; gap:7px; margin-top:12px; font-size:12px; color:var(--muted) }
.pm-alt{ width:100%; height:46px; margin-top:6px; border:none; background:transparent; color:var(--ink-2); font-family:inherit; font-size:14px; font-weight:600; cursor:pointer }
.pm-alt:hover{ color:var(--ink) }
/* secured (sent) state */
.pm-done-ic{ width:72px; height:72px; margin:8px auto 0; border-radius:50%; background:var(--safe);
  display:flex; align-items:center; justify-content:center; box-shadow:0 16px 32px -12px rgba(5,150,105,.6); animation:pmPop .42s var(--ease) both }
.pm-done-ic > div{ display:flex; align-items:center; justify-content:center }
.pm-done-t{ text-align:center; margin-top:16px; font-size:20px; font-weight:800; letter-spacing:-.02em }
.pm-done-s{ text-align:center; margin:8px auto 0; font-size:14px; line-height:1.6; color:var(--muted); max-width:34ch }
.pm-done-s b{ color:var(--ink); font-weight:700 }

@keyframes pmFade{ from{ opacity:0 } to{ opacity:1 } }
@keyframes pmUp{ from{ transform:translateY(100%) } to{ transform:none } }
@keyframes pmPop{ from{ transform:scale(.5); opacity:0 } to{ transform:scale(1); opacity:1 } }
@keyframes pmSpin{ to{ transform:rotate(360deg) } }

@media (min-width:1024px){
  .pm-scrim{ align-items:center; padding:24px }
  .pm-sheet{ border-radius:22px; max-width:420px; padding:24px; animation:pmPopIn .3s var(--ease) both }
}
@keyframes pmPopIn{ from{ opacity:0; transform:translateY(10px) scale(.98) } to{ opacity:1; transform:none } }

@media (prefers-reduced-motion:reduce){
  .pm-scrim, .pm-sheet, .pm-done-ic{ animation:none }
  .pm-spin{ animation-duration:1s }
}
`;
