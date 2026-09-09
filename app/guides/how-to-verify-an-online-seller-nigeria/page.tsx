import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "how-to-verify-an-online-seller-nigeria";
const title = "How to verify an online seller in Nigeria";
const dek = "Before you pay a vendor you found in a DM, a few checks separate a real seller from a scammer. Here is a practical way to verify one.";

export const metadata = guideMeta({
  title,
  description:
    "How to verify an online seller in Nigeria before you pay: check their track record, identity, reviews and payment method, and use a Trust Score and escrow to remove the guesswork.",
  slug,
});

const faqs: Faq[] = [
  { q: "How can I tell if an Instagram or WhatsApp seller is real?", a: "Look for a real track record: an account that has traded for a while, consistent posts, genuine tagged customers, and a willingness to verify their identity. Refusing any check, rushing you, or insisting on a personal-account transfer are warning signs." },
  { q: "Are screenshots of reviews reliable?", a: "Not on their own. Screenshots are trivial to fake or borrow. Prefer independent signals: tagged customers you can actually message, a long posting history, and a verifiable identity, rather than a folder of testimonial images." },
  { q: "What is a Trust Score?", a: "On Zafe, every seller carries a Trust Score from 0 to 100, built from verified identity, completed deals, past disputes and account age. It turns 'do I trust this stranger' into a number you can see before you pay." },
  { q: "What is the single safest step?", a: "Do not send money to a personal account on trust. Pay through escrow instead, so the seller only gets paid after you confirm the item arrived. It makes seller verification far less of a gamble." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-09" faqs={faqs}>
      <p>
        Anyone can set up a shop-front in a DM. The vendor you are about to pay might have shipped a hundred happy orders,
        or might be a week-old account running a script. A few checks tell the two apart before your money is at risk.
      </p>

      <h2>1. Look for a real track record</h2>
      <p>
        Scroll past the top posts. A genuine seller usually has months of consistent activity, real customers who tagged
        them, and a coherent history. A brand-new account, a sudden pivot from an unrelated page, or a feed of only stock
        images are all reasons to slow down.
      </p>

      <h2>2. Ask them to verify their identity</h2>
      <p>
        A real seller has no problem confirming who they are. Someone who refuses every form of verification, or gets
        defensive when you ask, is telling you something. On Zafe, seller payouts only ever reach an{" "}
        <Link href="/seller-protection">identity-verified account</Link>, so a banned scammer cannot simply reappear.
      </p>

      <h2>3. Treat reviews with healthy suspicion</h2>
      <p>
        Screenshots of glowing reviews prove very little; they are easy to fake or copy. Look for signals you can check
        yourself: customers you can actually message, tagged posts, and a track record over time.
      </p>

      <h2>4. Watch the payment method</h2>
      <p>
        The biggest red flag is pressure to pay a personal account up front, especially with urgency (&ldquo;last one&rdquo;, &ldquo;pay now
        to hold it&rdquo;). That is the setup for most{" "}
        <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">social-media scams</Link>. A seller who is happy to use
        escrow is a seller with nothing to hide.
      </p>

      <div className="g-note"><p>
        Verification is really about not going first with your money. A Trust Score gives you a number to judge a seller
        by, and escrow means they are paid only after you confirm delivery, so a wrong call costs you far less.
      </p></div>

      <h2>Let the system do the checking</h2>
      <p>
        Zafe combines these signals for you: a <Link href="/escrow-nigeria">held payment</Link>, an AI that reads the deal
        chat for scam patterns before you pay, and a Trust Score on every seller. See{" "}
        <Link href="/how-it-works">how it works</Link>.
      </p>

      <p className="g-body"><Link href="/guides/buy-a-phone-safely-online-nigeria">Next: how to buy a phone safely from a WhatsApp or Instagram seller.</Link></p>
    </GuideShell>
  );
}
