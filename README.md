<!-- generated-by: gsd-doc-writer -->
# Mental Health Platform — India

A web-based telepsychiatry platform for India where patients complete a mental health intake questionnaire, get matched to a licensed psychiatrist, book Zoom video sessions, and receive personalised long-term care via WhatsApp.

## What It Does

The platform has two core functions:

1. **Match and book** — patients answer a detailed intake questionnaire, the platform scores and ranks available psychiatrists across partner agencies using symptom, preference, and severity signals, and the patient books a Zoom video session through the platform.
2. **Long-term personalised care** — the platform builds a longitudinal patient profile from session transcripts and psychiatrist-approved care recommendations, driving personalised WhatsApp notifications (medication reminders, activity nudges, follow-up prompts) timed to each individual's preferences.

Target market: India. Regulatory framework: Mental Healthcare Act 2017 + DPDPA 2023.

## Project Status

This project is in the **specification phase**. No application code exists yet.

| Phase | Status |
|-------|--------|
| Constitution | v1.1.0 — ratified |
| Feature spec `001-patient-psychiatrist-match` | Fully clarified — ready for planning |
| Plan | Not started — next step |
| Tasks | Not started |
| Implementation | Not started |

The active feature spec covers: patient onboarding, intake questionnaire, psychiatrist matching, appointment booking (Razorpay payments, Zoom integration), session notes, e-prescriptions, WhatsApp notifications, and the psychiatrist/agency/platform admin portals.

## Development Workflow

Every feature follows this pipeline in order. No step may be skipped:

```
Constitution → Spec → Plan → Tasks → Implementation
```

| Command | Purpose |
|---------|---------|
| `/speckit-constitution` | Define or amend non-negotiable project principles |
| `/speckit-specify` | Write the feature specification |
| `/speckit-clarify` | Resolve ambiguities before planning |
| `/speckit-plan` | Architecture and implementation plan |
| `/speckit-tasks` | Break the plan into atomic dev tasks |
| `/speckit-implement` | Implement a specific task |

No code is written without a corresponding spec and plan. See `CLAUDE.md` for full runtime guidance.

## User Roles

| Role | Authentication | Access |
|------|---------------|--------|
| Patient | OTP via SMS (every login, no password) | Own profile, intake, bookings, care history |
| Psychiatrist | Email + password + TOTP (mandatory) | Assigned patients only, within access window |
| AgencyAdmin | Email + password + TOTP (mandatory) | Psychiatrist profiles and availability for their agency; no clinical data |
| PlatformAdmin | Email + password + TOTP (mandatory) | Ops dashboards, account actions; zero clinical data |

## Key Design Decisions

- **Session format**: Zoom video only (v1). Three session types: Initial Assessment (60 min), Follow-Up (30 min), Urgent Review (60 min).
- **Payments**: Razorpay at booking time with three-path payment confirmation (browser response, webhook, 15-minute reconciliation job). Customer money is never held without a confirmed booking.
- **Matching**: Scoring-based ranking across all agencies using symptoms, preferences, severity, and session ratings. No hardcoded mappings.
- **Notifications**: Three tiers — SMS OTPs (always), SMS + WhatsApp booking confirmations, WhatsApp-only care reminders. Personalised per patient; frequency capped by patient preference.
- **E-prescriptions**: Platform generates GST-compliant PDFs per session. List C drugs (alprazolam, diazepam, lorazepam, zolpidem, methylphenidate) are hard-blocked by law.
- **Data retention**: 7 years from last platform activity, then automatic purge. On-demand deletion removes PII within 72 hours; clinical records are anonymised and retained for audit.

## Non-Negotiable Principles

1. All PHI encrypted at rest (AES-256) and in transit (TLS 1.2+). No PII/PHI in logs, metrics, or traces. Audit logs immutable, retained 7 years.
2. No automated clinical diagnosis or treatment. Only licensed psychiatrists make clinical decisions. Crisis pathways always reachable, never gated.
3. WCAG 2.1 AA minimum. i18n hooks in all user-visible strings from day one.
4. Tests written before implementation. Coverage >= 80% on every merge to main.
5. Structured JSON logging throughout. Correlation IDs on all critical flows. No PHI in any observability system.

See `.specify/memory/constitution.md` for the full project constitution (v1.1.0).

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Runtime development guidance for Claude Code |
| `.specify/memory/constitution.md` | Project constitution v1.1.0 — non-negotiable principles |
| `specs/001-patient-psychiatrist-match/spec.md` | Active feature spec — fully clarified, ready for planning |
| `specs/001-patient-psychiatrist-match/actor-flows.md` | Actor-level flow diagrams |
| `specs/001-patient-psychiatrist-match/competitive-edge.md` | Product differentiation analysis vs. Practo, Lybrate, MFine, and others |
| `.specify/feature.json` | Active feature directory pointer |

## Scale Target

- Launch: 500 concurrent users, 99.5% uptime
- Architecture must scale to 5,000 concurrent users without structural rewrites

## Contributing

See `CLAUDE.md` for the spec-driven development rules that govern all contributions. No code may be written without a completed, clarified spec and a reviewed plan.
