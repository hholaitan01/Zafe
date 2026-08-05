"use client";

/* ==========================================================================
   Toasts — transient success / error / info confirmations.

   A tiny, dependency-free version of the Sonner idea: call `toast.success(...)`
   from anywhere, no context or provider wiring at the call site. A single
   <ToastHost/> (mounted once in the root layout) renders the stack. Auto-dismiss,
   tap to dismiss, pause while the tab is hidden. Enter/exit are CSS transitions
   (interruptible), styled in globals.css (.tf-toasts / .tf-toast).
   ========================================================================== */

import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";
interface ToastItem { id: number; type: ToastType; message: string; leaving?: boolean }

type Listener = (t: ToastItem) => void;
let listeners: Listener[] = [];
let counter = 0;

function emit(type: ToastType, message: string) {
  const item: ToastItem = { id: ++counter, type, message };
  listeners.forEach((l) => l(item));
}

/** Fire a toast from anywhere: `toast.success("Saved")`, `toast.error(...)`. */
export const toast = Object.assign((message: string) => emit("info", message), {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  info: (message: string) => emit("info", message),
});

const DURATION = 3800;

function Icon({ type }: { type: ToastType }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (type === "success") return <svg width="17" height="17" viewBox="0 0 24 24" {...p}><path d="M20 6 9 17l-5-5" /></svg>;
  if (type === "error") return <svg width="17" height="17" viewBox="0 0 24 24" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
  return <svg width="17" height="17" viewBox="0 0 24 24" {...p}><path d="M12 8h.01M11 12h1v4h1" /><circle cx="12" cy="12" r="9" /></svg>;
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const timers = new Map<number, ReturnType<typeof setTimeout>>();
    const remove = (id: number) => {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== id)), 240);
    };
    const listener: Listener = (t) => {
      setItems((prev) => [...prev.slice(-2), t]); // cap the stack at 3
      timers.set(t.id, setTimeout(() => remove(t.id), DURATION));
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      timers.forEach(clearTimeout);
    };
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, leaving: true } : x)).filter((x) => x.id !== id || x.leaving));

  if (!items.length) return null;
  return (
    <div className="tf-toasts" role="region" aria-live="polite" aria-label="Notifications">
      {items.map((t) => (
        <button key={t.id} type="button" className={`tf-toast tf-toast--${t.type}`} data-leaving={t.leaving || undefined} onClick={() => dismiss(t.id)}>
          <span className="tf-toast-ic"><Icon type={t.type} /></span>
          <span className="tf-toast-msg">{t.message}</span>
        </button>
      ))}
    </div>
  );
}
