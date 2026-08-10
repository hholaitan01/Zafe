# TrustFlow — compliance docs

Working templates for the compliance programme, kept in the repo so the controls
and the code evolve together. **These are drafts, not legal advice** — a
qualified Nigerian fintech / data-protection lawyer must review them before they
are relied on or before real customer money moves.

The full picture (every applicable law, status, and gap) lives in the
**Regulatory Compliance Register**. These files cover the pieces that are
policy + code rather than registrations:

| Doc | Register items it supports |
|-----|----------------------------|
| [`aml-cft-program.md`](./aml-cft-program.md) | C — AML/CFT programme, CDD, monitoring, NFIU reporting |
| [`incident-response-and-breach.md`](./incident-response-and-breach.md) | E, F — NDPA breach notification, Cybercrimes Act incident response |
| [`data-protection-and-retention.md`](./data-protection-and-retention.md) | A, E — retention, NDPA data rights |

## What the code already enforces

- **KYC** — seller BVN / vNIN + liveness selfie before payout (`lib/sellers/kyc.ts`).
- **Sanctions / PEP screening** — fail-closed seam at onboarding (`lib/compliance/screening.ts`); a live provider must be wired before production.
- **Transaction monitoring** — deterministic flags surfaced in the admin AML queue (`lib/compliance/monitoring.ts`, `/admin/aml`).
- **Fee transparency** — one fee model, shown in full before funding (`lib/fees`).
- **Retention** — account closure deactivates and retains for 5 years, then purges (`app/api/account`, `lib/profiles`).
- **Access control** — row-level security, per-user scoping, HMAC-verified funding, guarded money-moves.

## What is still off-code (registrations / structure)

Incorporation (CAMA) · CBN licensing + partner-bank / trust-account structure ·
SCUML + NFIU onboarding · NDPC registration + a designated DPO. None of these
are code; all gate moving real money.
