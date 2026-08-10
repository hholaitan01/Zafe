"use client";

/* Profile — responsive. Desktop keeps the Claude Design structure (identity
   hero + a two-column grid: left = Trust Score history chart, payout bank
   cards, preferences; right = identity verification, account/danger zone). It
   stacks to a single mobile column inside AppShell. Built in our navy/emerald
   light system, on real reputation + seller data.

   Rules preserved from before:
   • First/Last name: one edit; after the first save they're locked.
   • Other names: can be added once (never removed).
   • Username + photo: changeable anytime.
   • Save is disabled until an editable field changes.
   Signout clears the session and all client storage (see lib/auth). */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/_lib/AppShell";
import { Skeleton, Spinner } from "@/app/_lib/States";
import { toast } from "@/app/_lib/Toast";
import { getCurrentUser, signOut, syncDisplayName } from "@/lib/auth";
import {
  ApiError,
  deleteAccount,
  getMyReputation,
  listMyDeals,
  listMySales,
  loadSellerProfile,
  loadUserProfile,
  saveUserProfile,
  splitName,
  type LoadedProfile,
} from "@/lib/client";
import { scoreReputation } from "@/lib/reputation/engine";
import type { Deal, DealStatus } from "@/lib/deals/types";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

function riskBand(score: number): string {
  if (score >= 70) return "Low risk range (70-100)";
  if (score >= 40) return "Medium risk range (40-69)";
  return "Building trust (0-39)";
}

const DAY = 86_400_000;
function monthLabel(t: number): string {
  return new Date(t).toLocaleDateString("en-NG", { month: "short" });
}

/** Reconstruct each deal as it stood at time `t`: its status is the latest
    timeline event at or before `t`, and a deal created after `t` did not exist
    yet. This lets the reputation engine score the account at a past moment. */
function snapshotAsOf(deals: Deal[], t: number): Deal[] {
  const out: Deal[] = [];
  for (const d of deals) {
    if (new Date(d.createdAt).getTime() > t) continue;
    const evs = (d.timeline || []).filter((e) => new Date(e.at).getTime() <= t).sort((a, b) => a.at.localeCompare(b.at));
    const status = (evs.length ? evs[evs.length - 1].status : d.status) as DealStatus;
    const disputedByT = !!d.dispute && new Date(d.dispute.openedAt).getTime() <= t;
    out.push({ ...d, status, timeline: evs, dispute: disputedByT ? d.dispute : undefined });
  }
  return out;
}

/** The trader's REAL Trust Score history: replay their deals and score the
    account with the same engine at each moment its standing could have changed.
    A brand-new account with no deals is a flat line at the baseline score. */
function buildScoreHistory(email: string, deals: Deal[], currentScore: number): { label: string; score: number }[] {
  const now = Date.now();
  if (deals.length === 0) {
    // Nothing has happened yet: a flat line at the current (baseline) score.
    return [
      { label: monthLabel(now - 30 * DAY), score: currentScore },
      { label: monthLabel(now), score: currentScore },
    ];
  }
  let earliest = Number.POSITIVE_INFINITY;
  const marks = new Set<number>();
  for (const d of deals) {
    const c = new Date(d.createdAt).getTime();
    if (Number.isFinite(c)) earliest = Math.min(earliest, c);
    for (const e of d.timeline || []) {
      if (["completed", "resolved", "disputed", "refunded"].includes(e.status)) {
        const te = new Date(e.at).getTime();
        if (Number.isFinite(te)) marks.add(te);
      }
    }
  }
  const checkpoints = [earliest, ...[...marks].filter((t) => t > earliest), now]
    .filter((t, i, a) => Number.isFinite(t) && a.indexOf(t) === i)
    .sort((x, y) => x - y);

  let series = checkpoints.map((t) => ({ label: monthLabel(t), score: scoreReputation(email, snapshotAsOf(deals, t), t).score }));
  // Pin the final point to the authoritative current score.
  if (series.length) series[series.length - 1] = { ...series[series.length - 1], score: currentScore };
  // Keep the chart readable: at most 8 points, always keeping the first and last.
  const MAX = 8;
  if (series.length > MAX) {
    const step = (series.length - 1) / (MAX - 1);
    series = Array.from({ length: MAX }, (_, i) => series[Math.round(i * step)]);
  }
  return series;
}

