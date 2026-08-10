"use client";

/* Become a seller — capture identity + payout account, save the seller profile
   (so payouts have somewhere to land), then continue to "My sales". Rebuilt as
   a responsive React page in the app shell: desktop pairs the form with a
   "why verify" sidebar; it stacks on mobile. Verification logic is unchanged. */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/app/_lib/AppShell";
import { SelfieCapture } from "@/app/_lib/SelfieCapture";
import { Spinner } from "@/app/_lib/States";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "@/app/_lib/Toast";
import { saveSellerProfile } from "@/lib/client";

export default function SellerPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [selfie, setSelfie] = useState<string | undefined>(undefined);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shell, setShell] = useState({ name: "You", initials: "" });
  // Becoming a seller means saving a payout identity, so it needs a signed-in
  // user. `ready` gates the form until we've confirmed one; a signed-out visitor
  // is sent to sign in and returned straight here afterwards (?next=/seller).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getCurrentUser().then((u) => {
      if (!alive) return;
      if (!u) { router.replace("/login?next=/seller"); return; }
      const nm = u.name || (u.email ? u.email.split("@")[0] : "You");
      setShell({ name: nm, initials: nm.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?" });
      setReady(true);
    }).catch(() => { if (alive) setReady(true); }); // transient read error: don't trap the user
    return () => { alive = false; };
  }, [router]);

  async function verify() {
    if (busy) return;
    if (!fullName.trim() || idNumber.trim().length !== 11 || !bankName.trim() || accountNumber.trim().length < 10 || !accountName.trim()) {
      setErr("Fill in your name, your 11-digit BVN, and your full bank account details.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const me = await getCurrentUser().catch(() => null);
      const saved = await saveSellerProfile(
        { fullName: fullName.trim(), payout: { bankName: bankName.trim(), accountNumber: accountNumber.trim(), accountName: accountName.trim() } },
        me?.email,
        { idNumber: idNumber.trim(), idType: "bvn", selfie },
      );
      if (saved.verified) toast.success("Identity verified. You can receive payouts.");
      else toast("Details saved. We couldn't verify you, so payouts stay locked until your BVN and selfie match.");
      router.push("/selling");
    } catch {
      const msg = "Couldn't save your details. Please try again.";
      setErr(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  const done = !!fullName.trim() && idNumber.trim().length === 11 && !!bankName.trim() && accountNumber.trim().length >= 10 && !!accountName.trim();

  // Still confirming the session (or bouncing a signed-out visitor to sign in):
  // hold a centred spinner rather than flash a form they can't submit.
  if (!ready) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <AppShell current="profile" user={{ name: shell.name, initials: shell.initials }}>
      <style>{css}</style>

      <div className="tf-ph-head sl-head">
        <div><div className="tf-eyebrow">Selling</div><h1>Become a seller</h1></div>
      </div>

      <div className="sl-wrap">
        <div className="sl-main">
          <div className="sl-explain">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.9"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p><b>Sellers must be verified to receive money.</b> Buyers pay in freely, but payouts only ever go to a verified identity.</p>
          </div>

          <div className="tf-card sl-sec">
            <div className="sl-sec-title">Your identity</div>
            <label className="sl-label">Full name (as on ID)</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Chidi Nwosu" className="sl-input" />
            <label className="sl-label">Bank Verification Number (BVN)</label>
            <input value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" maxLength={11} placeholder="Your 11-digit BVN" className="sl-input sl-mono" />
          </div>

          <div className="tf-card sl-sec">
            <div className="sl-sec-title">Liveness check</div>
            <p className="sl-sec-sub">Take a quick selfie. We match it to the photo on your BVN to confirm you are a real person, not an impersonator.</p>
            <SelfieCapture value={selfie} onChange={setSelfie} />
          </div>

          <div className="tf-card sl-sec">
            <div className="sl-sec-title">Payout account</div>
            <p className="sl-sec-sub">Where your money lands when a buyer releases escrow.</p>
            <label className="sl-label">Bank</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank, Access, Wema" className="sl-input" />
            <label className="sl-label">Account number</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" maxLength={10} placeholder="10-digit account number" className="sl-input sl-mono" />
            <label className="sl-label">Account name</label>
            <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account name (as on the account)" className="sl-input" />
          </div>

          {err && <p className="sl-err">{err}</p>}

          <button className="tf-btn tf-btn--primary sl-cta" disabled={!done || busy} onClick={() => void verify()}>
            {busy ? "Verifying…" : "Finish verification"}
          </button>
        </div>

        <aside className="sl-side tf-card">
          <div className="tf-eyebrow">Why we verify</div>
          <ul className="sl-why">
            <li><span className="sl-why-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Buyers trust a verified seller. Your Trust Score starts higher.</li>
            <li><span className="sl-why-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Payouts land in under 60 seconds once a buyer confirms.</li>
            <li><span className="sl-why-ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>Your ID is checked once. We store only the verification result.</li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}

const css = `
.sl-head{ display:none }
.sl-wrap{ display:flex; flex-direction:column; gap:16px }
.sl-main{ display:flex; flex-direction:column; gap:14px }

.sl-explain{ display:flex; align-items:flex-start; gap:11px; border-radius:16px; padding:14px 15px; background:var(--safe-tint); border:1px solid #C7F0DE }
.sl-explain svg{ flex-shrink:0; margin-top:1px }
.sl-explain p{ font-size:12.5px; color:#065F46; line-height:1.5 } .sl-explain b{ color:#064E3B }

.sl-sec{ padding:18px }
.sl-sec-title{ font-size:15px; font-weight:700; letter-spacing:-.01em }
.sl-sec-sub{ font-size:12.5px; color:var(--muted); line-height:1.5; margin:6px 0 0 }
.sl-label{ display:block; margin-top:14px; font-size:12.5px; font-weight:600; color:var(--ink-2) }
.sl-input{ margin-top:7px; width:100%; box-sizing:border-box; height:52px; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:0 14px; font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:border-color .16s var(--ease) }
.sl-input:focus{ border-color:var(--safe) }
.sl-mono{ font-family:ui-monospace,'SF Mono',Menlo,monospace; letter-spacing:2px }

.sl-live{ margin-top:12px; display:flex; flex-direction:column; align-items:center; padding:8px 0 4px }
.sl-live-ring{ width:110px; height:110px; border-radius:50%; background:#F1F5F9; display:flex; align-items:center; justify-content:center; border:3px solid transparent; border-top-color:var(--safe); border-right-color:var(--safe) }
.sl-live-ok{ margin-top:14px; display:inline-flex; align-items:center; gap:7px; font-size:12.5px; color:var(--safe); font-weight:600 }
.sl-live-sub{ margin-top:6px; font-size:11.5px; color:var(--faint) }

.sl-err{ font-size:13px; color:var(--danger); font-weight:500; line-height:1.4 }
.sl-cta{ height:56px; font-size:16px; width:100% }
.sl-cta:disabled{ opacity:.45; cursor:not-allowed }

.sl-side{ padding:20px; height:fit-content }
.sl-why{ list-style:none; margin:14px 0 0; padding:0; display:flex; flex-direction:column; gap:14px }
.sl-why li{ display:flex; align-items:flex-start; gap:10px; font-size:13px; color:var(--ink-2); line-height:1.5 }
.sl-why-ic{ width:24px; height:24px; border-radius:8px; background:var(--safe-tint); display:flex; align-items:center; justify-content:center; flex-shrink:0 }

@media (min-width:1024px){
  .sl-head{ display:flex }
  .sl-wrap{ display:grid; grid-template-columns:1fr 320px; gap:24px; align-items:start }
  .sl-main{ gap:16px }
  .sl-sec{ padding:22px }
  .sl-side{ position:sticky; top:88px }
}
`;
