# Implementation Plan: Patient Intake, Psychiatrist Matching & Personalized Care

**Branch**: `001-patient-psychiatrist-match` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-patient-psychiatrist-match/spec.md`

## Summary

Build a web-based telepsychiatry platform for India where patients authenticate by SMS OTP, provide explicit DPDPA consent, complete a structured intake questionnaire, receive ranked psychiatrist matches across agencies, book Zoom sessions through Razorpay, and receive psychiatrist-approved long-term care follow-ups over WhatsApp. The approved architecture is a Python/FastAPI modular monolith deployed to AWS ECS Fargate, backed by RDS PostgreSQL Multi-AZ, ElastiCache Redis for Celery jobs, S3 for generated artifacts, CloudFront/WAF at the edge, and Terraform-managed infrastructure.

## Approved Architecture Decisions

| Area | Decision |
|---|---|
| Backend | Python 3.12+ with FastAPI |
| Frontend | React + Vite authenticated SPA |
| API style | REST, versioned under `/api/v1` |
| Service shape | Modular monolith with strict internal service boundaries |
| Database | Amazon RDS PostgreSQL Multi-AZ |
| ORM/migrations | SQLAlchemy 2.0 + Alembic |
| Async jobs | Celery workers + Celery beat backed by Amazon ElastiCache Redis |
| File/object storage | Amazon S3 with KMS encryption |
| Hosting | AWS ECS Fargate behind Application Load Balancer |
| Edge | CloudFront + AWS WAF |
| Secrets | AWS Secrets Manager |
| Encryption | AWS KMS for application and storage keys |
| Observability | CloudWatch logs/metrics/alarms with strict PHI/PII redaction |
| Infrastructure as Code | Terraform |
| CI/CD | GitHub Actions → ECR image build → ECS deploy |

## Technical Context

**Language/Version**: Python 3.12+ backend; TypeScript frontend only for React/Vite SPA  
**Primary Dependencies**: FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Celery, Redis client, boto3, pytest, ruff, mypy/pyright, React, Vite  
**Storage**: RDS PostgreSQL Multi-AZ primary database; S3 for prescription PDFs and export packages; append-only audit log table; ElastiCache Redis for queues/cache  
**Testing**: pytest for backend unit/integration/contract tests; Testcontainers or Docker Compose for PostgreSQL/Redis integration; Playwright for browser E2E; frontend unit tests with Vitest if React/Vite is scaffolded  
**Target Platform**: AWS Linux containers on ECS Fargate  
**Project Type**: Web application: FastAPI REST backend + React/Vite frontend  
**Performance Goals**: Matching results return within 5 seconds; critical API p95 latency under 500ms at launch scale; audit entries searchable within 24 hours  
**Constraints**: No PHI/PII in logs, metrics, or traces; all PHI encrypted at rest and in transit; all thresholds stored in `PlatformConfiguration`; RBAC enforced in service layer  
**Scale/Scope**: 500 concurrent users at launch, 5,000 concurrent users without structural rewrite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| Privacy & Data Sovereignty | PHI encrypted, PII/PHI excluded from logs, consent before health data, export/delete flows designed | PASS |
| Clinical Safety First | No automated diagnosis or treatment; psychiatrist approval required for care records; crisis helplines always reachable | PASS |
| Accessibility & Inclusivity | WCAG 2.1 AA and i18n hooks required for all UI tasks | PASS |
| Test-Driven Development | Every implementation task includes failing test first, red-green-refactor, and coverage verification | PASS |
| Observability & Audit Compliance | Structured JSON logs, correlation IDs, audit logging without PHI/PII | PASS |
| Architecture Rules | Modular service-oriented backend, versioned `/api/v1`, event-driven async workflows | PASS |
| Data & Database Rules | PostgreSQL normalized schema; no unstructured JSON except explicitly justified metadata | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/001-patient-psychiatrist-match/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── tasks.md
├── actor-flows.md
├── competitive-edge.md
└── spec.md
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── app/
│   │   ├── main.py
│   │   ├── auth/
│   │   ├── intake/
│   │   ├── matching/
│   │   ├── booking/
│   │   ├── clinical/
│   │   ├── notifications/
│   │   ├── admin/
│   │   ├── data_lifecycle/
│   │   ├── audit/
│   │   └── shared/
│   ├── tests/
│   │   ├── contract/
│   │   ├── integration/
│   │   └── unit/
│   ├── alembic/
│   └── pyproject.toml
└── web/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── features/
    │   ├── routes/
    │   └── shared/
    └── tests/

infra/
└── terraform/
    ├── environments/
    │   ├── dev/
    │   ├── staging/
    │   └── prod/
    └── modules/
        ├── network/
        ├── ecs/
        ├── rds/
        ├── elasticache/
        ├── s3/
        ├── secrets/
        └── observability/
```

