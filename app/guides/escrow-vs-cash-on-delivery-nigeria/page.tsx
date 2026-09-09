import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "escrow-vs-cash-on-delivery-nigeria";
const title = "Escrow vs cash on delivery in Nigeria";
const dek = "Pay-on-delivery feels safe because you hold the money until the item arrives. But it has real gaps for both sides. Here is how escrow compares.";

export const metadata = guideMeta({
  title,
  description:
    "Escrow vs cash on delivery (pay on delivery) in Nigeria: where COD protects you, where it fails for buyers and sellers, and how escrow covers the gaps for online deals.",
  slug,
});

const faqs: Faq[] = [
  { q: "Is cash on delivery safe in Nigeria?", a: "It is safer than paying a stranger up front, because you hold the money until the item arrives. But it does not let you properly check the item before paying, it is easy for a buyer to reject on arrival and waste the seller's delivery, and it usually is not offered for distant or higher-value deals." },
  { q: "Why do many sellers refuse cash on delivery?", a: "Because the risk sits entirely with them: they pay to ship an item to someone who can simply refuse it, and pure-cash COD carries fake-note and short-payment risks. Many only offer it locally, if at all." },
  { q: "How does escrow fix the gaps in COD?", a: "The buyer's money is confirmed and held before the item ships, so the seller is not delivering on a maybe. The buyer still controls release: the money only reaches the seller once delivery is confirmed, and a dispute can be opened if the item is wrong." },
  { q: "Can I use escrow for a delivery I collect in person?", a: "Yes. Fund the deal first, collect and check the item, then release the money with your handover code once you are satisfied. You get the in-person check of COD with the protection of a held payment." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-09" faqs={faqs}>
      <p>
        Cash on delivery (COD), or pay on delivery, is popular for a good reason: you keep the money until the item is in
        front of you. For a local deal with a rider at your door, that is genuinely safer than transferring to a stranger
        first. But COD has gaps, and they hurt both buyers and sellers.
      </p>

      <h2>Where cash on delivery falls short</h2>
      <ul>
        <li><strong>You often cannot really check the item.</strong> Riders wait, boxes stay sealed, and you pay before you have properly inspected what is inside.</li>
        <li><strong>It is rarely offered for distant or higher-value deals.</strong> The further and pricier the item, the less likely a seller will risk it.</li>
        <li><strong>It is risky for the seller.</strong> A buyer can simply refuse on arrival, wasting the delivery, and cash brings fake-note and short-payment problems.</li>
        <li><strong>Disputes are messy.</strong> Once cash changes hands at the door, there is no neutral record and no easy way to settle a disagreement.</li>
      </ul>

      <h2>How escrow compares</h2>
      <p>
        With <Link href="/escrow-nigeria">escrow</Link>, the buyer&apos;s money is confirmed and held before the item ships, so
        the seller is not delivering on a maybe. The buyer still controls the release: the money only reaches the seller
        when delivery is confirmed. If the item is wrong, the buyer opens a dispute instead of arguing at the door.
      </p>

      <div className="g-note"><p>
        Escrow gives you the best of both: the seller ships against real, funded money, and you still decide when it is
        released. You can even fund first, collect in person, check the item, and only then release.
      </p></div>

      <h2>Side by side</h2>
      <ul>
        <li><strong>Buyer holds the money until delivery:</strong> COD yes, escrow yes.</li>
        <li><strong>Works for distant / higher-value deals:</strong> COD rarely, escrow yes.</li>
        <li><strong>Seller protected from wasted deliveries and fake cash:</strong> COD no, escrow yes.</li>
        <li><strong>Neutral dispute if the item is wrong:</strong> COD no, escrow yes.</li>
        <li><strong>Scam check before you commit:</strong> COD no, escrow yes with an AI check on the deal chat.</li>
      </ul>

      <h2>Which should you use?</h2>
      <p>
        For a small local pickup you are comfortable with, COD is fine. For anything shipped, anything pricier, or any
        seller you do not already know, escrow protects both sides properly. See{" "}
        <Link href="/how-it-works">how Zafe works</Link> and what{" "}
        <Link href="/buyer-protection">buyer protection</Link> and{" "}
        <Link href="/seller-protection">seller protection</Link> cover.
      </p>

      <p className="g-body"><Link href="/guides/how-to-verify-an-online-seller-nigeria">Next: how to verify an online seller in Nigeria.</Link></p>
    </GuideShell>
  );
}
