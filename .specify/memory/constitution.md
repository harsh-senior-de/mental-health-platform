<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR: new sections added, existing principles expanded)

Modified principles:
  - I. Privacy & Data Sovereignty — expanded: added India-specific regulations
    (Mental Healthcare Act 2017, DPDPA 2023), explicit consent rule, psychiatrist
    data-access scoping, PostgreSQL + encryption requirements
  - II. Clinical Safety First — expanded: strengthened no-diagnosis rule, added
    licensed-psychiatrist-only decision mandate, long-term continuity of care
  - V. Observability & Audit Compliance — expanded: added end-to-end traceability,
    error tracking, critical-flow coverage requirement

Added sections:
  - Architecture Rules (service-oriented, API-first, versioning, event-driven)
  - Data & Database Rules (PostgreSQL, schema discipline, normalization)
  - Code Quality Rules (clean architecture, service layer, DTOs, no duplication)
  - Product & UX Principles (personalization, explainability, retention)
  - Matching Engine Rules (symptom/preference/severity scoring, extensibility)
  - Notification System Rules (personalized, adaptive, contextual)
  - Forbidden Practices (explicit prohibitions list)
  - Future Readiness (AI/ML extensibility, scale to millions)

Removed sections: N/A

Templates reviewed & status:
  ✅ .specify/templates/plan-template.md — Constitution Check section is generic; compatible.
     Recommend adding India compliance check gate when filling in new plans.
  ✅ .specify/templates/spec-template.md — Compatible; no changes needed.
  ✅ .specify/templates/tasks-template.md — Compatible; no changes needed.
  ⚠ .specify/templates/commands/ — Directory empty; no command templates to update.

Deferred TODOs:
  - None; all placeholders resolved.
-->

# Mental Health Platform Constitution — India

## Core Principles

### I. Privacy & Data Sovereignty (NON-NEGOTIABLE)

Mental health data is among the most sensitive personal information. The platform MUST treat
every piece of user data as Protected Health Information (PHI) by default.

- All data at rest MUST be encrypted (AES-256 or equivalent).
- All data in transit MUST use TLS 1.2+.
- Data collection MUST be minimized to only what is necessary for the feature.
- Explicit, informed user consent MUST be obtained before storing or processing sensitive data.
- Users MUST be able to export and delete their data at any time.
- No PHI or PII MUST ever appear in logs, error messages, analytics events, or metric labels.
- Features touching user health data MUST document their data flows before implementation.
- Psychiatrists MUST only be able to access data for their assigned patients — no lateral access.
- Patient data MUST be normalized and structured in PostgreSQL; unstructured JSON storage
  requires written justification in the plan's Complexity Tracking table.
- Audit logs MUST be maintained for all critical actions: login, booking, prescription updates,
  and PHI access (read, write, delete). Logs MUST be immutable and retained for ≥ 7 years.

**Rationale**: India's Mental Healthcare Act 2017 and Digital Personal Data Protection Act 2023
(DPDPA) impose strict obligations on health data processors. A breach of mental health data
causes disproportionate, irreversible harm to already-vulnerable users.

### II. Clinical Safety First (NON-NEGOTIABLE)

The platform serves users who may be in psychological distress. Safety guardrails are
non-negotiable and override feature velocity at all times.

- Every user-facing feature MUST undergo a safety review before shipping.
- Crisis intervention pathways (hotlines, emergency contacts) MUST always be reachable and
  MUST NOT be gated behind authentication, subscriptions, or paywalls.
- Automated systems MUST NOT provide clinical diagnoses or treatment plans. Only licensed
  psychiatrists may make clinical decisions on the platform.
- Content that could increase self-harm risk MUST be flagged and routed for human review.
- All content moderation decisions MUST be auditable.
- The system MUST support long-term patient memory and continuity of care across sessions.

**Rationale**: Mental health platforms carry a statutory duty of care under the Mental
Healthcare Act 2017. A feature that works technically but harms a vulnerable user is a
product failure — not a trade-off.

### III. Accessibility & Inclusivity

The platform MUST be usable by people with disabilities and across India's diverse population.

- All UI MUST conform to WCAG 2.1 Level AA as a minimum bar.
- Screen reader compatibility MUST be validated before any UI feature ships.
- Language and reading level MUST target a general audience (Flesch-Kincaid Grade ≤ 8).
- Color MUST NOT be the sole means of conveying information (colorblind accessibility).
- Internationalization (i18n) hooks MUST be included in all user-visible strings from day one.

