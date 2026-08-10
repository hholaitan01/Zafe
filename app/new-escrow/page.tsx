"use client";

/* New escrow — buyer creates a protected deal. Desktop keeps the imported
   design's structure: a form column (amount hero, item + category, seller,
   optional AI chat scan) beside a sticky summary sidebar that totals live. It
   stacks to a mobile column inside AppShell. Creating the deal runs the Trust
   Score if a chat was pasted, then goes to payment. Item + amount are required;
   the chat is optional. */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { cacheDeal, createDeal, naira, setCurrentDealId } from "@/lib/client";
import { feeBreakdown } from "@/lib/fees";

const CATEGORIES = ["Electronics", "Fashion", "Phones & tablets", "Gaming", "Inventory restock", "Services", "Other"];

function fmtMoney(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG");
}

export default function NewEscrowPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [seller, setSeller] = useState("");
  const [chat, setChat] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const amountNum = useMemo(() => Number(amount.replace(/[^0-9.]/g, "")) || 0, [amount]);
  const bill = useMemo(() => feeBreakdown(amountNum), [amountNum]);

  async function submit() {
    if (busy) return;
    if (amountNum <= 0 || !title.trim()) {
      setErr("Enter an amount and what you're buying to continue.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const me = await getCurrentUser().catch(() => null);
      const deal = await createDeal({
        item: { title: title.trim(), amount: amountNum, currency: "NGN" },
        seller: { name: seller.trim() || "Unknown seller", contact: seller.trim() || undefined },
        chat: chat.trim() || undefined,
        buyerEmail: me?.email,
      });
      cacheDeal(deal);
      setCurrentDealId(deal.id);
      router.push("/fund");
    } catch {
      setErr("Couldn't create the deal. Please try again.");
      setBusy(false);
    }
  }

  const canSubmit = amountNum > 0 && !!title.trim() && !busy;

  return (
    <AppShell current="new" user={{ name: "You", initials: "" }}>
      <style>{css}</style>

      <div className="tf-ph-head ne-head">
        <div><div className="tf-eyebrow">Protected deal</div><h1>New escrow</h1></div>
      </div>

      <div className="ne-wrap">
        <div className="ne-form">
          {/* amount hero */}
          <div className="tf-card ne-amount">
            <label className="ne-amount-label">Amount to protect</label>
            <div className="ne-amount-row">
              <span className="ne-naira">₦</span>
              <input inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(fmtMoney(e.target.value))} className="ne-amount-input tf-mono" />
            </div>
            <div className="ne-amount-fee">{amountNum > 0 ? `Escrow fee ${naira(bill.fee)}${bill.capped ? " (max)" : ""} + ${naira(bill.vat)} VAT` : "Escrow fee: 1% over ₦100,000 (max ₦5,000), or ₦1,000 flat below"}</div>
          </div>

          {/* item */}
          <div className="tf-card ne-sec">
            <div className="ne-sec-title">What are you buying?</div>
            <p className="ne-sec-sub">Be specific: model, colour, condition. The AI compares this to the chat to catch inconsistencies.</p>
            <label className="ne-label">Item description</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MacBook Air M2, Space Grey, 256GB" className="ne-input" />
            <label className="ne-label">Category</label>
            <div className="ne-select-wrap">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="ne-input ne-select">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <svg className="ne-select-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>

          {/* seller */}
          <div className="tf-card ne-sec">
            <div className="ne-sec-title">Who are you paying?</div>
            <p className="ne-sec-sub">We look up their Zafe standing and run the Trust Score. You&apos;ll see it before you pay.</p>
            <label className="ne-label">Seller @username, phone, or email</label>
            <input value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="@username, phone or seller@email.com" className="ne-input" />
          </div>

          {/* optional AI chat scan */}
          <div className="tf-card ne-sec">
            <div className="ne-scan-head">
              <span className="ne-scan-ic">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M7 12h10" /></svg>
              </span>
              <div><div className="ne-sec-title" style={{ marginBottom: 2 }}>Scan your chat for scams</div><p className="ne-sec-sub" style={{ margin: 0 }}>Optional. Paste it and our AI checks it first.</p></div>
            </div>
            <textarea value={chat} onChange={(e) => setChat(e.target.value)} placeholder="Paste your WhatsApp or Instagram chat with the seller…" className="ne-textarea" />
            <div className="ne-note">Nothing is stored beyond this transaction. Only the flags are saved.</div>
          </div>

          {err && <p className="ne-err">{err}</p>}

          <div className="ne-actions">
            <button className="tf-btn tf-btn--primary ne-cta" disabled={!canSubmit} onClick={() => void submit()}>
              {busy ? "Securing in escrow…" : amountNum > 0 ? `Continue to pay ${naira(bill.buyerPaysTotal)}` : "Continue to payment"}
              {!busy && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
            </button>
          </div>
        </div>

        {/* summary sidebar */}
        <aside className="ne-summary tf-card">
          <div className="tf-eyebrow">Summary</div>
          <div className="ne-sum-total tf-mono"><span>₦</span>{amountNum > 0 ? naira(amountNum).replace("₦", "") : "0"}</div>
          <div className="ne-sum-rule" />
          <div className="ne-sum-row"><span>Item</span><span>{title.trim() || "—"}</span></div>
          <div className="ne-sum-row"><span>Category</span><span>{category}</span></div>
          <div className="ne-sum-row"><span>Seller</span><span>{seller.trim() || "—"}</span></div>
          <div className="ne-sum-rule" />
          <div className="ne-sum-row"><span>Amount protected</span><span className="tf-mono">{naira(bill.amount)}</span></div>
          <div className="ne-sum-row"><span>Escrow fee{bill.capped ? " (capped)" : ""}</span><span className="tf-mono">{naira(bill.fee)}</span></div>
          <div className="ne-sum-row"><span>VAT (7.5%)</span><span className="tf-mono">{naira(bill.vat)}</span></div>
          <div className="ne-sum-row"><span>Transfer stamp duty</span><span className="tf-mono">{bill.stampDuty ? naira(bill.stampDuty) : "—"}</span></div>
          <div className="ne-sum-row ne-sum-pay"><span>You pay</span><span className="tf-mono">{naira(bill.buyerPaysTotal)}</span></div>
          <div className="ne-sum-row ne-sum-last"><span>Payout to seller</span><span>{naira(bill.amount)} on your confirm</span></div>
          <div className="ne-safe"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.9"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>Funds sit in a dedicated escrow account until you confirm delivery. We never touch them.</div>
        </aside>
      </div>
    </AppShell>
  );
}

