import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "get-paid-safely-online-nigeria";
const title = "How to get paid safely online as a seller in Nigeria";
const dek = "Selling online means shipping to strangers who are just as worried about you as you are about them. Here is how to get paid without fake alerts, chargebacks, or wasted deliveries.";

export const metadata = guideMeta({
  title,
  description:
    "How Nigerian sellers can get paid safely online: confirm real money before you ship, avoid fake payment alerts and overpayment scams, use escrow so funds are verified and held, and get paid to a verified account.",
  slug,
});

const faqs: Faq[] = [
  { q: "What is the safest way to get paid as an online seller?", a: "Do not ship on the strength of a screenshot or an alert. Either confirm the money has truly landed in your own account first, or use escrow so the payment is verified and held before you ship and cannot be reversed afterwards." },
  { q: "How do I avoid the fake payment alert scam?", a: "Never rely on the buyer's proof of payment. Check your own bank balance yourself before releasing anything, or let escrow verify the payment at the bank for you. If you cannot see the funds, you have not been paid." },
  { q: "What is the overpayment scam?", a: "A buyer 'accidentally' overpays with a fake or reversible payment, then asks you to refund the difference. You send real money back before their payment fails or reverses. Never refund against an incoming payment you have not truly received." },
  { q: "How does escrow help sellers get paid safely?", a: "The buyer's money is verified and held before you ship, so you are never delivering on a maybe. It cannot be reversed, and you are paid to your identity-verified account once delivery is confirmed." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-12" faqs={faqs}>
      <p>
        Getting paid should be the easy part of a sale, but for online sellers it is where the risk lives: fake alerts,
        reversed transfers, overpayment tricks, and buyers who refuse a delivery you already paid to send. A few habits,
        and the right tool, remove almost all of it.
      </p>

      <h2>1. Never ship on a screenshot</h2>
      <p>
        A proof of payment shows what the buyer did on their side, not what reached you. Confirm the money is actually in
        your own account before you release anything. This one habit defeats the most common scam run on sellers &mdash; the{" "}
        <Link href="/guides/fake-payment-alerts-nigeria">fake payment alert</Link>.
      </p>

      <h2>2. Watch for the overpayment trap</h2>
      <p>
        If a buyer &ldquo;overpays&rdquo; and asks you to send the balance back, stop. The incoming payment is often fake or
        reversible, and the refund you send is real. Never pay out against money you have not genuinely received.
      </p>

      <h2>3. Let escrow verify and hold the money</h2>
      <p>
        The cleanest fix is to stop relying on the buyer&apos;s proof at all. With <Link href="/escrow-nigeria">escrow</Link>,
        the payment is verified at the bank and held before you ship. When the deal shows funded, the money is genuinely
        there and cannot be pulled back. Instead of sharing an account number, you can send a{" "}
        <Link href="/guides/safe-payment-links-for-nigerian-sellers">protected payment link</Link>.
      </p>

      <h2>4. Get paid to a verified account</h2>
      <p>
        Payouts go only to an identity-verified account you control, and changing it is protected by an extra confirmation
        step and a cooldown, so no one can quietly redirect your money. See what this covers in{" "}
        <Link href="/seller-protection">seller protection</Link>.
      </p>

      <div className="g-note"><p>
        The rule for sellers: never ship on a screenshot. Confirm real money in your own account, or let escrow verify and
        hold it, and get paid to an account only you control.
      </p></div>

      <p className="g-body"><Link href="/how-it-works">Next: see the full Zafe flow, from funded to payout.</Link></p>
    </GuideShell>
  );
}
