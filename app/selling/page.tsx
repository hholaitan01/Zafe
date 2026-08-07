"use client";

/* My sales — deals where the signed-in user is the seller. Now inside the
   responsive app shell. Shows each sale's status and lets the seller mark a
   funded deal as shipped (which mints the buyer's handover code). "Request a
   payment" starts a seller-initiated deal. */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { EmptyState, ErrorState, Skeleton, Spinner } from "@/app/_lib/States";
import { toast } from "@/app/_lib/Toast";
import { getCurrentUser } from "@/lib/auth";
import { getSellerProfile, listMySales, loadSellerProfile, naira, setCurrentDealId, shipDeal } from "@/lib/client";
import type { Deal, DealStatus } from "@/lib/deals/types";

const PILL: Record<DealStatus, { label: string; bg: string; fg: string; dot: string }> = {
  created: { label: "Awaiting payment", bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  funded: { label: "Ready to ship", bg: "#FEF3C7", fg: "#A16207", dot: "#E89914" },
  shipped: { label: "Shipped", bg: "#ECFDF5", fg: "#047857", dot: "#10B981" },
  completed: { label: "Paid out", bg: "#ECFDF5", fg: "#047857", dot: "#10B981" },
  disputed: { label: "Disputed", bg: "#FEE2E2", fg: "#B91C1C", dot: "#DC2626" },
  under_review: { label: "Under review", bg: "#EDE9FE", fg: "#6D28D9", dot: "#7C3AED" },
  refunded: { label: "Refunded", bg: "#F1F5F9", fg: "#475569", dot: "#94A3B8" },
  resolved: { label: "Resolved", bg: "#E0E7FF", fg: "#3730A3", dot: "#6366F1" },
};

function itemIcon(t: string): React.ReactNode {
  let d: string;
  if (/iphone|phone|pixel|samsung|tecno|infinix/i.test(t)) d = "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM10 18.5h4";
  else if (/mac|laptop|book|pc|dell|hp/i.test(t)) d = "M3 5h18v12H3zM2 20h20";
  else if (/airpod|pod|headphone|buds|sony|earbud/i.test(t)) d = "M4 14v-2a8 8 0 0 1 16 0v2M4 15h3v6H5a1 1 0 0 1-1-1zM20 15h-3v6h2a1 1 0 0 0 1-1z";
  else if (/ps5|playstation|xbox|console|game|nintendo|switch/i.test(t)) d = "M2 8h20v8H2zM7 12h3M8.5 10.5v3";
  else if (/jordan|sneaker|shoe|kick|air ?force|nike|adidas/i.test(t)) d = "M2 16h13l5 2h2v2H2zM2 16v-4l4-2 2 3 4-1";
  else d = "m3 8 9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8";
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function SellingPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Deal[] | null>(null);
  const [verified, setVerified] = useState(true);
  const [shipping, setShipping] = useState<string | null>(null);
  const [shell, setShell] = useState({ name: "You", initials: "" });
  const contactsRef = useRef<string[]>([]);

  const [error, setError] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async (isRetry = false) => {
    if (isRetry) setRetrying(true);
    setError(false);
    try {
      const list = await listMySales(contactsRef.current);
      setSales(list);
      setVerified(getSellerProfile()?.verified === true);
    } catch {
      setError(true);
    } finally {
      if (isRetry) setRetrying(false);
    }
  }, []);
  const retry = () => { setSales(null); void load(true); };

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const nm = user?.name || (user?.email ? user.email.split("@")[0] : "You");
      const profile = await loadSellerProfile(user?.email);
      contactsRef.current = [user?.email, profile?.phone].filter(Boolean) as string[];
      if (!alive) return;
      setShell({ name: nm, initials: nm.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?" });
      await load();
    })();
    return () => { alive = false; };
  }, [load]);

  async function ship(id: string) {
    setShipping(id);
    const payout = getSellerProfile()?.payout;
    const sellerPayout = payout ? { accountNumber: payout.accountNumber, accountName: payout.accountName, verified: true } : undefined;
    try {
      await shipDeal(id, sellerPayout);
      toast.success("Marked as shipped. Handover code sent to the buyer.");
    } catch {
      toast.error("Couldn't mark as shipped. Please try again.");
    }
    await load();
    setShipping(null);
  }

  const open = (id: string) => { setCurrentDealId(id); router.push("/timeline"); };

  const s = sales || [];
  const loading = sales == null;
  const held = s.filter((d) => ["funded", "shipped"].includes(d.status)).reduce((t, d) => t + d.item.amount, 0);
  const toShip = s.filter((d) => d.status === "funded").length;
  const inDispute = s.filter((d) => ["disputed", "under_review"].includes(d.status)).length;
  const earned = s
    .filter((d) => ["completed", "resolved"].includes(d.status))
    .reduce((t, d) => t + (d.status === "resolved" ? d.item.amount - (d.partialRefundAmount || 0) : d.item.amount), 0);

  return (
    <AppShell current="new" user={{ name: shell.name, initials: shell.initials }}>
      <style>{css}</style>

      <div className="tf-ph-head sg-head">
        <div><div className="tf-eyebrow">Selling</div><h1>Seller dashboard</h1></div>
        <Link href="/request" className="tf-btn tf-btn--verify"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Request a payment</Link>
      </div>

      <div className="sg-wrap">
        <div className="sg-kpis">
          <div className="tf-card sg-kpi sg-kpi-hero">
            <div className="tf-eyebrow">Held for you</div>
            <div className="sg-kpi-val tf-mono">{loading ? <Skeleton w={120} h={24} style={{ marginTop: 6 }} /> : <><span className="sg-naira">₦</span>{naira(held).replace("₦", "")}</>}</div>
            <div className="sg-kpi-sub">In escrow across your active sales</div>
          </div>
          <div className="tf-card sg-kpi">
            <div className="tf-eyebrow">To ship</div>
            <div className="sg-kpi-val" style={{ color: toShip ? "#A16207" : "var(--ink)" }}>{loading ? <Skeleton w={40} h={24} style={{ marginTop: 6 }} /> : toShip}</div>
            <div className="sg-kpi-sub">{toShip ? "Funded, waiting on you" : "Nothing to ship"}</div>
          </div>
          <div className="tf-card sg-kpi">
            <div className="tf-eyebrow">Earned</div>
            <div className="sg-kpi-val" style={{ color: "var(--safe)" }}>{loading ? <Skeleton w={90} h={24} style={{ marginTop: 6 }} /> : naira(earned)}</div>
            <div className="sg-kpi-sub">Paid out to your account</div>
          </div>
          <div className="tf-card sg-kpi">
            <div className="tf-eyebrow">Disputes</div>
            <div className="sg-kpi-val" style={{ color: inDispute ? "#B91C1C" : "var(--ink)" }}>{loading ? <Skeleton w={40} h={24} style={{ marginTop: 6 }} /> : inDispute}</div>
            <div className="sg-kpi-sub">{inDispute ? "Need your attention" : "All clear"}</div>
          </div>
        </div>

        {!verified && (
          <Link href="/seller" className="sg-verify">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.9"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" /></svg>
            <div className="sg-verify-txt"><div className="sg-verify-t">Verify to receive payouts</div><div className="sg-verify-s">Sellers must be verified before money can be released to them.</div></div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        )}

        <Link href="/request" className="sg-request">
          <span className="sg-request-ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
          Request a payment
        </Link>

        <div className="sg-label">Your sales</div>
        <div className="sg-list">
          {error ? (
            <ErrorState onRetry={retry} retrying={retrying}>We couldn&apos;t load your sales. Check your connection and try again.</ErrorState>
          ) : sales == null ? (
            [0, 1].map((i) => (
              <div key={i} className="tf-card sg-card" aria-hidden>
                <div className="sg-card-top" style={{ cursor: "default" }}>
                  <span className="sg-ic"><Skeleton circle w={40} h={40} /></span>
                  <span className="sg-main"><Skeleton w="55%" h={13} /><Skeleton w="72%" h={11} style={{ marginTop: 7 }} /></span>
                  <Skeleton w={60} h={17} radius={8} />
                </div>
              </div>
            ))
          ) : sales.length ? (
            sales.map((d) => {
              const p = PILL[d.status];
              return (
                <div key={d.id} className="tf-card sg-card">
                  <button className="sg-card-top" onClick={() => open(d.id)}>
                    <span className="sg-ic">{itemIcon(d.item.title)}</span>
                    <span className="sg-main"><span className="sg-title">{d.item.title}</span><span className="sg-sub tf-mono">{naira(d.item.amount)} · {d.buyerEmail || "a buyer"}</span></span>
                    <span className="tf-pill" style={{ background: p.bg, color: p.fg }}>{p.label}</span>
                  </button>
                  {d.status === "funded" && (
                    <button className="tf-btn tf-btn--primary sg-ship" disabled={shipping === d.id} onClick={() => void ship(d.id)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M3 21h18M5 21V10l7-5 7 5v11" /></svg>
                      {shipping === d.id ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner light size={14} />Marking…</span> : "Mark as shipped"}
                    </button>
                  )}
                  {d.status === "shipped" && <div className="sg-note">Shipped. Waiting for the buyer to confirm; you&apos;ll be paid on release.</div>}
                  {d.status === "completed" && <div className="sg-note sg-note-ok">Released to your account.</div>}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M9 21v-6h6v6" /></svg>}
              title="No sales yet"
              action={<Link href="/request" className="tf-btn tf-btn--verify">Request a payment</Link>}
            >
              Request a payment, or share your email so a buyer can pay you through escrow.
            </EmptyState>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const css = `
.sg-head{ display:none }
.sg-wrap{ display:flex; flex-direction:column; gap:14px; max-width:760px }

.sg-kpis{ display:grid; grid-template-columns:1fr 1fr; gap:10px }
.sg-kpi{ padding:15px 16px }
.sg-kpi-hero{ grid-column:1 / -1; background:radial-gradient(120% 130% at 88% 0%, #14304A 0%, #0F172A 62%); border:none; color:#fff }
.sg-kpi-hero .tf-eyebrow{ color:rgba(255,255,255,.6) }
.sg-kpi-val{ font-size:24px; font-weight:800; letter-spacing:-.02em; margin-top:6px; line-height:1.1 }
.sg-kpi-hero .sg-kpi-val{ font-size:30px }
.sg-naira{ color:rgba(255,255,255,.55); margin-right:2px; font-weight:700 }
.sg-kpi-sub{ font-size:12px; color:var(--faint); margin-top:5px; line-height:1.4 }
.sg-kpi-hero .sg-kpi-sub{ color:rgba(255,255,255,.6) }

.sg-verify{ display:flex; align-items:center; gap:11px; border-radius:16px; padding:14px 15px; background:var(--safe-tint); border:1px solid #C7F0DE; color:inherit }
.sg-verify svg:first-child{ flex-shrink:0 }
.sg-verify-txt{ flex:1; min-width:0 }
.sg-verify-t{ font-size:13px; font-weight:700; color:#064E3B }
.sg-verify-s{ font-size:12px; color:#047857; margin-top:2px; line-height:1.4 }

.sg-request{ display:flex; align-items:center; gap:11px; height:58px; border-radius:16px; background:var(--safe); padding:0 16px; font-weight:600; font-size:15px; color:#fff; box-shadow:0 14px 26px -12px rgba(5,150,105,.55) }
.sg-request-ic{ width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.16); display:flex; align-items:center; justify-content:center }

.sg-label{ margin-top:8px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--faint) }
.sg-list{ display:flex; flex-direction:column; gap:10px }
.sg-empty{ padding:26px 18px; text-align:center; color:var(--faint); font-size:13.5px; line-height:1.5; background:#fff; border:1px dashed var(--line); border-radius:16px }

.sg-card{ padding:14px 15px }
.sg-card-top{ width:100%; text-align:left; cursor:pointer; font-family:inherit; background:none; border:none; padding:0; display:flex; align-items:center; gap:13px }
.sg-ic{ width:46px; height:46px; border-radius:13px; background:#F1F5F9; display:flex; align-items:center; justify-content:center; flex-shrink:0 }
.sg-main{ flex:1; min-width:0; display:flex; flex-direction:column }
.sg-title{ font-size:14.5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.sg-sub{ font-size:12px; color:var(--faint); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.sg-ship{ margin-top:12px; width:100%; height:46px; font-size:14px }
.sg-ship:disabled{ opacity:.6; cursor:not-allowed }
.sg-note{ margin-top:10px; font-size:12px; color:var(--muted); line-height:1.5 }
.sg-note-ok{ color:var(--safe); font-weight:600 }

@media (min-width:1024px){
  .sg-head{ display:flex }
  .sg-request{ display:none }
  .sg-kpis{ grid-template-columns:repeat(4,1fr) }
  .sg-kpi-hero{ grid-column:auto }
}
`;
