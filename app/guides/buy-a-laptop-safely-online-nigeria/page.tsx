import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "buy-a-laptop-safely-online-nigeria";
const title = "How to buy a laptop safely online in Nigeria";
const dek = "Laptops are high-value and easy to misrepresent: wrong specs, swapped parts, dead batteries, or a listing that never ships. Here is how to buy one without getting burned.";

export const metadata = guideMeta({
  title,
  description:
    "How to buy a laptop safely online in Nigeria: verify the seller, check the real specs and serial number on video, spot swapped parts and tired batteries, and pay through escrow so you only release money after it arrives.",
  slug,
});

const faqs: Faq[] = [
  { q: "How do I confirm a laptop's real specs before paying?", a: "Ask for a live video showing the About screen (on Windows, System > About; on a Mac, About This Mac), the model and serial, storage and RAM, and the battery health. Match every detail to the listing. Photos alone are not enough." },
  { q: "What are the common laptop-buying scams?", a: "A great price with a deposit to 'hold' it and then silence; a lower spec or a different model than advertised; swapped or missing parts; a swollen or near-dead battery presented as healthy; and stolen or locked machines." },
  { q: "Should I pay a deposit to reserve a laptop?", a: "Be very cautious. A deposit to a personal account cannot be recovered if the seller vanishes. If you must commit, do it through escrow so the money is held until the laptop is confirmed." },
  { q: "How does escrow protect a laptop purchase?", a: "Your money is funded into a neutral hold and released only after the laptop arrives and matches what was agreed. If it is the wrong spec, faulty, or never ships, you open a dispute and can be refunded." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-12" faqs={faqs}>
      <p>
        A laptop is a lot of money for something you cannot hold before you pay, and it is easy to misrepresent in a
        listing. The same steps that make{" "}
        <Link href="/guides/buy-a-phone-safely-online-nigeria">buying a phone</Link> safe apply here, with a few extras
        specific to laptops.
      </p>

      <h2>1. Verify the seller first</h2>
      <p>
        Run the basic checks in{" "}
        <Link href="/guides/how-to-verify-an-online-seller-nigeria">how to verify an online seller</Link>: a real track
        record, a verifiable identity, and no pressure to rush. A strong Trust Score beats an anonymous account with a
        suspiciously low price.
      </p>

      <h2>2. Confirm the real machine on video</h2>
      <ul>
        <li><strong>Specs on screen.</strong> Ask them to open the About / System screen live and show the model, processor, RAM and storage.</li>
        <li><strong>Serial number.</strong> Have them show the serial (in settings and on the underside) so it is not stolen or locked.</li>
        <li><strong>Battery health.</strong> Ask for the battery report; a tired battery is a hidden cost, and a swollen one is a safety issue.</li>
        <li><strong>Powered on, in use.</strong> See it boot and run, not just a photo of a closed lid.</li>
      </ul>

      <h2>3. Never pay a personal account on trust</h2>
      <p>
        The &ldquo;deposit to hold it&rdquo; sent to a personal account is the classic trap; once it lands, it is gone. This is the
        same mechanism behind most{" "}
        <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">WhatsApp and Instagram scams</Link>. If you are paying
        before you hold the laptop, the money belongs in escrow.
      </p>

      <h2>4. Pay through escrow and release on arrival</h2>
      <p>
        With <Link href="/escrow-nigeria">escrow</Link>, you fund the deal and the money is held. The seller ships knowing
        it is real, and you release it with your handover code only after the laptop arrives and checks out. If it is the
        wrong spec or faulty, you dispute and can be refunded. See <Link href="/how-it-works">how it works</Link>.
      </p>

      <div className="g-note"><p>
        For laptops: confirm the exact specs and serial on video, check the battery, verify the seller, and never let your
        money reach them until the machine is in front of you and confirmed.
      </p></div>

      <p className="g-body"><Link href="/buyer-protection">More: how Zafe protects buyers on every deal.</Link></p>
    </GuideShell>
  );
}
