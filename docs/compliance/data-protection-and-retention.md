# Data protection & retention (draft)

Supports the Nigeria Data Protection Act 2023 (NDPA), the NDPR 2019 framework,
and financial record-keeping law (AML 5 years, tax 6 years).
**Draft for legal review — not legal advice.**

## Registration & roles
- Register with the **NDPC** as a data controller/processor of major importance (processing > 200 data subjects in 6 months, or a commercial ICT service) within the statutory window.
- Appoint a **Data Protection Officer** with a local presence.
- Notify the NDPC of material changes within the required period.

## What we collect and why
| Data | Purpose | Lawful basis (to confirm with counsel) |
|------|---------|----------------------------------------|
| Email, name, photo | Account, communication | Contract / consent |
| BVN / vNIN, selfie | Seller KYC before payout | Legal obligation (AML) |
| Payout bank details | Paying sellers | Contract |
| Deal + chat content | Escrow, AI risk check, disputes | Contract / legitimate interest |
| Device / usage | Security, service operation | Legitimate interest |

## Data-subject rights (NDPA)
Access, rectification, erasure, restriction/objection, and portability — much of
it self-service in the profile. Erasure is subject to records we must keep by
law (see retention).

## Retention schedule
- **KYC + transaction records:** minimum **5 years** after the relationship/transaction (AML).
- **Financial/tax records:** **6 years** (tax) — use the longer period where both apply.
- **On account closure:** the account is **deactivated** (sign-in blocked) and data is **retained inactive** until the retention date, then **purged**. Implemented in `app/api/account` + `lib/profiles` (`deactivated_at`, `retain_until`); the purge job runs after the window.
- **Settled deal records** remain with the counterparty as shared history.

## Security & processors
- Row-level security, per-user scoping, service-role key server-only, encryption in transit.
- Processors (payments/KYC/email/hosting/AI) engaged under appropriate terms; the minimum data shared for each purpose.

## Consent & disclosure
- Terms + Privacy acceptance captured at sign-in; **to add:** persist the accepted version + timestamp per user.
- Fees (escrow fee + 7.5% VAT + ₦50 duty) disclosed before funding — `lib/fees`.
