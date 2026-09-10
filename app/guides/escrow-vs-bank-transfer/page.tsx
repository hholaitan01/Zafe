import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "escrow-vs-bank-transfer";
const title = "Escrow vs paying by bank transfer: which is safer?";
const dek = "A direct bank transfer to a seller is fast, but the moment it lands your only protection is their goodwill. Here is how escrow compares, and when each one makes sense.";

export const metadata = guideMeta({
  title,
  description:
    "Escrow vs direct bank transfer in Nigeria: why a straight transfer leaves you unprotected once it lands, how escrow holds the money until you confirm delivery, and when to use each.",
  slug,
});

const faqs: Faq[] = [
  { q: "Can I reverse a bank transfer if a seller scams me?", a: "Almost never. Once an instant transfer lands in the seller's account, the bank treats it as a completed payment. Getting it back means the seller agreeing to refund you, or a long dispute with no guarantee. That is the core weakness of paying directly." },
  { q: "How is escrow different from a normal transfer?", a: "With escrow you still pay by bank transfer, but the money goes into a neutral hold instead of the seller's account. It is released to them only when you confirm the item arrived, so a seller who never ships cannot keep your money." },
  { q: "Is a bank transfer ever fine?", a: "Yes, when you already trust the other person: family, a shop you have used many times, or a very small amount you are willing to lose. For a stranger online, or anything that would hurt to lose, escrow is the safer default." },
  { q: "Does escrow cost more than a bank transfer?", a: "A transfer is free but carries all the risk. With Zafe, setting up an escrow deal is free too; a small fee applies only when the deal completes. You are paying for protection you do not get from a direct transfer." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-09" faqs={faqs}>
      <p>
        Most online deals in Nigeria are settled with a straight bank transfer to the seller&apos;s account. It is instant and
        familiar. The problem is what happens after the transfer lands: it is gone. Your only way to get it back is the
        seller choosing to send it, and a scammer never does.
      </p>

      <h2>What a direct bank transfer gives you</h2>
      <ul>
        <li><strong>Speed.</strong> The money arrives in seconds.</li>
        <li><strong>Simplicity.</strong> No third party, no extra step.</li>
        <li><strong>No protection.</strong> Once it lands, the bank considers the payment done. There is no built-in way to reverse it if the item never arrives or is not what was promised.</li>
      </ul>
      <p>
        That last point is the whole risk. Paying a personal account directly means the moment your transfer clears, your
        only protection is the seller&apos;s goodwill. It is exactly how most{" "}
        <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">WhatsApp and Instagram scams</Link> end.
      </p>

      <h2>What escrow changes</h2>
      <p>
        With <Link href="/escrow-nigeria">escrow</Link> you still pay by bank transfer, but not to the seller. The money
        goes into a neutral hold. The seller can see it is funded and ships, but cannot withdraw it. It is released only
        when you confirm the item arrived and is correct. If it never arrives, you are refunded.
      </p>

      <div className="g-note"><p>
        Same bank transfer, different destination. Into a personal account, the money is unprotected the instant it lands.
        Into escrow, it stays safe until you say the deal is done.
      </p></div>

      <h2>Side by side</h2>
      <ul>
        <li><strong>If the seller never ships:</strong> bank transfer &mdash; money gone. Escrow &mdash; refunded.</li>
        <li><strong>If the item is not as described:</strong> bank transfer &mdash; you argue and hope. Escrow &mdash; you open a dispute and the money stays locked until it is settled fairly.</li>
        <li><strong>If you change your mind before delivery:</strong> bank transfer &mdash; depends entirely on the seller. Escrow &mdash; the money has not been released yet.</li>
        <li><strong>For the seller:</strong> bank transfer &mdash; a buyer can send a fake payment alert. Escrow &mdash; the seller sees real, funded money before shipping.</li>
      </ul>

      <h2>When to use each</h2>
      <p>
        Pay directly only when you already trust the other side or the amount is small enough to lose without pain. For a
        stranger, a first-time vendor, or anything that would hurt to lose, use escrow. See exactly how it works in{" "}
        <Link href="/how-it-works">how Zafe works</Link>.
      </p>

      <p className="g-body"><Link href="/guides/escrow-vs-cash-on-delivery-nigeria">Next: escrow vs cash on delivery in Nigeria.</Link></p>
    </GuideShell>
  );
}
