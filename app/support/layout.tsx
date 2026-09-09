/* Metadata for /support. This route is kept out of the index (it's an
   in-app help surface, disallowed in robots.txt), but it still gets a proper,
   unique title. */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Zafe: your deals, payments, disputes, and account.",
  robots: { index: false, follow: false },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
