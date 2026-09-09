import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "buy-a-phone-safely-online-nigeria";
const title = "How to buy a phone safely from a WhatsApp or Instagram seller";
const dek = "Phones are the most-scammed item in Nigerian social commerce: high value, easy to fake, easy to disappear with. Here is how to buy one without losing your money.";

export const metadata = guideMeta({
  title,
  description:
    "How to buy a phone safely online in Nigeria from a WhatsApp or Instagram seller: verify the seller, check the device and IMEI, avoid deposit scams, and pay through escrow so you only release money after it arrives.",
  slug,
});

const faqs: Faq[] = [
  { q: "What is the most common phone scam?", a: "The deposit-and-disappear: a great price, pressure to pay a deposit to 'hold' the phone, then silence. The second is bait-and-switch, where the phone that arrives is a lower model, a fake, or a locked or stolen device." },
  { q: "How do I check a phone before paying?", a: "Ask for a live video of the actual device showing the IMEI (dial *#06#), the settings screen, and it powering on. Confirm the IMEI is clean, and that the model, storage and colour match. Do not accept only stock photos." },
  { q: "Should I ever pay a deposit to hold a phone?", a: "Be very careful. A deposit to a personal account is unrecoverable if the seller vanishes. If you must commit, do it through escrow so the money is held, not handed over, until the phone is confirmed." },
  { q: "How does escrow help when buying a phone?", a: "Your money is funded into a neutral hold and only released after the phone arrives and matches what was agreed. If it is fake, wrong, or never ships, you open a dispute and can be refunded, instead of chasing a seller who already has your cash." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-09" faqs={faqs}>
      <p>
        A phone is the perfect scam target: it is worth a lot, it is easy to fake in a photo, and a seller can disappear
        the moment your transfer lands. The good news is that a handful of steps make buying one online genuinely safe.
      </p>

      <h2>1. Verify the seller first</h2>
      <p>
        Before anything, run the basic checks in{" "}
        <Link href="/guides/how-to-verify-an-online-seller-nigeria">how to verify an online seller</Link>: a real track
        record, a verifiable identity, and no pressure to rush. A seller with a solid Trust Score is a far safer bet than
        an anonymous account with a suspiciously low price.
      </p>

      <h2>2. Inspect the actual device</h2>
      <ul>
        <li><strong>Ask for a live video</strong> of the phone powering on, not just photos. Photos can be lifted from anywhere.</li>
        <li><strong>Check the IMEI.</strong> Have them dial <strong>*#06#</strong> on camera and confirm the IMEI is clean and not blacklisted.</li>
        <li><strong>Match the details.</strong> Model, storage, colour and battery health should match the listing exactly.</li>
        <li><strong>Beware prices that are too good.</strong> A flagship at half price is bait, not a bargain.</li>
      </ul>

      <h2>3. Never pay a personal account on trust</h2>
      <p>
        The classic trap is a &ldquo;deposit to hold it&rdquo; sent straight to a personal account. Once it lands it is gone. This is
        the same mechanism behind most{" "}
        <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">WhatsApp and Instagram scams</Link>. If you are paying
        before you hold the phone, the money should sit in escrow, not the seller&apos;s account.
      </p>

      <h2>4. Pay through escrow and release on arrival</h2>
      <p>
        With <Link href="/escrow-nigeria">escrow</Link>, you fund the deal and the money is held. The seller ships knowing
        it is real, and you release it with your handover code only after the phone arrives and checks out. If it is fake
        or wrong, you dispute and can be refunded. See <Link href="/how-it-works">how it works</Link>.
      </p>

      <div className="g-note"><p>
        The rule for phones: inspect the real device on video, verify the seller, and never let your money reach them
        until the phone is in your hand and confirmed. Escrow is what makes that possible with a stranger.
      </p></div>

      <p className="g-body"><Link href="/buyer-protection">More: how Zafe protects buyers on every deal.</Link></p>
    </GuideShell>
  );
}
