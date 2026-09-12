import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "safe-payment-links-for-nigerian-sellers";
const title = "Safe payment links for Nigerian sellers";
const dek = "Sharing your account number puts the risk on the buyer and the fake-alert risk on you. A protected payment link flips both. Here is how it works for sellers.";

export const metadata = guideMeta({
  title,
  description:
    "Safe payment links for Nigerian sellers: instead of sharing a personal account number, send a protected escrow link. The buyer pays into a hold, you ship against verified funds, and there are no fake alerts or chargebacks.",
  slug,
});

const faqs: Faq[] = [
  { q: "What is a safe payment link?", a: "Instead of sending a buyer your account number, you send a link to a protected deal. The buyer pays into escrow, the payment is verified and held, and you are paid once delivery is confirmed. It looks as simple as sharing an account, but with protection built in for both sides." },
  { q: "Why not just share my account number?", a: "A bare account number gives the buyer no protection, so cautious buyers hesitate, and it exposes you to fake payment alerts and reversals. A protected link removes both problems, which often closes more sales." },
  { q: "Does a payment link protect me as the seller?", a: "Yes. You ship against money that is genuinely verified and held, so there is nothing to fake and nothing to reverse. That is the opposite of trusting a screenshot." },
  { q: "How do I get paid from a payment link?", a: "To your identity-verified payout account, once the buyer confirms delivery with their handover code, or via auto-release if they go silent after delivery. Changing that payout account is protected by an extra confirmation step and a cooldown." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-12" faqs={faqs}>
      <p>
        Most Nigerian sellers close a sale by dropping an account number in the chat. It is quick, but it puts all the risk
        on the buyer, and it leaves you exposed to{" "}
        <Link href="/guides/fake-payment-alerts-nigeria">fake payment alerts</Link> and reversals. A protected payment
        link fixes both sides at once.
      </p>

      <h2>Account number vs protected link</h2>
      <ul>
        <li><strong>Account number:</strong> the buyer pays on pure trust, and you have to trust their proof of payment. Both sides are exposed.</li>
        <li><strong>Protected link:</strong> the buyer pays into escrow and can see they are protected, and you ship against verified, held funds. Neither side has to trust a screenshot.</li>
      </ul>

      <h2>Why it wins you more sales</h2>
      <p>
        A cautious buyer who would hesitate to transfer to a stranger&apos;s personal account will happily pay into a
        protected hold, because their money is safe until they confirm delivery. Offering protection is often what turns a
        &ldquo;let me think about it&rdquo; into a completed order. It is the seller side of{" "}
        <Link href="/buyer-protection">buyer protection</Link>.
      </p>

      <div className="g-note"><p>
        Sharing an account number asks the buyer to trust you. Sharing a protected link means neither side has to trust
        the other. That is easier to sell, and far safer for you.
      </p></div>

      <h2>How it protects you</h2>
      <p>
        You ship only against money that is verified and held, so a fake alert has nothing to stand on and there is no
        payment to reverse. Payouts go only to your{" "}
        <Link href="/seller-protection">identity-verified account</Link>. See the full flow in{" "}
        <Link href="/how-it-works">how Zafe works</Link>.
      </p>

      <p className="g-body"><Link href="/guides/get-paid-safely-online-nigeria">Next: how to get paid safely online as a seller.</Link></p>
    </GuideShell>
  );
}
