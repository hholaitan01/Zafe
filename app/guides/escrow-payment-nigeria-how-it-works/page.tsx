import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "escrow-payment-nigeria-how-it-works";
const title = "Escrow payment in Nigeria: how paying into escrow works";
const dek = "You still pay by ordinary bank transfer. The difference is where the money goes, and when it reaches the seller. Here is exactly how an escrow payment works.";

export const metadata = guideMeta({
  title,
  description:
    "How escrow payment works in Nigeria: pay from any bank by normal transfer, the money is verified and held instead of going to the seller, and it is released only when you confirm delivery. No receipts to upload.",
  slug,
});

const faqs: Faq[] = [
  { q: "How do I actually pay into escrow?", a: "By a normal bank transfer, from any Nigerian bank. Instead of paying the seller's personal account, you pay into a dedicated account for that deal. The money is detected automatically, so there is no receipt to upload and no screenshot to send." },
  { q: "Do I need a Wema or any specific bank account?", a: "No. You can pay from whatever bank you already use. Escrow is about where the money is held, not which bank you send it from." },
  { q: "When does the seller get the money?", a: "Only after you confirm the item arrived and is correct, by entering your handover code. If you go silent after delivery, an auto-release timer eventually pays the seller. Until one of those happens, the money stays held." },
  { q: "What if I paid but the item never comes?", a: "Because the money is held and not with the seller, you open a dispute and can be refunded. That is the whole point of paying into escrow instead of paying the seller directly." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-09-12" faqs={faqs}>
      <p>
        &ldquo;Escrow payment&rdquo; sounds technical, but from your side it is just a bank transfer. What changes is the
        destination: your money goes into a neutral hold for the deal, not into the seller&apos;s account, and it only
        reaches them once you are satisfied.
      </p>

      <h2>Step by step, from your phone</h2>
      <ol>
        <li><strong>You set up the deal.</strong> The item, the price, and the seller. If you paste the chat, an AI checks it for scam signals first.</li>
        <li><strong>You get a dedicated account to pay into.</strong> You transfer the amount from any bank, exactly as you would any other transfer.</li>
        <li><strong>The payment is verified and held.</strong> It is detected automatically at the bank &mdash; no receipt to upload &mdash; and the deal shows as funded. The seller can see it is real but cannot withdraw it.</li>
        <li><strong>The seller ships.</strong> They deliver knowing the money is genuinely waiting.</li>
        <li><strong>You release it.</strong> When the item arrives and is correct, you enter your handover code and the seller is paid.</li>
      </ol>

      <h2>Why pay this way</h2>
      <p>
        Paying a personal account directly means your protection ends the instant the transfer lands. Paying into{" "}
        <Link href="/escrow-nigeria">escrow</Link> keeps the money verified and held until the deal is actually done. See
        the difference laid out in{" "}
        <Link href="/guides/escrow-vs-bank-transfer">escrow vs paying by bank transfer</Link>.
      </p>

      <div className="g-note"><p>
        Same transfer, safer destination. You pay from any bank, the money is detected and held automatically, and it
        only moves to the seller when you say the deal is done.
      </p></div>

      <h2>No receipts, no screenshots</h2>
      <p>
        Because the transfer is detected at the bank, there is nothing to upload and nothing to fake. That also protects
        sellers from{" "}
        <Link href="/guides/fake-payment-alerts-nigeria">fake payment alerts</Link>: when a Zafe deal shows funded, the
        money is genuinely there. See the whole flow in <Link href="/how-it-works">how Zafe works</Link>.
      </p>

      <p className="g-body"><Link href="/buyer-protection">More: how Zafe protects buyers on every deal.</Link></p>
    </GuideShell>
  );
}
