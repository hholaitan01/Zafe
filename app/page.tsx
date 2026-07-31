// This is a placeholder so the app boots and you can verify your backend
// routes work. Deji owns the real landing screen (from the finished Figma
// design) — this file will get replaced by that.

export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>TrustFlow AI</h1>
      <p style={{ color: "#9FB3A8" }}>
        Backend is running. This placeholder page will be replaced by Deji&apos;s real
        landing screen once it&apos;s built from Figma.
      </p>
      <p style={{ marginTop: 16, fontSize: 14, color: "#9FB3A8" }}>
        API routes to test in the meantime: <code>/api/escrow</code>, <code>/api/payout</code>,{" "}
        <code>/api/refund</code>, <code>/api/receipt/[id]</code>
      </p>
    </main>
  );
}