**Rationale**: Mental health challenges affect everyone. Inaccessible design excludes the
people who may need support the most.

### IV. Test-Driven Development (NON-NEGOTIABLE)

All production code MUST be preceded by failing tests that define the expected behavior.

- Tests MUST be written and reviewed before implementation begins (Red → Green → Refactor).
- Unit tests are required for all business logic and data transformation functions.
- Integration tests are required for all external service boundaries (database, third-party APIs).
- Clinical safety paths (crisis routing, content flags, prescription flows) MUST have dedicated
  end-to-end tests.
- Test coverage MUST NOT drop below 80% on any merge to the main branch.
- No feature is considered complete until its acceptance scenarios from the spec pass.

**Rationale**: In a safety-critical domain, untested code is a liability. TDD ensures
requirements are understood before implementation and regressions are caught automatically.

### V. Observability & Audit Compliance

All significant platform events MUST be observable and auditable without exposing PHI.

- Structured logging (JSON) MUST be used throughout; log levels MUST follow severity semantics.
- All services MUST include: structured logging, error tracking, and performance metrics.
- Critical flows (booking, prescription, matching, crisis escalation) MUST be traceable
  end-to-end via correlation IDs.
- Metrics MUST be instrumented for all API endpoints (latency p50/p95, error rate, throughput).
- Alerts MUST be defined for p95 latency > 500ms and error rate > 1% on critical paths.
- No PII or PHI MUST appear in metric labels, trace attributes, or log fields.

**Rationale**: Compliance mandates auditability; operations require observability.
The constraint against PHI in observability data reconciles both requirements safely.

## Architecture Rules

- The backend MUST follow modular, service-oriented architecture. Each service has one
  responsibility — no service may own concerns belonging to another.
- All inter-service communication MUST be API-first using REST.
- All APIs MUST be versioned: `/api/v1/...`, `/api/v2/...`. Breaking changes require a new
  version; no silent in-place changes to existing versioned contracts.
- Event-driven architecture MUST be used for notifications and all asynchronous workflows.
- No tight coupling between services. Services communicate via defined API contracts or
  event queues — never via shared database tables or direct function calls across boundaries.
- Personalization and adaptation MUST be data-driven and dynamic, not rule-based static logic.

## Data & Database Rules

- PostgreSQL is the primary database for all structured data.
- Schema design MUST be strict — no unstructured JSON columns unless the plan documents
  why a relational schema is insufficient.
- Patient data MUST be fully normalized and structured.
- All PII and PHI MUST be encrypted at rest (AES-256) and in transit (TLS 1.2+).
- Audit logs MUST be maintained for all critical actions and stored separately from
  application data.
- No controller or router layer MUST access the database directly. All DB access goes
  through the service layer.

## Code Quality Rules

- Follow clean architecture principles throughout the codebase.
- Business logic MUST live in the service layer — never in controllers, routes, or handlers.
- DTOs (Data Transfer Objects) MUST be used for all API inputs and outputs.
- All code MUST include proper error handling and structured logging at appropriate levels.
- No duplicate logic — reuse existing services rather than re-implementing behavior.
- No hardcoded business rules, thresholds, or mappings — use configurable, data-driven logic.

## Security & Compliance Requirements

All features MUST comply with the following baseline:

- **Regulatory alignment**: Features involving clinical data MUST be reviewed for compliance
  with the Mental Healthcare Act 2017 and the Digital Personal Data Protection Act 2023
  (DPDPA) before shipping.
- **Explicit consent**: The platform MUST obtain explicit, informed user consent before
  collecting or processing any sensitive personal data.
- **Authentication**: Multi-factor authentication (MFA) MUST be offered; sessions MUST expire.
- **Authorization**: RBAC MUST be enforced at the service layer — not only at the UI layer.
  Psychiatrists MUST only access their assigned patients' data.
- **Dependency hygiene**: All third-party dependencies MUST be reviewed for known CVEs before
  adoption and kept current via automated scanning (e.g., Dependabot or equivalent).
- **Secrets management**: Credentials, API keys, and certificates MUST NOT be committed to
  version control. A secrets manager MUST be used in all environments.
- **Penetration testing**: A security review MUST be conducted before any major release that
  introduces new authentication, authorization, or PHI-handling flows.

## Product & UX Principles

