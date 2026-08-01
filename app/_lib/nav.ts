/* Maps a screen's `data-nav` target (from the original design) to a real
   app route. When any element with data-nav is tapped, ScreenHtml routes here. */
export const NAV: Record<string, string> = {
  splash: "/",
  auth: "/login",
  dashboard: "/dashboard",
  "new-escrow": "/new-escrow",
  "trust-low": "/trust-score",
  "trust-high": "/trust-score-high",
  fund: "/fund",
  expiry: "/expiry",
  locked: "/locked",
  timeline: "/timeline",
  dispute: "/dispute",
  released: "/released",
  deliverycode: "/delivery-code",
  proof: "/proof",
  inspection: "/inspection",
  receipt: "/receipt",
  kyc: "/seller",
  seller: "/seller",
  profile: "/profile",
};
