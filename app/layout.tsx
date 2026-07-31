import "./globals.css";

export const metadata = {
  title: "TrustFlow AI",
  description: "AI-powered escrow for peer-to-peer transactions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
