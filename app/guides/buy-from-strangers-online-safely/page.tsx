import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "buy-from-strangers-online-safely";
const title = "How to buy from a stranger online safely";
const dek = "A short checklist for buying from social-media vendors and marketplaces without losing your money.";

export const metadata = guideMeta({
  title,
  description: "A practical checklist for buying safely from strangers online in Nigeria: check the seller, keep the deal on record, use escrow, verify delivery, and know what to do if it goes wrong.",
  slug,
});

const faqs: Faq[] = [
  { q: "How do I buy from a stranger online without getting scammed?", a: "Do not pay the seller directly. Use escrow so your money is held safely until you confirm the item arrived. Check the seller's history, keep the terms in writing, and never trust a screenshot as proof of anything." },
  { q: "What should I check before paying an online seller?", a: "The seller's track record and reviews, whether their story and prices are consistent, and whether they will use a protected payment method. A brand new account with no history selling something valuable is the riskiest case." },
  { q: "What do I do if a seller scams me?", a: "If you paid through escrow, open a dispute and the money stays locked until it is settled, with a refund if the item never arrived. If you paid a personal account directly, report it to your bank and the platform, though recovery is much harder." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-08-26" faqs={faqs}>
      <p>
        Most sellers on WhatsApp, Instagram, and marketplaces are real people doing honest business. The problem is you cannot tell the honest ones from the rest before you pay, and paying is the point of no return. This checklist keeps you safe without making you paranoid.
      </p>

      <h2>Before you pay</h2>
      <ul>
        <li><strong>Check who you are dealing with.</strong> Look at the seller&apos;s history, reviews, and how long the account has existed. New account, no track record, high-value item, is the combination to be most careful with.</li>
        <li><strong>Make the story add up.</strong> Consistent details, clear photos, and a price that is not suspiciously low. If something feels off, it usually is.</li>
        <li><strong>Get the terms in writing.</strong> The exact item, the price, delivery, and timing, all agreed in the chat. This is your record if there is a disagreement later.</li>
        <li><strong>Refuse to be rushed.</strong> &ldquo;Last one,&rdquo; &ldquo;pay now,&rdquo; and countdowns are pressure tactics. A real seller can wait for you to feel comfortable.</li>
      </ul>

      <h2>How you pay is the whole game</h2>
      <p>
        The single biggest decision is how you pay. Paying a personal account directly means your only protection after the transfer is the seller&apos;s goodwill. <Link href="/guides/what-is-escrow">Escrow</Link> flips that: your money is held by a neutral party, the seller ships knowing it is real, and it is released only when you confirm the item arrived and matches. If it does not, you get refunded.
      </p>
      <div className="g-note"><p>With Zafe you pay into escrow instead of the seller, from any Nigerian bank. An AI reads the deal chat and flags scam tactics before you pay, and the seller is only paid out after you confirm, to an identity-verified account.</p></div>

      <h2>When the item arrives</h2>
      <ul>
        <li><strong>Check it before you confirm.</strong> Once you release escrow, the money is the seller&apos;s. Open the package, test the item, and make sure it matches what was agreed first.</li>
        <li><strong>Only confirm when you are satisfied.</strong> If it is wrong, damaged, or fake, do not confirm. Open a dispute instead.</li>
      </ul>

      <h2>If it goes wrong</h2>
      <p>
        If you paid through escrow, you are protected: open a <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">dispute</Link>, explain what happened with any evidence, and the money stays locked until it is settled. A fair outcome, refund, release, or a split, is decided on the evidence, and the money is returned to you if the item never arrived or was not as described. If you paid a personal account directly, report it to your bank and the platform quickly, but know that recovery is far harder. That is exactly why the payment method matters so much.
      </p>

      <p className="g-body"><Link href="/guides">See all guides</Link></p>
    </GuideShell>
  );
}
