import MarketingShell, { pageMeta } from "../_lib/MarketingShell";

export const metadata = pageMeta({
  title: "Buyer protection",
  description:
    "Buyer protection in Nigeria: pay into escrow instead of the seller, get an AI scam check before you pay, see every seller's Trust Score, and release your money only when the item arrives. How Zafe protects buyers.",
  path: "/buyer-protection",
});

export default function BuyerProtectionPage() {
  return (
    <MarketingShell
      title="Buyer protection"
      h1="Buyer protection: never pay a stranger blind"
      dek="When you buy from someone you have not met, Zafe puts the money in escrow, checks the deal for scams, and keeps you in control until the item is really in your hands."
      path="/buyer-protection"
      datePublished="2026-09-09"
      faqs={[
        { q: "How is my money protected as a buyer?", a: "Your payment goes into escrow, not to the seller. It is held until you confirm the item arrived and is correct. The seller cannot withdraw it, and a wrong handover code can never release it." },
        { q: "What if the seller never ships?", a: "You open a dispute and, if the item never arrives, the money is refunded to you. The seller is only paid for a deal they actually completed." },
        { q: "Can Zafe really spot a scam before I pay?", a: "The AI reads your chat with the seller for known scam patterns: pressure to pay now, moving off escrow, refusing to verify, prices too good to be true. A risky deal is flagged and cannot be funded until you have seen why." },
        { q: "Are there limits to buyer protection?", a: "Escrow protects the money in the deal. It cannot judge taste or minor preference, and both sides should keep evidence (photos, tracking, chat). Disputes are settled on the claims and evidence provided." },
      ]}
      related={[
        { href: "/how-it-works", label: "How Zafe works", desc: "The full escrow flow, step by step." },
        { href: "/escrow-nigeria", label: "Escrow in Nigeria", desc: "Why escrow matters and who it protects." },
        { href: "/guides/avoid-whatsapp-instagram-scams-nigeria", label: "Avoid WhatsApp & Instagram scams", desc: "The red flags to watch for." },
        { href: "/guides/buy-from-strangers-online-safely", label: "Buy from strangers safely", desc: "A practical safety guide." },
      ]}
    >
      <h2>Your money is held, not handed over</h2>
      <p>
        The single biggest risk in a social-commerce deal is paying first. Zafe removes it. Your money goes into escrow
        and is held until you confirm the item arrived and is what you paid for. Until then the seller can see the deal is
        funded but cannot touch a naira.
      </p>

      <h2>A scam check before you pay, not after</h2>
      <p>
        Most fraud happens in the chat, before any money moves. Paste the conversation and Zafe's AI flags the pressure
        tactics and off-platform tricks scammers use. If the deal is risky, you cannot pay until you have seen exactly
        why, so you never send money into an obvious trap.
      </p>

      <h2>Know who you are dealing with</h2>
      <p>
        Every seller carries a Trust Score from 0 to 100, built from verified identity, completed deals, past disputes
        and how long the account has traded. You see it before you pay, so you are never trusting a stranger blind. A
        score of 70 or above reads as safe; below 40 reads as risky.
      </p>

      <h2>You hold the release</h2>
      <p>
        You get a secret handover code and reveal it only once the item is in hand and correct. Entering it is what pays
        the seller, so the money never moves on the seller's word alone. If the item never arrives or is wrong, you open a
        dispute and can be refunded.
      </p>

      <div className="m-note"><p>Held money, a scam check before you pay, a Trust Score you can see, and a release only you control. That is what buyer protection means on Zafe.</p></div>
    </MarketingShell>
  );
}