/** Trust Score history sparkline — grid lines, area fill, month labels. */
function TrustScoreChart({ data }: { data: { label: string; score: number }[] }) {
  const w = 600, h = 150, pad = 16;
  const xs = (i: number) => pad + i * ((w - pad * 2) / (data.length - 1));
  const ys = (v: number) => h - pad - (v / 100) * (h - pad * 2);
  const pts = data.map((d, i) => `${xs(i).toFixed(1)},${ys(d.score).toFixed(1)}`).join(" ");
  const area = `M${xs(0).toFixed(1)},${h - pad} L${data
    .map((d, i) => `${xs(i).toFixed(1)},${ys(d.score).toFixed(1)}`)
    .join(" L")} L${xs(data.length - 1).toFixed(1)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 150, marginTop: 14, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ts-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={ys(g)} y2={ys(g)} stroke="#EEF2F6" strokeDasharray="2 5" />
      ))}
      <path d={area} fill="url(#ts-area)" />
      <polyline points={pts} fill="none" stroke="#059669" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={i} cx={xs(i)} cy={ys(d.score)} r={i === data.length - 1 ? 3.4 : 2.6} fill="#fff" stroke="#059669" strokeWidth="2" />
      ))}
    </svg>
  );
}

type Payout = { bankName?: string; accountNumber?: string; accountName?: string };

function BankCard({ payout, muted = false }: { payout: Payout; muted?: boolean }) {
  const acct = (payout.accountNumber || "").replace(/(\d{4})(?=\d)/g, "$1 ");
  return (
    <div className="pf-bank" style={muted ? { background: "linear-gradient(150deg,#243a52,#1B2B3E)" } : undefined}>
      <div className="pf-bank-top">
        <span className="pf-bank-name">{payout.bankName || "Bank account"}</span>
        {muted ? (
          <span className="pf-bank-dots">•••</span>
        ) : (
          <span className="pf-bank-badge">DEFAULT</span>
        )}
      </div>
      <div>
        <div className="pf-bank-num tf-mono">{acct || "•••• •••• ••"}</div>
        <div className="pf-bank-holder">{(payout.accountName || "").toUpperCase() || "ACCOUNT HOLDER"}</div>
      </div>
    </div>
  );
}

const SealCheck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" aria-hidden="true">
    <path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Downscale an image file to a small JPEG data URL (for the avatar). */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 240;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const cw = Math.max(1, Math.round(img.width * scale));
      const ch = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      canvas.getContext("2d")?.drawImage(img, 0, 0, cw, ch);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

interface Toggles { email: boolean; whatsapp: boolean; twofa: boolean; autoconfirm: boolean }
const PREFS: { key: keyof Toggles; title: string; sub: string }[] = [
  { key: "email", title: "Email notifications", sub: "Status changes, disputes, payouts." },
  { key: "whatsapp", title: "WhatsApp updates", sub: "A message when a buyer pays or a seller ships." },
  { key: "twofa", title: "Two-factor auth", sub: "Required to release funds over ₦500,000." },
  { key: "autoconfirm", title: "Auto-confirm after 72h", sub: "If delivered and you don't act, funds release automatically." },
];

export default function ProfilePage() {
  const router = useRouter();
  const emailRef = useRef("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState("");
  const [prof, setProf] = useState<LoadedProfile | null>(null);

  const [firstName, setFirstName] = useState("");
  const [otherNames, setOtherNames] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [err, setErr] = useState("");

  const [score, setScore] = useState<number | null>(null);
  const [tier, setTier] = useState("");
  const [stats, setStats] = useState<{ total: number; completed: number; disputed: number } | null>(null);
  const [seller, setSeller] = useState<{ verified?: boolean; phone?: string; payout?: Payout } | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);

  const [toggles, setToggles] = useState<Toggles>({ email: true, whatsapp: false, twofa: true, autoconfirm: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const em = user?.email || "";
      emailRef.current = em;
      const fullName = user?.name || (em ? em.split("@")[0] : "there");
      if (alive) { setName(fullName); setEmail(em); }

      const [rep, sell, loaded, buying, selling] = await Promise.all([
        getMyReputation(em, user?.name).catch(() => null),
        loadSellerProfile(em).catch(() => null),
        loadUserProfile(em).catch(
          () => ({ firstName: "", otherNames: "", lastName: "", username: "", photo: "", hasRecord: false, otherLocked: false }) as LoadedProfile,
        ),
        listMyDeals(em).catch(() => [] as Deal[]),
        (em ? listMySales([em]) : Promise.resolve([] as Deal[])).catch(() => [] as Deal[]),
      ]);
      if (!alive) return;
      const base = splitName(fullName);
      setProf(loaded);
      setFirstName(loaded.firstName || base.firstName);
      setOtherNames(loaded.otherNames || base.otherNames);
      setLastName(loaded.lastName || base.lastName);
      setUsername(loaded.username || "");
      setPhoto(loaded.photo || "");
      if (rep) { setScore(rep.score); setTier(rep.tierLabel); setStats(rep.stats); }
      setSeller(sell);
      const byId = new Map<string, Deal>();
      [...buying, ...selling].forEach((d) => byId.set(d.id, d));
      setDeals([...byId.values()]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const nameLocked = !!prof?.hasRecord;
  const otherLocked = !!prof?.otherLocked;
  const initials = useMemo(() => initialsOf(name || "?"), [name]);
  const successRate = stats && stats.total ? Math.round((stats.completed / stats.total) * 100) : null;
  // A trader with no counted deals has no history: force a flat line so the
  // graph always agrees with the Total below it.
  const history = useMemo(
    () => buildScoreHistory(emailRef.current, stats && stats.total === 0 ? [] : deals, score ?? 0),
    [deals, score, stats],
  );
  const delta = history.length ? history[history.length - 1].score - history[0].score : 0;

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); if (saveState !== "idle") setSaveState("idle"); setErr(""); setDirty(true); };
  }

  async function onPhotoPick(file: File) {
    let dataUrl: string;
    try { dataUrl = await resizePhoto(file); } catch { return; }
    setPhoto(dataUrl);
    try { await saveUserProfile({ photo: dataUrl }, emailRef.current || undefined); } catch { /* keep local preview */ }
  }

  async function saveNames() {
    if (!dirty || saveState === "saving") return;
    setSaveState("saving");
    setErr("");
    try {
      const saved = await saveUserProfile(
        { firstName: firstName.trim(), otherNames: otherNames.trim(), lastName: lastName.trim(), username: username.trim() },
        emailRef.current || undefined,
      );
      setProf({ ...saved, hasRecord: true, otherLocked: !!saved.otherNames });
      setFirstName(saved.firstName); setOtherNames(saved.otherNames); setLastName(saved.lastName); setUsername(saved.username || "");
      // Keep the auth record's name in step so the greeting on every screen
      // matches the name just saved, not the email prefix.
      const full = [saved.firstName, saved.otherNames, saved.lastName].map((s) => (s || "").trim()).filter(Boolean).join(" ");
      if (full) { setName(full); void syncDisplayName(full); }
      setDirty(false);
      setSaveState("saved");
      toast.success("Profile updated");
      setTimeout(() => setSaveState("idle"), 1600);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn't save. Please try again.";
      setErr(msg);
      toast.error(msg);
      setSaveState("idle");
    }
  }

  async function doSignout() {
    try { await signOut(); } catch { /* proceed to login regardless */ }
    router.push("/login");
  }

  const [confirmClose, setConfirmClose] = useState(false);
  const [closing, setClosing] = useState(false);
  async function doCloseAccount() {
    if (closing) return;
    setClosing(true);
    try {
      await deleteAccount();          // blocks (409) if money is still in escrow
      await signOut().catch(() => {}); // clear the local session too
      toast.success("Your account has been closed.");
      router.push("/login");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "We couldn't close your account. Please try again.");
      setClosing(false);
    }
  }

  const verifyRows = [
    { k: "BVN", v: seller?.verified ? "•••• •••• verified" : "Not linked", ok: !!seller?.verified, mono: true },
    { k: "NIN", v: seller?.verified ? "•••• •••• verified" : "Not linked", ok: !!seller?.verified, mono: true },
    { k: "Phone", v: seller?.phone || "Not added", ok: !!seller?.phone },
    { k: "Email", v: email ? "Verified" : "Not added", ok: !!email },
    { k: "Business name", v: "Not added", ok: false },
  ];

  const lockNote = nameLocked
    ? otherLocked
      ? "Names are locked. You can still change your username or photo."
      : "Names are locked. You can add one other name; username and photo stay editable."
    : "You can edit your names once. After you save, first and last names are locked.";

  return (
    <AppShell current="profile" user={{ name: name || "You", initials, photo, score: score ?? undefined }}>
      <style>{css}</style>

      {/* page head — desktop only */}
      <div className="tf-ph-head pf-head">
        <div><div className="tf-eyebrow">Account</div><h1>Profile</h1></div>
      </div>

      {/* identity hero */}
      <div className="tf-card pf-hero">
        <label className="pf-photo">
          <span className="pf-photo-av" style={photo ? { backgroundImage: `url("${photo}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{photo ? "" : initials}</span>
          <span className="pf-photo-cam" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
          </span>
          <input ref={fileRef} type="file" accept="image/*" className="pf-photo-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPhotoPick(f); }} />
        </label>
        <div className="pf-hero-main">
          <div className="pf-hero-name">{loading ? " " : name}</div>
          <div className="pf-hero-meta">{email || "Not signed in"}{seller?.phone ? ` · ${seller.phone}` : ""}</div>
          <div className="pf-verify-pill"><SealCheck size={12} />{seller?.verified ? "NIN · BVN verified" : "Identity not verified"}</div>
        </div>
        <div className="pf-hero-since">
          <div className="tf-eyebrow">Trust Score</div>
          <div className="pf-hero-score">{loading ? <Skeleton w={44} h={22} /> : <>{score ?? "—"}<span>/100</span></>}</div>
        </div>
      </div>

      {/* Seller entry — become a seller, or jump to the seller dashboard */}
      {!loading && (
        (seller?.payout?.accountNumber || seller?.verified) ? (
          <div className="pf-sellcta pf-sellcta--on">
            <div className="pf-sellcta-txt">
              <div className="pf-sellcta-title">You sell on Zafe</div>
              <div className="pf-sellcta-sub">Track your sales, shipments, and payouts in your seller dashboard.</div>
            </div>
            <Link href="/selling" className="tf-btn tf-btn--secondary pf-sellcta-btn">Seller dashboard</Link>
          </div>
        ) : (
          <div className="pf-sellcta">
            <div className="pf-sellcta-txt">
              <div className="pf-sellcta-title">Start selling on Zafe</div>
              <div className="pf-sellcta-sub">Verify your identity once, then let buyers pay you through protected escrow.</div>
            </div>
            <Link href="/seller" className="tf-btn tf-btn--primary pf-sellcta-btn">Become a seller</Link>
          </div>
        )
      )}

      {/* two-column grid (stacks on mobile) */}
      <div className="pf-grid">
        <div className="pf-col">
          {/* Trust Score history */}
          <div className="tf-card pf-pad">
            <div className="pf-chart-head">
              <div><div className="tf-eyebrow">Trust Score history</div><div className="pf-chart-cur">{loading ? <Skeleton w={30} h={20} /> : (score ?? "—")}</div></div>
              <div className="pf-chart-side">
                <div className="pf-chart-delta tf-mono" style={{ color: delta > 0 ? "var(--safe)" : delta < 0 ? "var(--danger)" : "var(--muted)" }}>
                  {score == null ? "—" : delta > 0 ? `↑ ${delta} since ${history[0].label}` : delta < 0 ? `↓ ${Math.abs(delta)} since ${history[0].label}` : "No change yet"}
                </div>
                <div className="pf-chart-band">{score == null ? "Build your history" : riskBand(score)}</div>
              </div>
            </div>
            {loading ? <Skeleton w="100%" h={140} radius={12} style={{ marginTop: 12 }} /> : <TrustScoreChart data={history} />}
            <div className="pf-stat-strip">
              <div className="pf-stat"><div className="pf-stat-label">Total</div><div className="pf-stat-val">{stats?.total ?? 0}</div></div>
              <div className="pf-stat"><div className="pf-stat-label">Successful</div><div className="pf-stat-val">{stats?.completed ?? 0}{successRate != null && <span className="pf-stat-sub"> · {successRate}%</span>}</div></div>
              <div className="pf-stat pf-stat-last"><div className="pf-stat-label">Disputes</div><div className="pf-stat-val">{stats?.disputed ?? 0}</div></div>
            </div>
          </div>

          {/* Payout account */}
          <div className="tf-card pf-pad">
            <div className="pf-card-head">
              <div><div className="pf-card-title">Payout account</div><div className="pf-card-sub">Where money lands when buyers release escrow on your sales.</div></div>
              <Link href="/seller" className="tf-btn tf-btn--secondary pf-btn-sm">Manage</Link>
            </div>
            {seller?.payout?.accountNumber ? (
              <div className="pf-bank-row"><BankCard payout={seller.payout} /></div>
            ) : (
              <Link href="/seller" className="pf-bank-empty">No payout account yet. Add where you get paid.</Link>
            )}
            <div className="pf-note"><SealCheck size={14} />Verified by the bank&apos;s account lookup. Payouts arrive in under 60 seconds.</div>
          </div>

          {/* Personal details (editable names) */}
          <div className="tf-card pf-pad">
            <div className="pf-card-title">Personal details</div>
            <div className="pf-fields">
              <Field label="First name" value={firstName} onChange={markDirty(setFirstName)} readOnly={nameLocked} placeholder="First name" />
              <Field label="Other names" value={otherNames} onChange={markDirty(setOtherNames)} readOnly={otherLocked} placeholder="Optional" />
              <Field label="Last name" value={lastName} onChange={markDirty(setLastName)} readOnly={nameLocked} placeholder="Last name" />
              <Field label="Username" value={username} onChange={markDirty(setUsername)} placeholder="@yourhandle" />
            </div>
            {err && <p className="pf-err">{err}</p>}
            <p className="pf-lock">{lockNote}</p>
            <button className="tf-btn tf-btn--primary pf-save" disabled={!dirty || saveState === "saving"} onClick={() => void saveNames()}>
              {saveState === "saving" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner light size={15} />Saving…</span> : saveState === "saved" ? "Saved ✓" : dirty ? "Save changes" : "Save"}
            </button>
          </div>

          {/* Preferences */}
          <div className="tf-card pf-pad">
            <div className="pf-card-title">Preferences</div>
            <div className="pf-prefs">
              {PREFS.map((p, i) => (
                <div key={p.key} className={`pf-pref${i === PREFS.length - 1 ? " pf-pref-last" : ""}`}>
                  <div className="pf-pref-txt"><div className="pf-pref-title">{p.title}</div><div className="pf-pref-sub">{p.sub}</div></div>
                  <button
                    className={`pf-toggle${toggles[p.key] ? " is-on" : ""}`}
                    role="switch"
                    aria-checked={toggles[p.key]}
                    aria-label={p.title}
                    onClick={() => setToggles((t) => ({ ...t, [p.key]: !t[p.key] }))}
                  >
                    <span className="pf-toggle-dot" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pf-col">
          {/* Identity verification */}
          <div className="tf-card pf-pad">
            <div className="tf-eyebrow">Identity verification</div>
            <div className="pf-verify">
              {verifyRows.map((r) => (
                <div key={r.k} className="pf-verify-row">
                  <div className="pf-verify-info"><div className="pf-verify-k">{r.k}</div><div className={`pf-verify-v${r.mono ? " tf-mono" : ""}`}>{r.v}</div></div>
                  {r.ok ? <SealCheck /> : <Link href="/seller" className="pf-verify-add">Add</Link>}
                </div>
              ))}
            </div>
          </div>

          {/* Account */}
          <div className="tf-card pf-pad">
            <div className="tf-eyebrow">Account</div>
            <p className="pf-danger-txt">Signing out just clears this device&apos;s session. Your account, deals, and history stay put, and you can sign back in anytime.</p>
            <button className="tf-btn pf-signout" onClick={() => void doSignout()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              Sign out
            </button>

            {!confirmClose ? (
              <button className="pf-close-link" onClick={() => setConfirmClose(true)}>Close account</button>
            ) : (
              <div className="pf-close">
                <div className="pf-close-t">Close your account?</div>
                <p className="pf-close-s">This signs you out for good and deactivates your account. As Nigerian financial rules require (CBN / anti-money-laundering), your identity and transaction records are kept inactive for 5 years, then permanently deleted. You can&apos;t close while money is still in escrow.</p>
                <div className="pf-close-actions">
                  <button className="tf-btn pf-close-go" disabled={closing} onClick={() => void doCloseAccount()}>
                    {closing ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner light size={15} />Closing…</span> : "Yes, close my account"}
                  </button>
                  <button className="tf-btn tf-btn--secondary" disabled={closing} onClick={() => setConfirmClose(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange, readOnly, placeholder }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean; placeholder: string }) {
  return (
    <label className="pf-field">
      <span className="pf-field-label">{label}</span>
      <input
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`pf-input${readOnly ? " is-locked" : ""}`}
      />
    </label>
  );
}

const css = `
.pf-head{ display:none }

/* identity hero */
.pf-hero{ display:flex; align-items:center; gap:15px; padding:18px; margin-bottom:18px }
.pf-photo{ position:relative; width:66px; height:66px; flex-shrink:0; cursor:pointer }
.pf-photo-av{ width:66px; height:66px; border-radius:50%; background:#0F172A; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; overflow:hidden }
.pf-photo-cam{ position:absolute; right:-2px; bottom:-2px; width:24px; height:24px; border-radius:50%; background:#059669; border:3px solid #fff; display:flex; align-items:center; justify-content:center }
.pf-photo-input{ position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer }
.pf-hero-main{ flex:1; min-width:0 }
.pf-hero-name{ font-size:19px; font-weight:700; letter-spacing:-.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.pf-hero-meta{ font-size:12.5px; color:var(--muted); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.pf-verify-pill{ margin-top:8px; display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; background:var(--safe-tint); border:1px solid #C7F0DE; color:#047857; font-size:11px; font-weight:600; letter-spacing:.02em }
.pf-hero-since{ display:none; text-align:right; flex-shrink:0 }
.pf-hero-score{ font-size:26px; font-weight:700; letter-spacing:-.02em; color:var(--safe); margin-top:6px } .pf-hero-score span{ font-size:14px; color:var(--faint); font-weight:600 }

/* grid + cards */
.pf-sellcta{ display:flex; align-items:center; gap:16px; padding:16px 18px; margin-bottom:18px; border-radius:16px; border:1px solid var(--border); background:linear-gradient(180deg,#F0FDF8,#FFFFFF) }
.pf-sellcta--on{ background:#fff }
.pf-sellcta-txt{ flex:1; min-width:0 }
.pf-sellcta-title{ font-weight:700; font-size:15px; color:var(--ink) }
.pf-sellcta-sub{ font-size:13px; color:var(--muted); margin-top:2px; line-height:1.4 }
.pf-sellcta-btn{ flex-shrink:0; white-space:nowrap }
@media (max-width:520px){ .pf-sellcta{ flex-direction:column; align-items:stretch } .pf-sellcta-btn{ width:100% } }
.pf-grid{ display:flex; flex-direction:column; gap:16px }
.pf-col{ display:flex; flex-direction:column; gap:16px }
.pf-pad{ padding:18px }
.pf-card-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px }
.pf-card-title{ font-size:15px; font-weight:700; letter-spacing:-.01em }
.pf-card-sub{ font-size:12.5px; color:var(--muted); margin-top:4px; line-height:1.5 }
.pf-btn-sm{ height:36px; padding:0 14px; font-size:13px }

/* trust chart */
.pf-chart-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px }
.pf-chart-cur{ font-size:44px; font-weight:700; letter-spacing:-.03em; line-height:1; color:var(--safe); margin-top:6px; font-variant-numeric:tabular-nums }
.pf-chart-side{ text-align:right }
.pf-chart-delta{ font-size:13px; font-weight:600; color:var(--safe) }
.pf-chart-band{ font-size:12px; color:var(--muted); margin-top:4px }
.pf-stat-strip{ display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--line-2); margin-top:14px }
.pf-stat{ padding:14px 0 2px; border-right:1px solid var(--line-2); padding-right:14px }
.pf-stat + .pf-stat{ padding-left:14px }
.pf-stat-last{ border-right:none }
.pf-stat-label{ font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--faint) }
.pf-stat-val{ font-size:22px; font-weight:700; margin-top:3px; letter-spacing:-.01em } .pf-stat-sub{ font-size:13px; font-weight:400; color:var(--faint) }

/* bank cards */
.pf-bank-row{ display:grid; grid-template-columns:1fr; gap:14px }
.pf-bank{ padding:16px; border-radius:14px; background:linear-gradient(150deg,#14304A,#0F172A); color:#fff; min-height:132px; display:flex; flex-direction:column; justify-content:space-between }
.pf-bank-top{ display:flex; align-items:center; justify-content:space-between }
.pf-bank-name{ font-size:13px; font-weight:500; color:rgba(255,255,255,.72) }
.pf-bank-badge{ font-size:10px; padding:2px 7px; background:var(--safe); color:#fff; border-radius:4px; letter-spacing:.08em; font-weight:600 }
.pf-bank-dots{ color:rgba(255,255,255,.6); font-weight:700; letter-spacing:1px }
.pf-bank-num{ font-size:19px; letter-spacing:.06em; margin-top:24px }
.pf-bank-holder{ font-size:12px; color:rgba(255,255,255,.6); margin-top:3px }
.pf-bank-empty{ display:block; border-radius:14px; background:var(--bg); border:1px dashed #CBD5E1; padding:18px; text-align:center; color:var(--muted); font-size:13px }
.pf-note{ margin-top:12px; font-size:12px; color:var(--muted); line-height:1.5; display:flex; align-items:flex-start; gap:6px } .pf-note svg{ flex-shrink:0; margin-top:1px }

/* personal details */
.pf-fields{ margin-top:6px }
.pf-field{ display:block; margin-top:14px }
.pf-field-label{ display:block; font-size:12.5px; font-weight:600; color:var(--ink-2) }
.pf-input{ margin-top:6px; width:100%; box-sizing:border-box; height:50px; border-radius:12px; background:var(--bg); border:1px solid var(--line); padding:0 14px; font-size:15px; font-family:inherit; color:var(--ink); outline:none; transition:border-color .16s var(--ease) }
.pf-input:focus{ border-color:var(--safe) }
.pf-input.is-locked{ opacity:.55; cursor:not-allowed }
.pf-err{ margin:12px 0 0; font-size:12.5px; color:var(--danger); line-height:1.4 }
.pf-lock{ margin:8px 0 0; font-size:11.5px; color:var(--faint); line-height:1.4 }
.pf-save{ margin-top:14px; width:100%; height:48px }
.pf-save:disabled{ opacity:.45; cursor:not-allowed }

/* preferences */
.pf-prefs{ margin-top:6px }
.pf-pref{ display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid var(--line-2) }
.pf-pref-last{ border-bottom:none }
.pf-pref-txt{ flex:1; min-width:0 }
.pf-pref-title{ font-size:14px; font-weight:600 }
.pf-pref-sub{ font-size:12px; color:var(--muted); margin-top:2px; line-height:1.4 }
.pf-toggle{ width:40px; height:23px; border-radius:999px; background:#CBD5E1; border:none; position:relative; flex-shrink:0; cursor:pointer; padding:0; transition:background .2s var(--ease) }
.pf-toggle.is-on{ background:var(--safe) }
.pf-toggle-dot{ position:absolute; top:2px; left:2px; width:19px; height:19px; border-radius:50%; background:#fff; box-shadow:0 1px 2px rgba(15,23,42,.2); transition:transform .2s var(--ease) }
.pf-toggle.is-on .pf-toggle-dot{ transform:translateX(17px) }

/* identity verification */
.pf-verify{ margin-top:14px }
.pf-verify-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; border-bottom:1px solid var(--line-2) }
.pf-verify-row:last-child{ border-bottom:none }
.pf-verify-info{ min-width:0 }
.pf-verify-k{ font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--faint) }
.pf-verify-v{ font-size:13px; color:var(--ink); margin-top:2px }
.pf-verify-add{ font-size:12px; font-weight:600; color:var(--ink); padding:5px 12px; border:1px solid var(--line); border-radius:9px }
.pf-verify-add:hover{ border-color:#CBD5E1 }

/* account / danger */
.pf-danger-txt{ margin:12px 0 0; font-size:13px; color:var(--muted); line-height:1.5 }
.pf-signout{ margin-top:14px; width:100%; height:50px; background:#fff; border:1px solid var(--line); box-shadow:var(--sh-1); color:var(--danger) }
.pf-signout:hover{ border-color:#FCA5A5 }
/* close account — quiet link until asked, then a clearly destructive confirm */
.pf-close-link{ display:block; margin:16px auto 2px; background:none; border:none; font-family:inherit; font-size:12.5px; font-weight:600; color:var(--faint); cursor:pointer; text-decoration:underline; text-underline-offset:2px }
.pf-close-link:hover{ color:var(--danger) }
.pf-close{ margin-top:16px; border:1px solid #FECACA; background:#FEF2F2; border-radius:14px; padding:16px }
.pf-close-t{ font-size:14.5px; font-weight:700; color:#B91C1C }
.pf-close-s{ margin:6px 0 0; font-size:12.5px; line-height:1.55; color:#7F1D1D }
.pf-close-actions{ margin-top:14px; display:flex; flex-direction:column; gap:8px }
.pf-close-go{ height:46px; background:var(--danger); color:#fff }
.pf-close-go:hover{ background:#B91C1C }
.pf-close-go:disabled{ opacity:.6; cursor:default }

@media (min-width:1024px){
  .pf-head{ display:flex }
  .pf-hero{ padding:24px; margin-bottom:20px }
  .pf-hero-since{ display:block }
  .pf-hero-name{ font-size:24px }
  .pf-hero-meta{ font-size:13px }
  .pf-grid{ display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start }
  .pf-pad{ padding:22px }
  .pf-bank-row{ grid-template-columns:1fr 1fr }
}
`;
