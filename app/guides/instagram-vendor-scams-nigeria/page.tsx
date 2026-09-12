import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "instagram-vendor-scams-nigeria";
const title = "Instagram vendor scams in Nigeria: how to buy from IG shops safely";
const dek = "Instagram is a giant shop-front with no checkout and no protection. Here are the vendor scams to know, and how to buy from an IG store without losing your money.";

export const metadata = guideMeta({
  title,
  description:
    "Instagram vendor scams in Nigeria: fake shops, stolen photos, cloned pages, deposit-and-disappear and comment testimonials, plus how to check an IG vendor and pay through escrow so you only release money after delivery.",
  slug,
});

const faqs: Faq[] = [
  { q: "How do I know if an Instagram vendor is real?", a: "Look past the grid: a real store usually has a long, consistent history, customers who tagged them in real posts, and a willingness to verify their identity. Cloned pages, stolen product photos, all-comments-disabled and pressure to pay a personal account fast are warning signs." },
  { q: "Why are Instagram DMs risky for payments?", a: "There is no checkout and no buyer protection in a DM. You are asked to transfer to a personal account on trust, and once it lands there is nothing to reverse. Scammers rely on that." },
  { q: "What is the cloned-page scam?", a: "A scammer copies a real vendor's photos, name and bio onto a lookalike page, then slides into the comments or DMs of the real vendor's customers offering a 'discount'. Always check you are dealing with the genuine account, not a copy with a slightly different handle." },
  { q: "How does escrow make buying on Instagram safe?", a: "Instead of transferring to the vendor's account on trust, you pay into a neutral hold. The money is released only after the item arrives and is correct, so a fake shop or a cloned page cannot simply take your money and vanish." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-12" faqs={faqs}>
      <p>
        Instagram is where a huge amount of Nigerian shopping happens, and it was never built for it. There is no
        checkout, no buyer protection, and no neutral party: just a DM, a personal account number, and your trust. That
        gap is exactly what vendor scammers work in.
      </p>

      <h2>The IG vendor scams to know</h2>
      <ul>
        <li><strong>The fake shop.</strong> A page of stolen product photos and borrowed reviews, set up to take deposits and disappear.</li>
        <li><strong>The cloned page.</strong> A copy of a real vendor, same photos and name, a slightly different handle, messaging that vendor&apos;s customers with a &ldquo;discount&rdquo;.</li>
        <li><strong>Deposit and disappear.</strong> A great price, urgency to pay a deposit to &ldquo;hold&rdquo; it, then silence.</li>
        <li><strong>Comment testimonials.</strong> Rows of glowing comments that are easy to fake or buy, used to look established.</li>
      </ul>

      <h2>How to buy from an IG store safely</h2>
      <ul>
        <li><strong>Confirm you have the real account,</strong> not a clone with an off-by-one handle. Check the follower history and post dates.</li>
        <li><strong>Verify the vendor.</strong> Use the checks in <Link href="/guides/how-to-verify-an-online-seller-nigeria">how to verify an online seller</Link>: real track record, verifiable identity, tagged customers you can actually message.</li>
        <li><strong>Ignore urgency.</strong> &ldquo;Last one, pay now&rdquo; is pressure, not a deal.</li>
        <li><strong>Never transfer to a personal account on trust.</strong> That is the moment the money is gone.</li>
      </ul>

      <div className="g-note"><p>
        The safest habit on Instagram is simple: do not send money to a personal account. Pay into escrow instead, so the
        vendor is paid only after you have the item.
      </p></div>

      <h2>Let escrow close the gap</h2>
      <p>
        With <Link href="/escrow-nigeria">escrow</Link>, you pay into a neutral hold rather than the vendor&apos;s account, an
        AI checks the deal chat for scam patterns before you pay, and the money is released only when the item arrives.
        See <Link href="/how-it-works">how it works</Link>, and the general playbook in{" "}
        <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">how to avoid WhatsApp and Instagram scams</Link>.
      </p>

      <p className="g-body"><Link href="/buyer-protection">More: how Zafe protects buyers on every deal.</Link></p>
    </GuideShell>
  );
}
