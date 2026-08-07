import type { Metadata } from "next";
import { LegalDoc, type LegalSection } from "@/app/_lib/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy · TrustFlow",
  description: "How TrustFlow collects, uses, and protects your data, and your rights under the NDPR.",
};

const sections: LegalSection[] = [
  {
    h: "What we collect",
    body: [
      <>Depending on how you use TrustFlow, we collect:
        <ul>
          <li><b>Account data</b> — your email address, and a display name and profile photo if you add them.</li>
          <li><b>Seller verification data</b> — your BVN (or NIN), a liveness selfie, and your name, used to confirm your identity before payouts.</li>
          <li><b>Payout details</b> — the bank account where you receive money from your sales.</li>
          <li><b>Deal data</b> — the items, amounts, counterparties, statuses, and any chat text you paste in for an AI scam check.</li>
          <li><b>Dispute data</b> — the evidence and messages you submit when a deal is disputed.</li>
          <li><b>Technical data</b> — basic device and usage information needed to run and secure the service.</li>
        </ul>
      </>,
    ],
  },
  {
    h: "How we use your data",
    body: [
      <>We use your data to run escrow (hold and move funds), verify seller identity, run the AI Trust Score and scam checks, resolve disputes, send you notifications about your deals, keep the service secure, and meet our legal and regulatory obligations.</>,
      <>We do not sell your personal data.</>,
    ],
  },
  {
    h: "AI processing",
    body: [
      <>When you submit a chat or deal details for an AI check or dispute review, that text is processed by an AI model to produce a score, flag risks, or suggest an outcome. Please avoid including information that is not relevant to the deal. AI outputs are decision-support, not a guarantee.</>,
    ],
  },
  {
    h: "Who we share it with",
    body: [
      <>We share the minimum needed, with:
        <ul>
          <li><b>Payment and banking partners</b> (including Wema Bank / ALAT) to fund escrow, verify accounts, and pay out.</li>
          <li><b>Identity verification providers</b> to check your BVN/NIN and selfie.</li>
          <li><b>Infrastructure providers</b> that host our database and send our email and AI requests.</li>
          <li><b>Your counterparty</b> — the other side of a deal sees limited information needed to transact (such as a display name, verification status, and deal details), never your BVN or full bank number.</li>
          <li><b>Authorities</b>, where we are legally required to disclose, or to investigate fraud.</li>
        </ul>
      </>,
    ],
  },
  {
    h: "Where your data is stored and how we protect it",
    body: [
      <>Data is stored in our managed database with row-level security enabled, so records are scoped per user. Sensitive server operations use a service-role key that is never exposed to the browser. Data is encrypted in transit. No system is perfectly secure, but we design to limit what any one party can reach.</>,
    ],
  },
  {
    h: "How long we keep it",
    body: [
      <>We keep your data while your account is active and for as long as needed to complete deals, resolve disputes, and meet our legal obligations. When you close your account, we deactivate it and block sign-in, but we <b>retain</b> your identity (KYC) and transaction records for the period Nigerian financial regulation requires — around <b>5 years</b> for anti-money-laundering — after which they are permanently deleted. Records of settled deals also remain with the other party.</>,
    ],
  },
  {
    h: "Your rights under the NDPR",
    body: [
      <>Under the Nigeria Data Protection Regulation, you can:
        <ul>
          <li><b>Access</b> the personal data we hold about you.</li>
          <li><b>Correct</b> data that is wrong or out of date — much of it directly in your profile.</li>
          <li><b>Erase</b> your data by closing your account. We deactivate it immediately; records we're legally required to keep (KYC, transactions) are retained inactive for the mandated period, then deleted.</li>
          <li><b>Object to</b> or restrict certain processing.</li>
          <li><b>Port</b> a copy of the data you gave us.</li>
        </ul>
      </>,
      <>To exercise a right that you cannot complete in the app, contact us using the details below.</>,
    ],
  },
  {
    h: "Sessions and cookies",
    body: [
      <>We use essential cookies and similar storage to keep you signed in and to keep the service secure. We do not use them to track you across other websites.</>,
    ],
  },
  {
    h: "Children",
    body: [
      <>TrustFlow is not for anyone under 18. We do not knowingly collect data from children.</>,
    ],
  },
  {
    h: "Changes to this policy",
    body: [
      <>We may update this policy as the product grows. When we make a material change, we will update the date above and, where appropriate, notify you.</>,
    ],
  },
  {
    h: "Contact",
    body: [
      <>For any privacy question or request, reach the team from your profile or by replying to any TrustFlow email. Before launch, a named data protection contact will be published here.</>,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="August 2026"
      intro={
        <p>
          This policy explains what data TrustFlow collects, how we use it to run protected escrow,
          who we share it with, and the rights you have over it under Nigerian data-protection law.
        </p>
      }
      sections={sections}
    />
  );
}
