/* Metadata for /waitlist. The page itself is a client component, so its title,
   description, and self-canonical live here in a server layout. */
import type { Metadata } from "next";
import { SITE_SUMMARY, SITE_URL } from "../_lib/site";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description: "Be first to use Zafe: AI-checked escrow that keeps your money safe when you buy from strangers online in Nigeria. Join the waitlist for early access.",
  alternates: { canonical: "/waitlist" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/waitlist`,
    title: "Join the Zafe waitlist",
    description: SITE_SUMMARY,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