- Personalization MUST take precedence over generic flows. The system MUST adapt to user
  behavior and history over time — not serve static, one-size-fits-all experiences.
- Every recommendation surface MUST be explainable: users MUST be able to understand why
  a suggestion was made.
- Notifications MUST be contextual and non-intrusive — no fixed schedules, no spam.
  Frequency and timing MUST adapt per user based on history and preference.
- Product decisions MUST favor long-term retention and continuity of care over short-term
  engagement metrics.

## Matching Engine Rules

- Patient-psychiatrist matching MUST factor in: symptoms, user preferences, and severity level.
- Matching MUST use a scoring-based ranking system — no hardcoded or static mappings.
- Matching logic MUST be configurable without code changes.
- The matching engine MUST be designed for extensibility to support future ML-based ranking
  without requiring architectural rewrites.

## Notification System Rules

- All notifications MUST be personalized based on patient history and current context.
- Scheduling MUST be adaptive per user — no platform-wide fixed notification times.
- Supported notification types: medication reminders, behavioral nudges, follow-up prompts.
- Notification delivery MUST be event-driven, not scheduled batch jobs.
- Notification frequency MUST be bounded by per-user preference settings; users MUST be
  able to opt out of any notification category.

## Forbidden Practices

The following are explicitly prohibited on this platform:

- ❌ Hardcoded business logic, thresholds, or mappings in code
- ❌ Direct database access from controllers, routers, or handlers
- ❌ Skipping the spec or plan phase before implementation
- ❌ Storing sensitive data without encryption
- ❌ Duplicate implementations of existing service logic
- ❌ Assumption-based coding — every behavior must be defined in the spec
- ❌ Automated clinical diagnosis or treatment recommendations
- ❌ Logging, tracing, or emitting PHI or PII in any observability system

## Development Workflow

The platform follows Spec-Driven Development. Every feature MUST progress through:
**Constitution → Spec → Plan → Tasks → Implementation** — in that order.

- **Specification first**: Every feature MUST have a spec reviewed and approved before
  a feature branch is opened. No direct coding without spec approval.
- **Branch policy**: All work MUST happen on feature branches; direct commits to `main` are
  prohibited. Branch names MUST follow the `###-feature-name` convention.
- **Pull request gates**: All PRs MUST pass: (1) automated test suite, (2) linting/formatting
  checks, (3) security scan, (4) peer code review (minimum one approval), and (5) safety review
  for any user-facing change.
- **Definition of done**: A task is done only when code is merged, tests pass in CI, and the
  acceptance scenarios from the spec are verified in a staging environment.
- **Complexity justification**: Any decision adding a new service, database, or external
  dependency MUST be justified in the plan's Complexity Tracking table.
- **YAGNI enforcement**: Code MUST NOT be written for hypothetical future requirements.
  Build the simplest thing that passes the acceptance scenarios.

## Future Readiness

The platform MUST be designed for extensibility without requiring foundational rewrites:

- Architecture MUST support integration of AI-based recommendations and ML-based
  personalization in future iterations.
- Matching and notification engines MUST expose extension points for ML model integration.
- Data models and service contracts MUST be versioned to allow evolution without breaking
  existing consumers.
- The system MUST be designed to scale to millions of users — choose data structures,
  indexing strategies, and service boundaries accordingly from the start.
- Design decisions that trade extensibility for short-term speed MUST be documented and
  justified in the plan.

## Governance

This constitution supersedes all other development practices and guidelines. Amendments require:

1. A written proposal documenting: the change, the rationale, and the migration plan for
   existing features affected by the change.
2. Approval from at least two senior contributors or the project lead.
3. A version bump following semantic versioning:
   - **MAJOR**: Removal or redefinition of a Non-Negotiable principle.
   - **MINOR**: New principle or section added, or material expansion of existing guidance.
   - **PATCH**: Clarifications, wording corrections, non-semantic refinements.
4. All PRs and reviews MUST verify compliance with the current constitution version.
5. The constitution MUST be reviewed at minimum every 6 months or after any regulatory
   change affecting the platform's compliance obligations (particularly DPDPA amendments).

Runtime development guidance lives in `CLAUDE.md` (project root). That file provides
task-level instructions; this constitution provides the non-negotiable principles that
constrain all task-level decisions.

**Version**: 1.1.0 | **Ratified**: 2026-05-01 | **Last Amended**: 2026-05-01
