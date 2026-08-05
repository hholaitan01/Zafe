"use client";

/* ==========================================================================
   Shared state primitives — the one system for loading, empty, error, and
   success across every screen. Styles live in app/globals.css (.tf-spin,
   .tf-skel, .tf-state, .tf-success) so these work in and out of the app shell.

   - Spinner      buttons + small inline loads
   - Skeleton     shape-matched placeholders for data-heavy sections
   - EmptyState   nothing here yet (icon + title + copy + optional action)
   - ErrorState   a load/action failed (offers a retry)
   - SuccessNote  small inline confirmation
   ========================================================================== */

import type { CSSProperties, ReactNode } from "react";

/** Small spinner. Inherits currentColor; pass `light` on dark surfaces. */
export function Spinner({ light = false, size = 16, style }: { light?: boolean; size?: number; style?: CSSProperties }) {
  return <span className={`tf-spin${light ? " tf-spin--light" : ""}`} style={{ width: size, height: size, ...style }} role="status" aria-label="Loading" />;
}

/** A single shimmer block. Set width/height/radius to mirror the real element. */
export function Skeleton({ w = "100%", h = 12, circle = false, radius = 8, style }: { w?: number | string; h?: number | string; circle?: boolean; radius?: number | string; style?: CSSProperties }) {
  return <span className="tf-skel" aria-hidden style={{ display: "block", width: w, height: h, borderRadius: circle ? "50%" : radius, ...style }} />;
}

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Nothing-here-yet state. `title` required; `children` is the supporting line. */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="tf-state" role="status">
      {icon && <div className="tf-state-ic" style={{ color: "#94A3B8" }}>{icon}</div>}
      <div className="tf-state-t">{title}</div>
      {children && <p className="tf-state-s">{children}</p>}
      {action && <div className="tf-state-act">{action}</div>}
    </div>
  );
}

/** A load or action failed. Renders a retry button when `onRetry` is given. */
export function ErrorState({ title = "Something went wrong", children, onRetry, retrying = false }: { title?: string; children?: ReactNode; onRetry?: () => void; retrying?: boolean }) {
  return (
    <div className="tf-state tf-state--error" role="alert">
      <div className="tf-state-ic" style={{ color: "var(--danger)" }}>
        <svg width="26" height="26" viewBox="0 0 24 24" {...ICON}><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
      </div>
      <div className="tf-state-t">{title}</div>
      <p className="tf-state-s">{children ?? "We couldn't load this. Check your connection and try again."}</p>
      {onRetry && (
        <div className="tf-state-act">
          <button className="tf-btn tf-btn--secondary" onClick={onRetry} disabled={retrying}>
            {retrying ? <><Spinner size={15} /> Retrying…</> : "Try again"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Small inline success confirmation. */
export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <div className="tf-success" role="status">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      {children}
    </div>
  );
}
