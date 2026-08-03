"use client";

/* Profile — account details with rules:
   • First/Last name: one edit; after the first save they're locked.
   • Other names: can be added once (never removed).
   • Username + photo: changeable anytime.
   • Save button is disabled ("Save") until an editable field changes.
   Locks, the button state, and the photo upload are handled imperatively over
   the rendered screen; the rest goes through ScreenHtml's data bindings. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenHtml from "@/app/_lib/screen-html";
import { html } from "@/app/_screens/profile";
import { getCurrentUser, signOut } from "@/lib/auth";
import { ApiError, getMyReputation, loadSellerProfile, loadUserProfile, saveUserProfile, splitName, type LoadedProfile } from "@/lib/client";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

/** A subtle rising sparkline that lands on the trader's real current score. */
function scoreChartHtml(score: number): string {
  const w = 300, h = 66, pad = 4;
  const start = Math.max(8, score - 34);
  const n = 8;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const base = start + (score - start) * t;
    const wobble = i === 0 || i === n - 1 ? 0 : Math.sin(i * 1.7) * 3;
    return Math.max(0, Math.min(100, base + wobble));
  });
  const x = (i: number) => pad + i * ((w - pad * 2) / (n - 1));
  const y = (v: number) => h - pad - (v / 100) * (h - pad * 2);
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `M${x(0)},${h - pad} L${pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" L")} L${x(n - 1)},${h - pad} Z`;
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:66px; display:block;"><defs><linearGradient id="tsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10B981" stop-opacity="0.18"/><stop offset="100%" stop-color="#10B981" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#tsg)"/><polyline points="${line}" fill="none" stroke="#059669" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(n - 1).toFixed(1)}" cy="${y(pts[n - 1]).toFixed(1)}" r="3.2" fill="#fff" stroke="#059669" stroke-width="2"/></svg>`;
}

/** Payout account as a navy "bank card", or a prompt to add one. */
function payoutCardHtml(payout?: { bankName?: string; accountNumber?: string; accountName?: string }): string {
  if (!payout?.accountNumber) {
    return `<div class="navbtn" data-nav="seller" style="border-radius:14px; background:#F8FAFC; border:1px dashed #CBD5E1; padding:18px; text-align:center; color:#64748B; font-size:13px;">No payout account yet. Tap to add where you get paid.</div>`;
  }
  const bank = payout.bankName || "Bank account";
  const acct = payout.accountNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
  return `<div style="border-radius:14px; background:linear-gradient(150deg,#14304A,#0F172A); color:#fff; padding:16px; min-height:120px; display:flex; flex-direction:column; justify-content:space-between;">
      <div style="display:flex; align-items:center; justify-content:space-between;"><span style="font-size:13px; font-weight:500; color:rgba(255,255,255,.72);">${esc(bank)}</span><span style="font-size:10px; padding:2px 7px; background:#059669; color:#fff; border-radius:4px; letter-spacing:.08em; font-weight:600;">DEFAULT</span></div>
      <div><div style="font-family:ui-monospace,'SF Mono',Menlo,monospace; font-size:19px; letter-spacing:.06em; font-variant-numeric:tabular-nums; margin-top:24px;">${esc(acct)}</div><div style="font-size:12px; color:rgba(255,255,255,.6); margin-top:3px;">${esc((payout.accountName || "").toUpperCase())}</div></div>
    </div>`;
}

/** Identity verification checklist. */
function verifyListHtml(verified: boolean, phone: string, email: string): string {
  const rows: { k: string; v: string; ok: boolean; mono?: boolean }[] = [
    { k: "BVN", v: verified ? "•••• •••• verified" : "Not linked", ok: verified, mono: true },
    { k: "NIN", v: verified ? "•••• •••• verified" : "Not linked", ok: verified, mono: true },
    { k: "Phone", v: phone || "Not added", ok: !!phone },
    { k: "Email", v: email ? "Verified" : "Not added", ok: !!email },
    { k: "Business name", v: "Not added", ok: false },
  ];
  return rows
    .map((r, i) => {
      const check = r.ok
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        : `<span class="navbtn" data-nav="seller" style="font-size:12px; font-weight:600; color:#0F172A; padding:5px 12px; border:1px solid #E6EAF0; border-radius:9px;">Add</span>`;
      return `<div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0;${i === rows.length - 1 ? "" : " border-bottom:1px solid #EEF2F6;"}"><div style="min-width:0;"><div style="font-size:10.5px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8;">${r.k}</div><div style="font-size:13px; color:#0F172A; margin-top:2px;${r.mono ? " font-family:ui-monospace,Menlo,monospace;" : ""}">${esc(r.v)}</div></div>${check}</div>`;
    })
    .join("");
}

function riskBand(score: number): string {
  if (score >= 70) return "Low risk range (70–100)";
  if (score >= 40) return "Medium risk range (40–69)";
  return "Building trust (0–39)";
}

