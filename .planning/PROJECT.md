# Mental Health Platform India — Project Reference

## Core Value

A web-based mental health platform for India (modelled on Hims & Hers Mental Health).
Patients register, complete a mental health intake questionnaire, are matched to a licensed
psychiatrist from a partner agency, book Zoom video sessions through the platform, and receive
personalised long-term care via WhatsApp — medication reminders, activity nudges, follow-up
prompts — timed to each individual's preferences.

Target market: India.
Regulatory obligations: Mental Healthcare Act 2017 + DPDPA 2023 + Telemedicine Practice Guidelines 2020 + Telepsychiatry Operational Guidelines 2020.
Scale target: 500 concurrent users at launch; architecture must reach 5,000 without structural rewrites.
Platform type: Web application only (v1). No mobile app.

---

## Locked Decisions

All 17 decisions below are sourced from constitution v1.1.0 (ratified 2026-05-01).
They are non-negotiable and supersede all other guidance.

### DEC-001 — Privacy and PHI Handling

All user data is Protected Health Information by default. PHI must be encrypted at rest
(AES-256) and in transit (TLS 1.2+). No PHI or PII may appear in logs, error messages,
analytics events, or metric labels. Explicit informed consent must be obtained before
storing or processing sensitive data. Users must be able to export and delete their data
at any time. Psychiatrists may only access data for their assigned patients within the
active access window. Patient data must be normalised and stored in PostgreSQL.
Unstructured JSON columns require written justification in the plan's Complexity Tracking
table.

### DEC-002 — Immutable Audit Logs, 7-Year Retention

Audit logs must be maintained for all critical actions: login, booking, prescription
updates, and PHI access (read, write, delete). Logs must be immutable and retained for
at least 7 years.

### DEC-003 — Clinical Safety Non-Negotiable

Every user-facing feature must undergo a safety review before shipping. Crisis intervention
pathways must always be reachable and must not be gated behind authentication, subscriptions,
or paywalls. Automated systems must not provide clinical diagnoses or treatment plans. Only
licensed psychiatrists may make clinical decisions on the platform. Content that could increase
self-harm risk must be flagged and routed for human review. All content moderation decisions
must be auditable. The system must support long-term patient memory and continuity of care
across sessions.

### DEC-004 — Accessibility: WCAG 2.1 AA + i18n From Day One

All UI must conform to WCAG 2.1 Level AA as a minimum bar. Screen reader compatibility must
be validated before any UI feature ships. Language and reading level must target a general
audience (Flesch-Kincaid Grade 8 or below). Color must not be the sole means of conveying
information. i18n hooks must be included in all user-visible strings from day one.

### DEC-005 — Test-Driven Development

Tests must be written and reviewed before implementation begins (Red-Green-Refactor). Unit
tests required for all business logic and data transformation. Integration tests required for
all external service boundaries. Clinical safety paths (crisis routing, content flags,
prescription flows) must have dedicated end-to-end tests. Coverage must not drop below 80%
on any merge to main. A feature is not complete until its spec acceptance scenarios pass.

### DEC-006 — Structured JSON Observability Without PHI

Structured JSON logging must be used throughout. All services must include structured logging,
error tracking, and performance metrics. Critical flows (booking, prescription, matching,
crisis escalation) must be traceable end-to-end via correlation IDs. Metrics must be
instrumented for all API endpoints (latency p50/p95, error rate, throughput). Alerts must
be defined for p95 latency > 500ms and error rate > 1% on critical paths. No PII or PHI
may appear in metric labels, trace attributes, or log fields.

### DEC-007 — Service-Oriented Architecture, REST, Versioned APIs

The backend must follow modular, service-oriented architecture with one responsibility per
service. All inter-service communication must be API-first using REST. All APIs must be
versioned (/api/v1/..., /api/v2/...). Breaking changes require a new version; no silent
in-place changes to existing versioned contracts. Event-driven architecture must be used
for notifications and all asynchronous workflows. Services communicate via defined API
contracts or event queues — never via shared database tables or direct function calls
across boundaries. Personalisation and adaptation must be data-driven and dynamic, not
rule-based static logic.

### DEC-008 — PostgreSQL Primary Database

PostgreSQL is the primary database for all structured data. Schema design must be strict —
no unstructured JSON columns unless the plan documents why a relational schema is
insufficient. Patient data must be fully normalised and structured. All PII and PHI must be
encrypted at rest (AES-256) and in transit (TLS 1.2+). Audit logs must be stored separately
from application data. No controller or router layer may access the database directly; all
DB access goes through the service layer.

### DEC-009 — No Hardcoded Business Logic

