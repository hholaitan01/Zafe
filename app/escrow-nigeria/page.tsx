import MarketingShell, { pageMeta } from "../_lib/MarketingShell";

export const metadata = pageMeta({
  title: "Escrow in Nigeria",
  description:
    "Escrow in Nigeria for peer-to-peer trades: your money is held safe until you confirm the item arrived, and an AI checks every deal for scams before you pay. How Zafe escrow works and who it protects.",
  path: "/escrow-nigeria",
});

export default function EscrowNigeriaPage() {
  return (
    <MarketingShell
      title="Escrow in Nigeria"
      h1="Escrow in Nigeria: buy and sell with strangers safely"
      dek="Escrow puts a neutral hold on the money until both sides do their part. Zafe brings that to everyday Nigerian trades on WhatsApp, Instagram and campus groups, and adds an AI that checks the deal for scams before you pay."
      path="/escrow-nigeria"
      datePublished="2026-09-09"
      faqs={[
        { q: "What is escrow, in plain terms?", a: "Escrow is a neutral hold on the money. The buyer pays, but the seller cannot touch it until the buyer confirms the item arrived and is correct. It removes the 'who trusts who first' problem from a deal between strangers." },
        { q: "Is escrow legal in Nigeria?", a: "Yes. Holding funds against delivery is a normal commercial arrangement. Zafe verifies payments at the bank and moves money only through checked paths." },
        { q: "How is Zafe different from other escrow services in Nigeria?", a: "Zafe combines escrow with an AI that reads the deal chat for scam signals before you pay, and a Trust Score on every seller. Most services only step in after a dispute; Zafe tries to stop the bad deal before the money moves." },
        { q: "What does escrow cost?", a: "Setting up a protected deal is free. A small escrow fee applies only when a deal completes, so trying it costs nothing." },
      ]}
      related={[
        { href: "/how-it-works", label: "How Zafe works", desc: "The full escrow flow, step by step." },
        { href: "/buyer-protection", label: "Buyer protection", desc: "How your money stays safe until you confirm." },
        { href: "/seller-protection", label: "Seller protection", desc: "Get paid without fake alerts or chargebacks." },
        { href: "/guides/what-is-escrow", label: "What is escrow?", desc: "A plain-English explainer." },
      ]}
    >
      <h2>Why Nigeria needs escrow</h2>
      <p>
        Nigeria runs on social commerce. People buy and sell on WhatsApp, Instagram and Telegram every day, but there is
        no trust layer underneath any of it. You pay first and hope the seller ships, or you ship first and hope the
        buyer pays. Someone always carries the risk, and someone always gets burned.
      </p>
      <p>
        Escrow fixes the order of trust. Instead of one side going first, the money sits with a neutral third party and
        is released only when the deal is actually done. Both sides can see it is funded, so a stranger becomes safe to
        deal with.
      </p>

      <h2>How Zafe escrow works</h2>
      <p>Four steps carry a deal from agreement to done:</p>
      <ol>
        <li><strong>Agree the deal.</strong> Enter the item, the price and the seller. Paste your chat and the AI checks it for scam signals before a naira moves.</li>
        <li><strong>Pay into escrow.</strong> Your money is held safe. The seller can see it is there but cannot withdraw it.</li>
        <li><strong>Seller ships.</strong> They send the item knowing the money is real and waiting.</li>
        <li><strong>You confirm.</strong> Got what you paid for? Release it with your secret handover code. Something wrong? Open a dispute.</li>
      </ol>

      <h2>What makes Zafe different</h2>
      <p>
        Most escrow services only arbitrate after a dispute. Zafe works before the money moves and after:
      </p>
      <ul>
        <li><strong>AI scam check.</strong> Paste the conversation and Zafe flags pressure tactics, off-platform tricks and prices that are too good to be true. A risky deal cannot be funded until you have seen why.</li>
        <li><strong>A Trust Score on every seller.</strong> One number from 0 to 100, built from verified identity, completed deals, past disputes and account age. You see it before you pay.</li>
        <li><strong>AI dispute mediation.</strong> If a deal goes wrong, an AI weighs both sides and proposes a fair outcome: release, refund, or split. A human reviewer can settle escalations.</li>
      </ul>

      <div className="m-note"><p>Money held safe, checked before you pay, and released only on your say-so. That is escrow with a trust layer built for how Nigerians actually trade.</p></div>

      <h2>Who it is for</h2>
      <p>
        Anyone paying a seller they have not met, or selling to a buyer they cannot vouch for: phones and laptops, sneakers
        and fashion resale, tickets, gadgets, and the countless deals that start in a DM. If a single bad deal would be a
        real loss, escrow is worth the few minutes it takes.
      </p>
    </MarketingShell>
  );
}
