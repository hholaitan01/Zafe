import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "fake-payment-alerts-nigeria";
const title = "Fake payment alerts in Nigeria: how sellers can protect themselves";
const dek = "The fake alert is the scam run on sellers: a doctored screenshot or spoofed message that pressures you to hand over goods before the money is real. Here is how to shut it down.";

export const metadata = guideMeta({
  title,
  description:
    "Fake payment alerts in Nigeria: how the scam works, the red flags sellers should watch for, why you must confirm money in your account before releasing goods, and how escrow removes the risk entirely.",
  slug,
});

const faqs: Faq[] = [
  { q: "What is a fake payment alert?", a: "It is a forged proof of payment used to trick a seller into releasing goods. It can be a doctored bank-app screenshot, a spoofed SMS or email that looks like a credit alert, or a genuine-looking transfer receipt for a payment that was never actually sent or was later reversed." },
  { q: "How do I avoid falling for one?", a: "Never rely on a screenshot or an alert message. Confirm the money has actually landed in your own account by checking your real bank balance or statement yourself before you release anything. If you cannot see the funds, the payment has not happened." },
  { q: "Are transfer receipts safe to trust?", a: "No. A receipt or 'successful transfer' page only shows what the sender did on their side; it does not prove the money reached you, and some can be edited. Your own account balance is the only proof that counts." },
  { q: "How does escrow stop fake alerts completely?", a: "With escrow, you never rely on the buyer's proof at all. The platform confirms the payment at the bank and holds it before you ship. When the deal shows funded, the money is genuinely there and cannot be reversed, so there is nothing to fake." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-09" faqs={faqs}>
      <p>
        If buyers get scammed by paying first, sellers get scammed by shipping first. The tool is the fake payment alert:
        a forged screenshot or a spoofed &ldquo;credit alert&rdquo; that pressures you to hand over the item before real money has
        reached you. By the time you check your balance, the goods and the buyer are gone.
      </p>

      <h2>How the fake-alert scam works</h2>
      <ul>
        <li><strong>The doctored screenshot.</strong> An edited bank-app image showing a transfer that never happened.</li>
        <li><strong>The spoofed alert.</strong> An SMS or email dressed up to look like your bank&apos;s credit alert.</li>
        <li><strong>The reversed transfer.</strong> A real-looking payment that is cancelled or recalled shortly after you ship.</li>
        <li><strong>The pressure.</strong> Always urgency: the rider is waiting, they are &ldquo;in a hurry&rdquo;, ship now and send the tracking.</li>
      </ul>

      <h2>The one rule that defeats it</h2>
      <p>
        Never release goods on the strength of a screenshot or an alert message. Confirm the money is actually in your own
        account, by checking your real balance or statement yourself, before you ship or hand anything over. If you cannot
        see the funds in your account, you have not been paid.
      </p>

      <div className="g-note"><p>
        A proof of payment shows what the buyer did on their side. Your account balance shows what actually reached you.
        Only the second one is real. Trust that, never the screenshot.
      </p></div>

      <h2>Let escrow remove the risk</h2>
      <p>
        The cleanest fix is to stop relying on the buyer&apos;s proof at all. With <Link href="/escrow-nigeria">escrow</Link>,
        the payment is confirmed at the bank and held before you ship. When a Zafe deal shows <strong>funded</strong>, the
        money is genuinely there and cannot be pulled back, so a fake alert has nothing to stand on. See how this protects
        you in <Link href="/seller-protection">seller protection</Link>.
      </p>

      <h2>A quick seller checklist</h2>
      <ul>
        <li>Check your own bank balance before releasing anything &mdash; never a screenshot.</li>
        <li>Ignore urgency; a real buyer can wait for the money to clear.</li>
        <li>Be wary of &ldquo;overpayment, send the balance back&rdquo; requests &mdash; a classic reversal trap.</li>
        <li>For anything that matters, deal through escrow so the money is verified and held before you ship.</li>
      </ul>

      <p className="g-body"><Link href="/how-it-works">Next: see the full Zafe flow, from funded to payout.</Link></p>
    </GuideShell>
  );
}