Business logic must live in the service layer — never in controllers, routes, or handlers.
DTOs must be used for all API inputs and outputs. No duplicate logic — reuse existing
services. No hardcoded business rules, thresholds, or mappings; all must be configurable
and data-driven. Automated clinical diagnosis or treatment recommendations are explicitly
prohibited.

### DEC-010 — Regulatory Compliance: MHCA 2017 + DPDPA 2023

Features involving clinical data must be reviewed for compliance with the Mental Healthcare
Act 2017 and the Digital Personal Data Protection Act 2023 before shipping. Explicit informed
consent must be obtained before collecting or processing sensitive personal data.

### DEC-011 — Security Baseline: MFA, RBAC, Dependency Hygiene, Secrets

MFA must be offered; sessions must expire. RBAC must be enforced at the service layer — not
only at the UI layer. Psychiatrists must only access their assigned patients' data. All
third-party dependencies must be reviewed for known CVEs before adoption and kept current via
automated scanning. Credentials, API keys, and certificates must not be committed to version
control; a secrets manager must be used in all environments. A security review must be
conducted before any major release introducing new authentication, authorisation, or
PHI-handling flows.

### DEC-012 — Personalisation Over Generic Flows

Personalisation must take precedence over generic flows. Every recommendation surface must
be explainable — users must understand why a suggestion was made. Notifications must be
contextual and non-intrusive; frequency and timing must adapt per user based on history and
preference. Product decisions must favour long-term retention and continuity of care over
short-term engagement metrics.

### DEC-013 — Matching Engine: Scoring-Based, Configurable, ML-Extensible

Matching must factor in symptoms, user preferences, and severity level. Matching must use a
scoring-based ranking system — no hardcoded or static mappings. Matching logic must be
configurable without code changes. The matching engine must be designed for extensibility to
support future ML-based ranking without requiring architectural rewrites.

### DEC-014 — Notification System: Personalised, Adaptive, Event-Driven

All notifications must be personalised based on patient history and current context.
Scheduling must be adaptive per user — no platform-wide fixed notification times. Supported
types: medication reminders, behavioural nudges, follow-up prompts. Delivery must be
event-driven, not scheduled batch jobs. Notification frequency must be bounded by per-user
preference settings; users must be able to opt out of any notification category.

### DEC-015 — Spec-Driven Development Workflow

Every feature must progress through: Constitution → Spec → Plan → Tasks → Implementation.
Spec must be reviewed and approved before a feature branch is opened. No direct coding
without spec approval. All work on feature branches; direct commits to main are prohibited.
All PRs must pass automated tests, linting/formatting, security scan, peer review (min one
approval), and safety review for any user-facing change. YAGNI enforced.

### DEC-016 — Future Readiness: AI/ML, Scale to Millions

Architecture must support integration of AI-based recommendations and ML-based personalisation
in future iterations. Matching and notification engines must expose extension points for ML
model integration. Data models and service contracts must be versioned to allow evolution
without breaking existing consumers. The system must be designed to scale to millions of
users from the start.

### DEC-017 — Constitution Governance and Amendment

The constitution supersedes all other development practices and guidelines. Amendments
require a written proposal, approval from at least two senior contributors or the project
lead, and a semver version bump. The constitution must be reviewed at minimum every 6 months
or after any regulatory change affecting compliance obligations.

---

## Constraints Summary

