import MarketingShell, { pageMeta } from "../_lib/MarketingShell";

export const metadata = pageMeta({
  title: "Seller protection",
  description:
    "Seller protection in Nigeria: the buyer's money is verified and funded into escrow before you ship, so there are no fake payment alerts and no chargebacks. Get paid safely to a verified account. How Zafe protects sellers.",
  path: "/seller-protection",
});

export default function SellerProtectionPage() {
  return (
    <MarketingShell
      title="Seller protection"
      h1="Seller protection: get paid without fake alerts or chargebacks"
      dek="Ship with confidence. On Zafe the buyer's money is real and already funded into escrow before you send the item, so the classic seller risks simply do not apply."
      path="/seller-protection"
      datePublished="2026-09-09"
      faqs={[
        { q: "How do I know the buyer has really paid?", a: "The deal only moves to funded after Zafe confirms the payment at the bank and holds it in escrow. You never rely on a screenshot or a payment alert, which is exactly what fake-alert scams exploit." },
        { q: "Can a buyer reverse the payment after I ship?", a: "No. The money is held in escrow, not sitting in your account waiting to be clawed back. It is released to you when the buyer confirms, or by auto-release if they go silent after delivery." },
        { q: "How and when do I get paid?", a: "To your verified payout account, once the buyer releases the money with their handover code or the auto-release timer runs out. Payouts go only to an identity-verified account you control." },
        { q: "What if the buyer disputes unfairly?", a: "An AI mediator weighs both sides and the evidence, and a human reviewer settles escalations. If the buyer wins, you are only unpaid for a deal that did not complete as agreed; keep proof of delivery and condition." },
      ]}
      related={[
        { href: "/how-it-works", label: "How Zafe works", desc: "The full escrow flow, step by step." },
        { href: "/escrow-nigeria", label: "Escrow in Nigeria", desc: "Why escrow matters and who it protects." },
        { href: "/buyer-protection", label: "Buyer protection", desc: "The other side of a safe deal." },
        { href: "/guides/avoid-whatsapp-instagram-scams-nigeria", label: "Avoid WhatsApp & Instagram scams", desc: "The red flags to watch for." },
      ]}
    >
      <h2>No more fake payment alerts</h2>
      <p>
        The most common scam run on Nigerian sellers is the fake payment alert: a doctored screenshot or a spoofed bank
        message that pressures you to ship before the money is real. Zafe ends it. A deal only reaches funded after the
        payment is confirmed at the bank and held in escrow. You ship on facts, not a screenshot.
      </p>

      <h2>The money is real before you ship</h2>
      <p>
        When you see a Zafe deal is funded, the buyer's money is already in escrow and cannot be pulled back. There are no
        chargebacks and no reversals to fear, because the funds are held by a neutral hold, not parked in your account
        waiting to be reversed.
      </p>

      <h2>Paid to a verified account</h2>
      <p>
        Payouts go only to an identity-verified account you control. Changing that account is protected by an extra
        confirmation step and a short cooldown, so an attacker cannot quietly redirect your money even if they reach your
        details.
      </p>

      <h2>Fair disputes, and a reputation you build</h2>
      <p>
        If a buyer disputes, an AI mediator weighs both sides and the evidence, and a human reviewer settles escalations,
        so you are judged on the facts of the deal, not on who complains loudest. Every clean deal also raises your Trust
        Score, which brings you more buyers who are willing to transact through escrow.
      </p>

      <div className="m-note"><p>Verified money before you ship, no chargebacks, verified payouts, and a reputation that compounds. That is what seller protection means on Zafe.</p></div>
    </MarketingShell>
  );
}
