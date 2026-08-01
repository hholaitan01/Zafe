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
          : "Names are locked — you may add an other name once. Username & photo stay editable."
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
      setData((p) => ({
        ...p,
        firstName: loaded.firstName || base.firstName,
        otherNames: loaded.otherNames || base.otherNames,
        lastName: loaded.lastName || base.lastName,
        username: loaded.username || "",
        photo: loaded.photo || "",
        ...(rep ? { scoreLine: `Trust Score ${rep.score} · ${rep.tierLabel}` } : {}),
        idStatus: seller?.verified ? "✓ Verified" : "Not verified — tap to verify",
        payout: payout?.accountNumber ? `${payout.bankName ? payout.bankName + " · " : ""}${payout.accountNumber}` : "Not set — tap to add",
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