**Structure Decision**: Use one repository with separate backend, frontend, and infrastructure directories. Backend modules match the service boundaries in `docs/ARCHITECTURE.md`; routers only validate DTOs and call service-layer methods. Database access goes through SQLAlchemy repositories/services, never from route handlers.

## AWS Runtime Topology

```text
CloudFront + AWS WAF
        |
Application Load Balancer
        |
ECS Fargate
  - api service: FastAPI/uvicorn containers
  - worker service: Celery worker containers
  - scheduler service: Celery beat container
        |
RDS PostgreSQL Multi-AZ
ElastiCache Redis
S3 encrypted buckets
Secrets Manager + KMS
CloudWatch Logs/Metrics/Alarms
```

## Phase 0 Research Output

See [research.md](./research.md). Key decisions:

- FastAPI is selected for typed Python REST APIs and OpenAPI generation.
- SQLAlchemy 2.0 + Alembic is selected for explicit relational modeling and migrations.
- Celery + ElastiCache Redis is selected for v1 async jobs, delayed notifications, reconciliation, export, and deletion workflows.
- ECS Fargate is selected for container hosting without managing EC2 capacity.
- Terraform is selected for reproducible AWS infrastructure.

## Phase 1 Design Output

See [data-model.md](./data-model.md) and [contracts/openapi.yaml](./contracts/openapi.yaml).

Design highlights:

- `Patient`, `PatientProfile`, `ConsentRecord`, `IntakeResponse`, and `IntakeEditHistory` support OTP-only patient onboarding and editable intake.
- `Agency`, `StaffUser`, `PsychiatristProfile`, and `AvailabilitySlot` support multi-agency operations and staff TOTP auth.
- `Appointment`, `Payment`, `ZoomMeeting`, `SessionTranscript`, `CareRecommendation`, `Prescription`, and `SessionFeedback` support booking, clinical records, e-prescriptions, and post-session workflows.
- `NotificationPreference`, `NotificationJob`, `AdherenceConfirmation`, `DataLifecycleJob`, `PlatformConfiguration`, and `AuditLog` support personalization, async work, deletion/export, and compliance.

## Delivery Strategy

1. Foundation: Python backend app shell, test tooling, migrations, database session management, API shell, structured logging, correlation IDs, configuration, Terraform skeleton.
2. MVP P1: patient OTP/consent/profile/intake, psychiatrist/admin account scaffolding, matching, availability, payment booking, Zoom meeting creation.
3. P2 clinical continuity: transcript ingestion, session notes, care recommendations, prescriptions, feedback, care history.
4. P2 notifications and lifecycle: WhatsApp reminders, adherence confirmations, follow-up nudges, exports, deletion/anonymisation.
5. Admin and hardening: platform configuration, ops dashboards, audit search, accessibility, security, performance, compliance review.

## TDD and Review Gates

- Each task starts with a failing pytest, integration, contract, frontend, or E2E test.
- The failing test must be run and its failure captured before implementation.
- Implementation must make only the targeted test pass, then run the relevant suite.
- Each story checkpoint requires code review against the spec, plan, PHI/PII constraints, DPDPA, clinical safety, accessibility, and coverage.
- Completion requires backend `pytest`, `ruff check`, `ruff format --check`, type check, frontend checks, and Playwright E2E for implemented stories.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| ElastiCache Redis in addition to PostgreSQL | Asynchronous notifications, payment reconciliation, Zoom transcript handling, deletion jobs, and delayed nudges require retries and scheduling | PostgreSQL-only polling would increase reliability risk and operational complexity |
| React frontend in addition to Python backend | Patient intake, booking, psychiatrist notes, admin dashboards, and notification settings need rich authenticated workflows | Server-rendered templates would slow UI iteration and make complex form states harder to test |
