/* Metadata for /login. The page is a client component, so its title,
   description, and self-canonical live here in a server layout. */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Zafe to create protected deals, fund escrow, and track your money. Passwordless: continue with Google or a one-time email link.",
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