| ID | Type | Summary |
|----|------|---------|
| CONSTRAINT-001 | nfr | AES-256 at rest, TLS 1.2+ in transit for all PHI/PII |
| CONSTRAINT-002 | schema | PostgreSQL primary; no JSON columns without plan justification |
| CONSTRAINT-003 | api-contract | Service layer owns all business logic and DB access |
| CONSTRAINT-004 | api-contract | Versioned REST APIs; no silent breaking changes |
| CONSTRAINT-005 | protocol | Event-driven architecture for all async workflows |
| CONSTRAINT-006 | nfr | No PHI/PII in any observability output, any environment |
| CONSTRAINT-007 | nfr | Immutable audit logs retained 7 years minimum |
| CONSTRAINT-008 | nfr | Correlation IDs on all critical flows; p95 alerts at 500ms |
| CONSTRAINT-009 | nfr | WCAG 2.1 AA minimum; i18n hooks in all user-visible strings |
| CONSTRAINT-010 | nfr | Test coverage ≥ 80% on every merge; TDD enforced |
| CONSTRAINT-011 | nfr | No automated clinical diagnosis or treatment recommendations |
| CONSTRAINT-012 | nfr | No hardcoded business logic, thresholds, or mappings |
| CONSTRAINT-013 | api-contract | RBAC at service layer; psychiatrist access scoped per booking window |
| CONSTRAINT-014 | protocol | Single platform Zoom Business account; all transcripts via webhook |
| CONSTRAINT-015 | protocol | Razorpay INR; three-path confirmation; customer money never held |
| CONSTRAINT-016 | protocol | All v1 sessions are Zoom video only |
| CONSTRAINT-017 | nfr | List C drugs hard-blocked from all telemedicine prescriptions |
| CONSTRAINT-018 | nfr | MCI registration number mandatory on all prescriptions |
| CONSTRAINT-019 | nfr | Patient data portability and deletion within 72-hour SLA |
| CONSTRAINT-020 | nfr | 500 concurrent at launch, 5,000 without structural rewrites |
| CONSTRAINT-021 | nfr | Secrets manager required in all environments |
| CONSTRAINT-022 | schema | No active-relationship concept; booking-driven access model |
| CONSTRAINT-023 | schema | Patient entity primary key must be UUID (not mobile number) |
| CONSTRAINT-024 | nfr | GSTIN ownership decision requires CA confirmation before invoicing impl |
| CONSTRAINT-025 | nfr | Web application only; no mobile app in v1 |
| CONSTRAINT-026 | nfr | Prescription PDFs excluded from patient data export — prescriptions are formal clinical documents; patients access them individually from appointment history (FR-043); approved session notes are the clinical record included in the export |
| CONSTRAINT-028 | schema | Three session-type fees per psychiatrist (Initial Assessment, Follow-Up, Urgent Review); locked into Payment record at booking; bulk update supported |
| CONSTRAINT-029 | schema | CareRecommendation captures all MHCA 2017 Form B-1 mandatory fields including explicit treatment consent checkbox ("The patient has given verbal consent to the treatment discussed in this session"); Form B-1 declaration checkbox required before approval |
| CONSTRAINT-030 | protocol | Consent is a hard gate; patient decline triggers immediate deletion of partial account (mobile + OTP record only) |
| CONSTRAINT-031 | schema | GST invoice number format: [PREFIX]/[FY]/[SEQUENCE]; auto-incrementing, gapless, resets April 1; immutable once issued |
| CONSTRAINT-032 | protocol | Medication initiation safety net (FR-048): prescription comparison on finalisation identifies new-initiation drugs (not in any prior prescription for patient); triggers patient WhatsApp nudge (configurable delay, default 7 days) and psychiatrist dashboard notification (day 7 until follow-up booked or 30 days expire); both events audit-logged; no trigger for medications already in a prior prescription |
| CONSTRAINT-033 | nfr | Patient progress dashboard (FR-017a): all data sourced exclusively from psychiatrist-approved records (session notes, adherence confirmation events, CareRecommendation.next_follow_up_date); no automated clinical inference; not shown until patient has ≥1 approved session |
| CONSTRAINT-034 | protocol | WhatsApp Business API "Mark as taken" button template (FR-021b) must be approved by Meta/WhatsApp before platform launch; template approval is a pre-launch planning-phase task |

---

## Open Gaps (Flagged for Planning)

These gaps are not blockers to roadmapping but must be resolved before the implementing
phase that touches them. They are tracked here and annotated in the relevant phase notes.

All v1 gaps resolved. The following items are deferred to v2:

| Gap | Priority | Summary | Target |
|-----|----------|---------|--------|
| GAP-032 | IMPORTANT | Treatment phase tracking (Acute/Continuation/Maintenance) not modelled. | v2 |
| GAP-035 | IMPORTANT | Caregiver Consultation session type — deferred per spec Future Readiness. | v2 |

---

## User Roles

| Role | Auth Method | Access Scope |
|------|-------------|--------------|
| Patient | OTP via SMS (every login) | Own profile, intake, bookings, care history |
| Psychiatrist | Email + password + TOTP (mandatory) | Assigned patients only (within active booking window) |
| AgencyAdmin | Email + password + TOTP (mandatory) | Psychiatrist profiles and availability; own agency only; no clinical data |
| PlatformAdmin | Email + password + TOTP (mandatory) | Ops dashboards and account actions; zero clinical data |

---

## Key External Integrations

| Integration | Purpose |
|-------------|---------|
| Razorpay | INR payment collection; three-path booking confirmation; refunds |
| Zoom Business API | Session meeting creation; transcript webhook delivery |
| SMS provider (primary + backup) | OTP delivery; Tier 1 and Tier 2 notifications |
| WhatsApp Business API | Tier 2 and Tier 3 notifications; data export delivery |

---

## Scale and Performance Targets

- 500 concurrent users at launch with 99.5% monthly uptime
- P95 latency alerts at 500ms for critical paths
- Architecture must scale to 5,000 concurrent users without structural rewrites
- Booking confirmation to patient within 5 seconds (Path 1, normal flow)
- Match list returned within 5 seconds of intake completion
- Notification delivery within ±5 minutes of patient's stated preferred time
- 95% notification delivery success rate across all active patients