/** Downscale an image file to a small JPEG data URL (for the avatar). */
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 240;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
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

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, string | number>>();
  const emailRef = useRef("");
  const profRef = useRef<LoadedProfile | null>(null);
  const dirtyRef = useRef(false);
  const wiredRef = useRef(false);

  function q<T extends Element>(sel: string): T | null {
    return document.querySelector<T>(`.screenhost ${sel}`);
  }
  function saveLabelEl(): HTMLElement | null {
    return q<HTMLElement>('[data-action="saveNames"] [data-bind="saveLabel"]');
  }
  function setButton(enabled: boolean, label?: string) {
    dirtyRef.current = enabled;
    const btn = q<HTMLElement>('[data-action="saveNames"]');
    if (btn) {
      btn.style.opacity = enabled ? "1" : "0.45";
      btn.style.pointerEvents = enabled ? "auto" : "none";
    }
    const l = saveLabelEl();
    if (l && label != null) l.textContent = label;
  }
  function setReadonly(name: string, ro: boolean) {
    const el = q<HTMLInputElement>(`[data-field="${name}"]`);
    if (!el) return;
    el.readOnly = ro;
    el.style.opacity = ro ? "0.55" : "1";
    el.style.cursor = ro ? "not-allowed" : "text";
  }

  function applyLocks(prof: LoadedProfile) {
    setReadonly("firstName", prof.hasRecord);
    setReadonly("lastName", prof.hasRecord);
    setReadonly("otherNames", prof.otherLocked);
    setButton(false, "Save");
    const note = q<HTMLElement>('[data-bind="lockNote"]');
    if (note) {
      note.textContent = prof.hasRecord
        ? prof.otherLocked
          ? "Names are locked. You can still change your username or photo."
          : "Names are locked. You can add one other name; username and photo stay editable."
        : "You can edit your names once. After you save, first & last names are locked.";
    }
    if (!wiredRef.current) {
      wiredRef.current = true;
      ["firstName", "otherNames", "lastName", "username"].forEach((n) => {
        const el = q<HTMLInputElement>(`[data-field="${n}"]`);
        el?.addEventListener("input", () => {
          if (!el.readOnly) setButton(true, "Save changes");
        });
      });
      const photo = document.getElementById("tf-photo") as HTMLInputElement | null;
      photo?.addEventListener("change", () => {
        const f = photo.files?.[0];
        if (f) void onPhoto(f);
      });
    }
  }

  async function onPhoto(file: File) {
    let dataUrl: string;
    try {
      dataUrl = await resizePhoto(file);
    } catch {
      return;
    }
    const av = q<HTMLElement>('[data-photo="photo"]');
    if (av) {
      av.style.backgroundImage = `url("${dataUrl}")`;
      av.style.backgroundSize = "cover";
      av.style.backgroundPosition = "center";
      av.textContent = "";
    }
    try {
      await saveUserProfile({ photo: dataUrl }, emailRef.current || undefined);
    } catch {
      /* keep the local preview even if the save fails */
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email || "";
      emailRef.current = email;
      const fullName = user?.name || (email ? email.split("@")[0] : "there");
      if (alive) setData((p) => ({ ...p, initials: initialsOf(fullName), name: fullName, email: email || "Not signed in" }));

      const [rep, seller, loaded] = await Promise.all([
        getMyReputation(email, user?.name).catch(() => null),
        loadSellerProfile(email).catch(() => null),
        loadUserProfile(email).catch(() => ({ firstName: "", otherNames: "", lastName: "", username: "", photo: "", hasRecord: false, otherLocked: false }) as LoadedProfile),
      ]);
      if (!alive) return;
      profRef.current = loaded;
      const base = splitName(fullName);
      const payout = seller?.payout;
      const score = rep?.score ?? 0;
      const stats = rep?.stats;
      setData((p) => ({
        ...p,
        firstName: loaded.firstName || base.firstName,
        otherNames: loaded.otherNames || base.otherNames,
        lastName: loaded.lastName || base.lastName,
        username: loaded.username || "",
        photo: loaded.photo || "",
        verifyPill: seller?.verified ? "NIN · BVN verified" : "Identity not verified",
        scoreBig: score || "—",
        scoreDelta: rep?.tierLabel ?? "",
        riskRange: rep ? riskBand(score) : "",
        scoreChart: scoreChartHtml(score),
        statTotal: stats?.total ?? 0,
        statSuccess: stats?.completed ?? 0,
        statDisputes: stats?.disputed ?? 0,
        payoutCard: payoutCardHtml(payout),
        verifyList: verifyListHtml(seller?.verified === true, seller?.phone || "", email),
      }));
      // Apply locks + wire inputs after the screen has bound the values.
      setTimeout(() => alive && profRef.current && applyLocks(profRef.current), 40);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const actions = {
    saveNames: async () => {
      if (!dirtyRef.current) return; // disabled
      const val = (n: string) => q<HTMLInputElement>(`[data-field="${n}"]`)?.value.trim() || "";
      const l = saveLabelEl();
      if (l) l.textContent = "Saving…";
      const err = q<HTMLElement>('[data-bind="err"]');
      if (err) err.textContent = "";
      try {
        const saved = await saveUserProfile(
          { firstName: val("firstName"), otherNames: val("otherNames"), lastName: val("lastName"), username: val("username") },
          emailRef.current || undefined,
        );
        profRef.current = { ...saved, hasRecord: true, otherLocked: !!saved.otherNames };
        applyLocks(profRef.current);
        if (l) l.textContent = "Saved ✓";
        setTimeout(() => setButton(false, "Save"), 1500);
      } catch (e) {
        if (err) err.textContent = e instanceof ApiError ? e.message : "Couldn't save. Please try again.";
        setButton(true, "Save changes"); // keep enabled to retry
      }
    },
    // Preference switches — functional client-side toggles.
    toggle: (_f: Record<string, string>, el: HTMLElement) => {
      const on = el.getAttribute("data-on") !== "1";
      el.setAttribute("data-on", on ? "1" : "0");
      el.style.background = on ? "#059669" : "#CBD5E1";
      const dot = el.firstElementChild as HTMLElement | null;
      if (dot) dot.style.left = on ? "19px" : "2px";
    },
    signout: async () => {
      try {
        await signOut();
      } catch {
        /* proceed to login regardless */
      }
      router.push("/login");
    },
  };

  return <ScreenHtml html={html} data={data} actions={actions} />;
}
