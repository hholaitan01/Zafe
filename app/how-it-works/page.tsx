import MarketingShell, { pageMeta } from "../_lib/MarketingShell";

export const metadata = pageMeta({
  title: "How Zafe works",
  description:
    "How Zafe escrow works, step by step: agree the deal with an AI scam check, fund escrow, the seller ships, then you release the money with a secret handover code. Disputes, payouts and fees explained.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <MarketingShell
      title="How Zafe works"
      h1="How Zafe works: escrow for peer-to-peer trades"
      dek="From agreement to payout, here is exactly how a Zafe deal moves, and where your money is at every step."
      path="/how-it-works"
      datePublished="2026-09-09"
      faqs={[
        { q: "When does the seller actually get paid?", a: "Only after the buyer releases the money with their secret handover code, or after an auto-release timer runs out if the buyer goes silent once the item is delivered. The seller can never pull the money on their own." },
        { q: "What if the item never arrives or is wrong?", a: "The buyer opens a dispute. An AI mediator weighs both sides and proposes release, refund, or split. If either side escalates, a human reviewer settles it. The money stays locked until it is resolved." },
        { q: "What does Zafe charge?", a: "Setting up a deal is free. A small escrow fee (a low percentage of the deal, capped) applies only when a deal completes and is split between buyer and seller. On a refund, no fee is kept." },
        { q: "Do I need a specific bank?", a: "No. You can pay from any Nigerian bank. Zafe detects the transfer at the bank, so there is no receipt to upload and no screenshot to send." },
      ]}
      related={[
        { href: "/escrow-nigeria", label: "Escrow in Nigeria", desc: "Why escrow matters and who it protects." },
        { href: "/buyer-protection", label: "Buyer protection", desc: "How your money stays safe until you confirm." },
        { href: "/seller-protection", label: "Seller protection", desc: "Get paid without fake alerts or chargebacks." },
        { href: "/guides/what-is-escrow", label: "What is escrow?", desc: "A plain-English explainer." },
      ]}
    >
      <h2>1. Agree the deal, with a scam check</h2>
      <p>
        You enter the item, the price and the seller. If you paste your chat with the seller, an AI reads it for scam
        signals and returns a Trust Score from 0 to 100. If the deal looks risky, a red banner explains why, and you
        cannot fund it until you acknowledge the risk. Most fraud lives in the chat, before anyone pays; this is where
        Zafe catches it.
      </p>

      <h2>2. Pay into escrow</h2>
      <p>
        The buyer pays into a dedicated account. The money is held, not handed over. The seller can see the deal is
        funded, so they ship with confidence, but they cannot withdraw a naira yet.
      </p>

      <h2>3. The seller ships</h2>
      <p>
        Because the money is real and waiting, the seller has no reason to stall and every reason to deliver exactly what
        was agreed. The deal moves to shipped, and the buyer knows the item is on the way.
      </p>

      <h2>4. You confirm, and the money releases</h2>
      <p>
        The buyer holds a secret handover code and reveals it only once the item is in hand and correct. Entering the
        code releases the money to the seller. If the buyer goes quiet after delivery, an auto-release timer pays the
        seller so funds are never frozen forever, and a wrong code can never release the money.
      </p>

      <h2>If something goes wrong: disputes</h2>
      <p>
        If the two sides disagree, either can open a dispute. An AI mediator weighs both claims and any evidence and
        proposes a fair outcome: pay the seller, refund the buyer, or split the difference. Money only moves when both
        sides accept, or when a human reviewer settles an escalation. The buyer's protection always comes first.
      </p>

      <h2>Fees</h2>
      <p>
        Setting up a protected deal is free. A small escrow fee, a low percentage of the deal amount and capped, applies
        only when a deal completes, and it is split between buyer and seller. On a full refund or a dispute split, Zafe
        keeps no fee beyond what was already contributed. You always see the exact total before you pay.
      </p>

      <div className="m-note"><p>At every step, your money is either with you or held in escrow. It only reaches the seller when you say so, or when a fair, checked process decides it should.</p></div>
    </MarketingShell>
  );
}