const css = `
.ne-head{ display:none }
.ne-wrap{ display:flex; flex-direction:column; gap:16px }
.ne-form{ display:flex; flex-direction:column; gap:16px }

.ne-amount{ padding:18px }
.ne-amount-label{ font-size:12.5px; font-weight:600; color:var(--muted) }
.ne-amount-row{ margin-top:10px; display:flex; align-items:center; gap:6px }
.ne-naira{ font-size:34px; font-weight:700; color:var(--faint) }
.ne-amount-input{ flex:1; min-width:0; background:transparent; border:none; outline:none; color:var(--ink); font-size:34px; font-weight:700; letter-spacing:-.02em }
.ne-amount-fee{ margin-top:8px; font-size:12.5px; color:var(--muted) }

.ne-sec{ padding:18px }
.ne-sec-title{ font-size:15px; font-weight:700; letter-spacing:-.01em; margin-bottom:6px }
.ne-sec-sub{ font-size:12.5px; color:var(--muted); line-height:1.5; margin:0 0 14px }
.ne-label{ display:block; margin-top:14px; font-size:12.5px; font-weight:600; color:var(--ink-2) }
.ne-sec .ne-label:first-of-type{ margin-top:0 }
.ne-input{ margin-top:7px; width:100%; box-sizing:border-box; height:52px; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:0 14px; font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:border-color .16s var(--ease) }
.ne-input:focus{ border-color:var(--safe) }
.ne-select-wrap{ position:relative }
.ne-select{ appearance:none; -webkit-appearance:none; padding-right:40px; cursor:pointer }
.ne-select-caret{ position:absolute; right:14px; top:50%; transform:translateY(-25%); pointer-events:none }

.ne-scan-head{ display:flex; align-items:flex-start; gap:11px; margin-bottom:12px }
.ne-scan-ic{ width:32px; height:32px; border-radius:9px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.ne-textarea{ width:100%; box-sizing:border-box; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:13px; min-height:104px; font-size:14px; line-height:1.55; color:var(--ink); outline:none; resize:vertical; font-family:inherit; transition:border-color .16s var(--ease) }
.ne-textarea:focus{ border-color:var(--safe) }
.ne-note{ margin-top:9px; font-size:12px; color:var(--faint); line-height:1.4 }

.ne-err{ font-size:13px; color:var(--danger); font-weight:500; line-height:1.4 }
.ne-actions{ display:flex; gap:12px }
.ne-cta{ flex:1; height:56px; font-size:16px }
.ne-cta:disabled{ opacity:.45; cursor:not-allowed }

.ne-summary{ padding:20px; display:flex; flex-direction:column; gap:12px }
.ne-sum-total{ font-size:30px; font-weight:700; letter-spacing:-.03em; line-height:1 } .ne-sum-total span{ color:var(--faint); font-size:20px; margin-right:4px }
.ne-sum-rule{ height:1px; background:var(--line) }
.ne-sum-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:13px; padding:2px 0 }
.ne-sum-row span:first-child{ color:var(--muted); flex-shrink:0 }
.ne-sum-row span:last-child{ font-weight:600; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0 }
.ne-sum-pay{ margin-top:4px; padding-top:8px; border-top:1px solid var(--line) }
.ne-sum-pay span:first-child{ color:var(--ink); font-weight:700 } .ne-sum-pay span:last-child{ font-size:15px; font-weight:800 }
.ne-safe{ margin-top:4px; background:var(--bg); border-radius:12px; padding:12px; font-size:12px; line-height:1.5; color:var(--muted); display:flex; align-items:flex-start; gap:7px } .ne-safe svg{ flex-shrink:0; margin-top:1px }

@media (min-width:1024px){
  .ne-head{ display:flex }
  .ne-wrap{ display:grid; grid-template-columns:1fr 340px; gap:28px; align-items:start }
  .ne-form{ gap:18px }
  .ne-sec, .ne-amount{ padding:22px }
  .ne-summary{ position:sticky; top:88px }
}
`;
