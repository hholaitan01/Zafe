import Link from "next/link";
import GuideShell, { guideMeta, type Faq } from "../shell";

const slug = "what-is-escrow";
const title = "What is escrow, and how does it keep your money safe?";
const dek = "Escrow is a simple idea that removes the risk from paying a stranger. Here is how it works, in plain terms, and when you should use it.";

export const metadata = guideMeta({
  title,
  description: "A plain-English explainer of escrow: what it means, how the process works step by step, why it protects both buyer and seller, and when to use it for online deals in Nigeria.",
  slug,
});

const faqs: Faq[] = [
  { q: "What is escrow in simple terms?", a: "Escrow is a neutral third party that holds the buyer's money until the deal is done. The seller ships knowing the money is real, and the money is released to them only when the buyer confirms they got what they paid for." },
  { q: "Is escrow safe?", a: "Yes. The money is held separately and cannot be taken by the seller. It only moves when the buyer confirms delivery, or when a dispute is resolved. Neither side can run off with both the item and the money." },
  { q: "Does escrow protect the seller too?", a: "Yes. The seller can see the money is funded before they ship, so they are not sending an item to someone who never paid. And a buyer cannot fake a payment: the funds are genuinely held." },
  { q: "When should I use escrow?", a: "Any time you are paying a stranger you do not fully trust for something that matters: gadgets, sneakers, tickets, marketplace and social-media purchases. The higher the amount, the more it is worth it." },
  { q: "How much does escrow cost?", a: "With Zafe, setting up a protected deal is free. A small escrow fee applies only when a deal completes, so trying it costs you nothing." },
];

export default function Page() {
  return (
    <GuideShell title={title} dek={dek} slug={slug} datePublished="2026-08-26" faqs={faqs}>
      <p>
        When you buy from a stranger online, someone has to go first. Either you pay before you have the item, or they ship before they have the money. Whoever goes first carries all the risk. <strong>Escrow</strong> is the fix: a neutral party holds the money in the middle, so neither side has to trust the other.
      </p>

      <h2>How escrow works, step by step</h2>
      <ol>
        <li><strong>You agree the deal.</strong> The item, the price, and who the seller is.</li>
        <li><strong>You pay into escrow, not the seller.</strong> The money is held safely. The seller can see it is there, but cannot withdraw it.</li>
        <li><strong>The seller ships.</strong> They send the item knowing the money is real and waiting for them.</li>
        <li><strong>You confirm.</strong> When the item arrives and matches what was agreed, you release the money and the seller is paid.</li>
        <li><strong>If something is wrong, you dispute.</strong> The money stays locked while the dispute is settled, and is refunded if the item never arrived or was not as described.</li>
      </ol>

      <h2>Why it protects both sides</h2>
      <p>
        Escrow is not just buyer protection. It is fair to the seller too. The buyer cannot fake a payment, because the money is genuinely held before anything ships. And the seller cannot take the money and disappear, because the money only moves when the buyer confirms. Both sides get to see that the other has actually done their part.
      </p>

      <h2>Escrow vs paying the seller directly</h2>
      <p>
        Paying a personal account directly means that the moment your transfer lands, your only protection is the seller&apos;s goodwill. If they vanish, there is nothing to reverse. That is exactly how most <Link href="/guides/avoid-whatsapp-instagram-scams-nigeria">WhatsApp and Instagram scams</Link> work. Escrow closes that gap: your money is not in the seller&apos;s hands, it is held safe until you are satisfied.
      </p>

      <h2>Is escrow safe?</h2>
      <p>
        Yes, when it is done properly. The money is held separately from the seller, so it cannot be spent or withdrawn while the deal is open. It only ever moves in two ways: you confirm delivery, or a dispute is resolved. The whole point is that no one can end up with both the item and the money.
      </p>
      <div className="g-note"><p>Zafe is escrow built for Nigerian peer-to-peer deals. You can pay from any bank, transfers are detected automatically with no receipt to upload, an AI checks the deal for scams before you pay, and payouts only reach identity-verified sellers.</p></div>

      <p className="g-body"><Link href="/guides/buy-from-strangers-online-safely">Next: how to buy from a stranger online safely, step by step.</Link></p>
    </GuideShell>
  );
}
