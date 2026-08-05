"use client";

/* Request a payment — seller-initiated escrow. The seller enters the item,
   amount, and buyer contact; we create the deal with the signed-in user as the
   seller and the entered contact as the buyer, then return to My sales. Rebuilt
   as a responsive React page inside the app shell. */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "@/app/_lib/Toast";
import { getSellerProfile, naira, requestPayment } from "@/lib/client";

function fmtMoney(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits).toLocaleString("en-NG") : "";
}

export default function RequestPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [buyer, setBuyer] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shell, setShell] = useState({ name: "You", initials: "" });

  useEffect(() => {
    getCurrentUser().then((u) => {
      const nm = u?.name || (u?.email ? u.email.split("@")[0] : "You");
      setShell({ name: nm, initials: nm.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?" });
    }).catch(() => {});
  }, []);

  const amountNum = useMemo(() => Number(amount.replace(/[^0-9.]/g, "")) || 0, [amount]);

  async function submit() {
    if (busy) return;
    if (amountNum <= 0 || !title.trim() || !buyer.trim()) {
      setErr("Enter an amount, what you're selling, and the buyer's phone or email.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const me = await getCurrentUser().catch(() => null);
      const profile = getSellerProfile();
      await requestPayment({
        item: { title: title.trim(), amount: amountNum, currency: "NGN" },
        seller: { name: profile?.fullName || me?.name || "Seller", contact: me?.email },
        buyerEmail: buyer.trim(),
      });
      toast.success("Payment request sent");
      router.push("/selling");
    } catch {
      const msg = "Couldn't send the request. Please try again.";
      setErr(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  const canSubmit = amountNum > 0 && !!title.trim() && !!buyer.trim() && !busy;

  return (
    <AppShell current="new" user={{ name: shell.name, initials: shell.initials }}>
      <style>{css}</style>

      <div className="tf-ph-head rq-head">
        <div><Link href="/selling" className="rq-back">← My sales</Link><h1>Request a payment</h1></div>
      </div>
      <Link href="/selling" className="rq-back rq-back-m">← My sales</Link>

      <div className="rq-wrap">
        <p className="rq-lede">Ask a buyer to pay into escrow. Their money is held safely, and you get paid the moment they confirm they received the item.</p>

        <div className="tf-card rq-amount">
          <label className="rq-amount-label">Amount to request</label>
          <div className="rq-amount-row"><span className="rq-naira">₦</span><input inputMode="numeric" placeholder="0" value={amount} onChange={(e) => setAmount(fmtMoney(e.target.value))} className="rq-amount-input tf-mono" /></div>
        </div>

        <div className="tf-card rq-sec">
          <label className="rq-label">What are you selling?</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. iPhone 14 Pro, 256GB" className="rq-input" />
          <label className="rq-label">Buyer&apos;s phone or email</label>
          <input value={buyer} onChange={(e) => setBuyer(e.target.value)} placeholder="@username, phone or buyer@email.com" className="rq-input" />
        </div>

        {err && <p className="rq-err">{err}</p>}

        <button className="tf-btn tf-btn--primary rq-cta" disabled={!canSubmit} onClick={() => void submit()}>
          {busy ? "Sending…" : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              {amountNum > 0 ? `Request ${naira(amountNum)}` : "Send payment request"}
            </>
          )}
        </button>
      </div>
    </AppShell>
  );
}

const css = `
.rq-head{ display:none }
.rq-back{ display:inline-block; font-size:13.5px; font-weight:600; color:var(--muted); margin-bottom:4px } .rq-back:hover{ color:var(--ink) }
.rq-back-m{ margin:0 0 14px }
.rq-wrap{ display:flex; flex-direction:column; gap:14px; max-width:560px }
.rq-lede{ font-size:14px; color:var(--muted); line-height:1.55 }

.rq-amount{ padding:18px }
.rq-amount-label{ font-size:12.5px; font-weight:600; color:var(--muted) }
.rq-amount-row{ margin-top:10px; display:flex; align-items:center; gap:6px }
.rq-naira{ font-size:34px; font-weight:700; color:var(--faint) }
.rq-amount-input{ flex:1; min-width:0; background:transparent; border:none; outline:none; color:var(--ink); font-size:34px; font-weight:700; letter-spacing:-.02em }

.rq-sec{ padding:18px }
.rq-label{ display:block; margin-top:14px; font-size:12.5px; font-weight:600; color:var(--ink-2) }
.rq-sec .rq-label:first-child{ margin-top:0 }
.rq-input{ margin-top:7px; width:100%; box-sizing:border-box; height:52px; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:0 14px; font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:border-color .16s var(--ease) }
.rq-input:focus{ border-color:var(--safe) }

.rq-err{ font-size:13px; color:var(--danger); font-weight:500; line-height:1.4 }
.rq-cta{ height:56px; font-size:16px; width:100% }
.rq-cta:disabled{ opacity:.45; cursor:not-allowed }

@media (min-width:1024px){ .rq-head{ display:flex } .rq-back-m{ display:none } }
`;
