/* VerifiedBadge — the scalloped "verified" seal shown next to a seller who has
   passed identity (BVN/NIN) checks. A filled emerald seal with a white check;
   on dark-aware screens in dark mode it flips to a white seal with an emerald
   check (styles in globals.css: .zvb-seal / .zvb-check). Render it only when the
   seller is actually verified. */

export default function VerifiedBadge({ size = 15, title = "Verified seller" }: { size?: number; title?: string }) {
  return (
    <svg
      className="zvb"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      style={{ flexShrink: 0, verticalAlign: "text-bottom" }}
    >
      <title>{title}</title>
      <path className="zvb-seal" d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path className="zvb-check" d="m9 12 2 2 4-4" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
