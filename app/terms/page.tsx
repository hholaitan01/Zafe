import type { Metadata } from "next";
import { LegalDoc, type LegalSection } from "@/app/_lib/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of Service · TrustFlow",
  description: "The terms that govern your use of TrustFlow's AI-powered escrow for peer-to-peer trades.",
};

const sections: LegalSection[] = [
  {
    h: "What TrustFlow is",
    body: [
      <>TrustFlow is an escrow service for peer-to-peer trades. When a buyer pays, we hold the money in a dedicated account and release it to the seller only after the buyer confirms the item was received as agreed. Before payment, an AI can review the deal for scam signals.</>,
      <><b>We are an intermediary, not a bank and not a party to your trade.</b> We do not sell the goods, guarantee their quality, or take ownership of them. We hold and move funds according to these terms and the outcome of each deal.</>,
    ],
  },
  {
    h: "Who can use TrustFlow",
    body: [
      <>To use TrustFlow you must be at least 18 years old, able to enter a binding contract, and using the service for lawful trades. You agree to give accurate information and to keep it up to date.</>,
      <>TrustFlow is built for trades settled in Nigeria over Nigerian bank rails. Availability elsewhere is not guaranteed.</>,
    ],
  },
  {
    h: "Your account",
    body: [
      <>Sign-in is passwordless: you log in with a one-time email link or with Google. You are responsible for keeping access to that email account secure. Anyone who can open your email link can act as you.</>,
      <>One account is for one person. Do not share your account or impersonate anyone else.</>,
    ],
  },
  {
    h: "How escrow works",
    body: [
      <>A protected deal follows these steps:
        <ul>
          <li>The buyer funds escrow into a dedicated account. The money is held, not sent to the seller.</li>
          <li>The seller ships or delivers the item.</li>
          <li>The buyer releases the funds using a secret handover code, once the item is in hand and correct.</li>
          <li>If the buyer does not act, an <b>auto-release timer</b> can release the funds to the seller after a set period, so a seller who delivered is not left waiting forever.</li>
        </ul>
      </>,
      <>Money only reaches a funded, released, or refunded state through these verified paths. It cannot be moved directly by either party.</>,
    ],
  },
  {
    h: "Fees",
    body: [
      <>Setting up a deal is free. An escrow fee applies to a deal when it completes. The fee is shown to the buyer up front, in the deal summary, before they fund. We will give reasonable notice before changing fees.</>,
    ],
  },
  {
    h: "Seller verification (KYC)",
    body: [
      <>To receive payouts, a seller must verify their identity — currently a BVN check plus a liveness selfie matched to their record — and add a valid payout bank account. Until verification passes, payouts stay locked. Verification helps protect buyers and meets the checks expected of a Nigerian financial product.</>,
      <>You must not submit identity details that are not yours, or attempt to defeat verification.</>,
    ],
  },
  {
    h: "The AI features",
    body: [
      <>TrustFlow includes AI that produces a Trust Score, flags possible scam tactics, and suggests how a dispute might be resolved. <b>These are decision-support tools, not guarantees.</b> A high score does not promise a deal is safe, and a low score does not prove fraud. You remain responsible for your own decision to trade.</>,
      <>When you paste a chat for an AI check, that text is processed to produce the score. Do not paste information you are not comfortable processing for that purpose.</>,
    ],
  },
  {
    h: "Disputes and resolution",
    body: [
      <>If a deal goes wrong, either party can open a dispute. The AI reviews the evidence both sides submit and <b>suggests</b> an outcome — release to the seller, refund to the buyer, or a split.</>,
      <>If both parties accept the suggestion, it is applied and the funds move accordingly. If either party does not accept, the dispute is <b>escalated to human review</b>: the funds stay locked while a member of the TrustFlow team reviews the evidence and makes a decision. You agree to cooperate and provide honest evidence. Our resolution decision is final for the purpose of moving the escrowed funds.</>,
    ],
  },
  {
    h: "Things you may not do",
    body: [
      <>You agree not to:
        <ul>
          <li>Trade illegal, stolen, counterfeit, or prohibited goods or services.</li>
          <li>Use TrustFlow to commit fraud, launder money, or deceive a counterparty.</li>
          <li>Move a deal off the platform to avoid escrow after starting it, or pressure a counterparty to do so.</li>
          <li>Submit false identity, payment, or dispute evidence.</li>
          <li>Interfere with, probe, or try to break the security of the service.</li>
        </ul>
      </>,
    ],
  },
  {
    h: "Payments and third parties",
    body: [
      <>Funding, payouts, and account checks are carried out over bank rails provided by our partners (including Wema Bank / ALAT). Your use of those rails is also subject to the partner's own terms. Bank account and identity details are verified through third-party providers.</>,
    ],
  },
  {
    h: "Availability and liability",
    body: [
      <>TrustFlow is provided on an "as is" basis, especially during beta. We work to keep it accurate and available, but we do not promise it will be uninterrupted or error-free.</>,
      <>To the extent the law allows, TrustFlow is not liable for the acts of a counterparty, for goods that are not as described beyond the escrowed amount, or for indirect or consequential loss. Our role and responsibility are limited to holding and moving the escrowed funds according to these terms.</>,
    ],
  },
  {
    h: "Suspension and closing your account",
    body: [
      <>We may suspend or limit an account we reasonably believe is involved in fraud or a breach of these terms, including holding funds while we investigate.</>,
      <>You can close your account at any time from your profile. Closing erases your profile, payout details, and verification and removes your login. You cannot close an account while money is still held in escrow, and settled deals remain on record with the other party as required.</>,
    ],
  },
  {
    h: "Changes to these terms",
    body: [
      <>We may update these terms as the product grows. When we make a material change, we will update the date above and, where appropriate, notify you. Continuing to use TrustFlow after a change means you accept the updated terms.</>,
    ],
  },
  {
    h: "Governing law",
    body: [
      <>These terms are governed by the laws of the Federal Republic of Nigeria, and disputes relating to them are subject to the Nigerian courts.</>,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated="August 2026"
      intro={
        <p>
          These terms are the agreement between you and TrustFlow when you use the app to protect a
          trade. Please read them. By signing in or starting a deal, you accept them.
        </p>
      }
      sections={sections}
    />
  );
}
