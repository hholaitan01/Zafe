# AML / CFT programme (draft)

Supports the Money Laundering (Prevention & Prohibition) Act 2022, the Terrorism
(Prevention & Prohibition) Act 2022, and CBN AML/CFT/CPF regulations.
**Draft for legal review — not legal advice.**

## 1. Governance
- Appoint a **Compliance Officer** (and a board-level owner) responsible for this programme.
- Register with **SCUML** (EFCC) and onboard with the **NFIU** once incorporated.
- Review this programme at least annually and after any material change.

## 2. Risk-based approach
- Maintain a written **risk assessment** across customer, product, channel, and geography risk.
- Higher-risk customers/relationships get enhanced due diligence and closer monitoring.

## 3. Customer due diligence (CDD)
- **Sellers:** verify identity (BVN / vNIN) matched to name + a liveness selfie before any payout — enforced in `lib/sellers/kyc.ts`.
- **Buyers:** tiered KYC by transaction value — step up verification above a defined threshold (target: align to the fee threshold and the ₦1m review line).
- **Screening:** sanctions / PEP / watchlist screening at onboarding and on an ongoing basis — `lib/compliance/screening.ts`. A real screening feed must be integrated before production; the seam fails closed on a match.
- Keep CDD data current; refresh for higher-risk customers.

## 4. Ongoing monitoring
- Deterministic monitoring rules flag deals for review — `lib/compliance/monitoring.ts`, surfaced at `/admin/aml`:
  - single transaction ≥ **₦5m** (individual) / **₦10m** (corporate) → potential currency-transaction report;
  - large transaction ≥ **₦1m** → review parties and source of funds;
  - AI Trust Score "risky"; dispute settled against the seller.
- Watch for structuring (amounts split to stay under thresholds) — a future rule across a party's deals.

## 5. Reporting
- **Suspicious Transaction Reports (STR):** file with the NFIU promptly on reasonable suspicion — no minimum amount.
- **Currency/threshold reports (CTR):** for single transactions at/above the thresholds above, within **7 days**.
- Foreign transfers over **US$10,000** carry additional reporting.
- Keep a log of what was reviewed, the decision, and any filing.

## 6. Record-keeping
- Retain CDD and transaction records a minimum of **5 years** (align to the longer 6-year tax period). Closure deactivates and retains, then purges — `app/api/account`.

## 7. Training & audit
- Train staff on AML/CFT obligations and red flags.
- Independent periodic testing of the programme.
