# Incident response & data-breach notification (draft)

Supports the Nigeria Data Protection Act 2023 (breach notification) and the
Cybercrimes (Prohibition, Prevention, etc.) Act 2015 as amended.
**Draft for legal review — not legal advice.**

## Roles
- **Incident lead** — the Compliance Officer / DPO coordinates.
- **Technical lead** — contains and investigates.
- Keep an up-to-date contact list (internal, bank partner, NDPC, law enforcement).

## Response steps
1. **Detect & record** — log what was seen, when, and by whom. Open an incident ticket.
2. **Contain** — revoke credentials, rotate keys/secrets, isolate affected systems. Money-moving paths and the service-role key are the highest priority.
3. **Assess** — what data / funds were affected, how many data subjects, and the risk to them.
4. **Notify:**
   - **NDPC** — notify the Commission of a personal-data breach within the statutory window, and affected data subjects where there is a real risk to them.
   - **Bank partner / CBN** — per the partner agreement and CBN incident-reporting rules.
   - **Law enforcement** — where a cybercrime occurred.
5. **Remediate** — fix the root cause; add a control or test so it can't recur.
6. **Review** — a written post-incident review; feed lessons back into controls.

## Preventive posture (already in code)
- HMAC-verified payment callbacks; guarded money-moves; row-level security; per-user scoping; rate-limiting; the service-role key server-only.
- Secrets in `.env.local` (git-ignored); never in the repo, logs, or client bundle.

## Retention
- Retain incident records and relevant logs per the Cybercrimes Act and the AML retention period.
