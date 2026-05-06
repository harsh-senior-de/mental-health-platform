# Implementation Plan: Patient Intake, Psychiatrist Matching & Personalized Care

**Branch**: `001-patient-psychiatrist-match` | **Date**: 2026-05-06 | **Spec**: [spec.md](../../specs/001-patient-psychiatrist-match/spec.md)
**Input**: Feature specification from `specs/001-patient-psychiatrist-match/spec.md`

## Summary

Build a web-based telepsychiatry platform for India where patients authenticate by SMS OTP, provide explicit DPDPA consent, complete a structured intake questionnaire, receive ranked psychiatrist matches across agencies, book Zoom sessions through Razorpay, and receive psychiatrist-approved long-term care follow-ups over WhatsApp.

**Deployment strategy**: demo-first, then production. All config is environment-variable driven so the same Docker image runs locally (free), on the cloud demo (~$20–35/month), and on the full production stack with zero code changes. See the Demo vs Production Infrastructure section below.

## Approved Architecture Decisions

| Area | Dev / Demo (laptop on) | 24/7 Unattended Demo | Production |
|---|---|---|---|
| Backend | Python 3.12+ / FastAPI | Same | Same |
| Frontend | React + Vite | Same | Same |
| API style | REST, versioned `/api/v1` | Same | Same |
| Service shape | Modular monolith | Same | Same |
| Hosting | Docker Compose + ngrok ($0) | AWS App Runner (~$5–15/month) | ECS Fargate + ALB |
| Database | Docker Compose postgres | Neon free tier or RDS t3.micro | RDS PostgreSQL Multi-AZ |
| ORM/migrations | SQLAlchemy 2.0 + Alembic | Same | Same |
| Async jobs | Docker Compose redis + Celery | Upstash Redis free tier | ElastiCache Redis |
| File storage | `LocalStorageAdapter` | Cloudflare R2 free tier | S3 + KMS |
| Secrets | `.env` file | App Runner env vars (encrypted) | AWS Secrets Manager |
| Encryption | None needed | R2 default encryption (free) | AWS KMS |
| Edge | None | None | CloudFront + AWS WAF |
| Observability | Structured stdout logs | Same | CloudWatch logs/metrics/alarms |
| Infrastructure as Code | Docker Compose | App Runner CLI | Terraform |
| CI/CD | Local | GitHub Actions → Docker build | GitHub Actions → ECR → ECS |

**Promotion rule**: every component swap is an environment variable or Terraform module change. Application code never changes between demo and production.

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

### Database Connection Pooling

- Use `asyncpg` driver (`DATABASE_URL` with `postgresql+asyncpg://`).
- `pool_size=10`, `max_overflow=5`, `pool_recycle=300`.
- ECS: number of tasks × `(pool_size + max_overflow)` must stay below RDS `max_connections` for the chosen instance size (RDS `t3.micro`: 85 connections; `t3.small`: 170).

### Alembic Migration Strategy

- All migrations must be backward-compatible (Expand-Contract pattern).
- Never add a `NOT NULL` column without a server-side default in the same migration.
- Column renames require a 3-phase migration: add new column → backfill → drop old column in separate deploy.
- ECS rolling deploys run old and new task definitions simultaneously — migrations must not break the old version.

### Celery Task Policies

- Payment reconciliation task: `max_retries=5`, exponential backoff starting at 60s. Dead-letter queue (`failed_reconciliation`) after 5 failures; page on-call after 3. Idempotency key on `Payment` row prevents double-credit.
- Notification jobs: `max_retries=3`, linear backoff 30s. Failed delivery updates `NotificationJob.status` to `failed`; admin dashboard surfaces failures.
- Export/deletion jobs: `max_retries=2`, 5-min delay. Failure surfaces in platform admin ops dashboard.

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

## Security Architecture

### Session Management

- Patient sessions: issue HttpOnly `SameSite=Strict` opaque token stored in Redis with TTL from `PlatformConfiguration.session_timeout` (30-min idle / 8-hr absolute). No JWT. No `localStorage`.
- Staff sessions: same cookie mechanism plus TOTP verification before session is activated.
- Session rotation: new token issued on each authenticated request that has been idle >5 minutes.
- Revocation: `POST /api/v1/auth/logout` purges the Redis session entry immediately.
- `SessionToken` entity (in data model) stores token hash, `created_at`, `last_active_at`, `expires_at`.

### Webhook Signature Verification

- Razorpay: verify `X-Razorpay-Signature` header using HMAC-SHA256 of `razorpay_order_id + "|" + razorpay_payment_id` with `RAZORPAY_WEBHOOK_SECRET`. Use `hmac.compare_digest`. Reject with 400 if missing or invalid. Log rejection (without payload body) to audit log.
- Zoom: verify `X-Zoom-Signature` using HMAC-SHA256 of `"v0:" + timestamp + ":" + raw_body` with `ZOOM_WEBHOOK_SECRET`. Reject requests where `X-Zoom-Request-Timestamp` is >5 minutes old. Reject with 400 if invalid.
- Both checks happen in FastAPI middleware/dependency before the handler body runs.

### OTP Rate Limiting

- Per-mobile: max 3 OTP requests per 10-minute window (configurable in `PlatformConfiguration`).
- Per-IP: max 10 OTP requests per 10-minute window (configurable).
- Implemented via Redis token-bucket in FastAPI middleware (`slowapi` or custom).
- Lockout after 3 consecutive failed OTP verifications: 15-minute lock stored on `Patient.otp_locked_until`.

### TOTP Enrollment (Staff)

- Generate TOTP secret (RFC 6238, 6-digit, 30s window) on first login.
- Display QR code once — secret never transmitted after enrollment.
- Staff must confirm one valid TOTP code before account activates.
- Backup codes: 8 × 8-char alphanumeric, hashed with bcrypt, displayed once, stored hashed.
- Secret stored in `StaffUser.totp_secret_encrypted`.

### CSRF Protection

- Session cookie uses `SameSite=Strict` — primary CSRF defense.
- All state-changing endpoints additionally check `Origin` header matches configured `ALLOWED_ORIGINS`.

### HTTPS

- ngrok (dev/demo): provides TLS termination automatically.
- App Runner (24/7 demo): auto-provisions TLS certificate.
- All environments: add `Strict-Transport-Security: max-age=31536000; includeSubDomains` response header in FastAPI middleware.

## Project Structure

### Documentation (this feature)

```text
specs/001-patient-psychiatrist-match/        ← WHAT to build
├── spec.md
├── actor-flows.md
├── competitive-edge.md
├── research/
│   └── psychiatry-sessions-india.md
└── checklists/
    ├── requirements.md
    └── gaps.md

superpower/001-patient-psychiatrist-match/   ← HOW to build it
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── contracts/
    └── openapi.yaml
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

## Demo Runtime Topology

```text
Dev + Demo while laptop is on — $0
─────────────────────────────────
docker compose up
  postgres:16-alpine
  redis:7-alpine
  api (FastAPI + Celery worker + beat combined)
  web (Vite dev server)
  LocalStorageAdapter → ./storage/
  .env file for secrets

ngrok http 8000
  → public HTTPS URL anyone can open on their phone
  → tunnels to localhost
  → $0 (free tier); $8/month for a stable custom subdomain

24/7 Unattended Demo — ~$5–15/month
─────────────────────────────────────
AWS App Runner (same Docker image, no code changes)
  Neon free tier PostgreSQL (auto-suspends, 0.5GB active storage (auto-suspends when idle))
  Upstash Redis free tier (10k commands/day)
  Cloudflare R2 free tier (10GB, no egress fees, S3-compatible)
  env vars set directly in App Runner service config (encrypted at rest)
```

## Production Runtime Topology (ECS Fargate, Terraform-managed)

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
S3 + KMS encrypted buckets
Secrets Manager
CloudWatch Logs/Metrics/Alarms
```

**Promotion checklist** (no code changes — config only):

| Demo component | Production swap | How |
|---|---|---|
| ngrok / App Runner | ECS Fargate + ALB | Terraform module, same Docker image |
| Neon / RDS single-AZ | RDS Multi-AZ | One Terraform variable |
| Upstash Redis | ElastiCache | Change `CELERY_BROKER_URL` |
| Cloudflare R2 | S3 + KMS | Clear `STORAGE_S3_ENDPOINT_URL`; add KMS key ARN |
| App Runner env vars | Secrets Manager | `SETTINGS_BACKEND=secrets_manager` |
| None | CloudFront + WAF | Terraform modules |

### Data Residency (DPDPA 2023)

- All AWS resources: region `ap-south-1` (Mumbai). No cross-region replication without explicit consent.
- Neon demo database: must use a region closest to India (use RDS `t3.micro` in `ap-south-1` if Neon's Mumbai region is unavailable on free tier).
- Cloudflare R2 bucket: set `--location-hint apac` at creation.
- All `DATABASE_URL`, `CELERY_BROKER_URL`, and storage endpoints must resolve to India-region infrastructure in staging and production.

### DPDPA 2023 Obligations

- Deletion SLA: on-demand deletion requests must complete (PII removal + async anonymisation) within 72 hours. `DataLifecycleJob` records must have `requested_at`; a CloudWatch alarm fires if any deletion job remains `pending` for >24 hours.
- Export SLA: data export packages must be delivered within 7 days; links expire after 48 hours.
- Audit retention: 7 years minimum from last platform activity.

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
3. P2 clinical continuity: transcript ingestion, session notes (including MHC Form B-1 session notes, legally required under MHCA 2017), care recommendations, prescriptions, feedback, care history.
4. P2 notifications and lifecycle: WhatsApp reminders, adherence confirmations, follow-up nudges, exports, deletion/anonymisation.
5. Admin and hardening: platform configuration, ops dashboards, audit search, accessibility, security, performance, compliance review.

## CI/CD Pipeline

### Branch Strategy

- `main` branch: protected; no direct push.
- Feature branches off `main`; PR required for all merges.
- PR gates: `pytest` + `ruff check` + `mypy app` + `npm run test` + `npm run lint` + `npm run typecheck` must all pass.

### Pipeline Stages (GitHub Actions)

1. On PR: run full test suite + lint + type-check.
2. On merge to `main`: build Docker image → push to ECR (tagged with git SHA).
3. Staging deploy: update ECS service with new image → run smoke tests → manual approval gate.
4. Production deploy: after staging approval → update production ECS service → monitor CloudWatch alarm for 10 minutes → auto-rollback on alarm.

**Demo deploy**: `bash scripts/deploy-demo.sh` — `aws apprunner update-service` with the new ECR image tag.

## TDD and Review Gates

- Each task starts with a failing pytest, integration, contract, frontend, or E2E test.
- The failing test must be run and its failure captured before implementation.
- Implementation must make only the targeted test pass, then run the relevant suite.
- Each story checkpoint requires code review against the spec, plan, PHI/PII constraints, DPDPA, clinical safety, accessibility, and coverage.
- Completion requires backend `pytest`, `ruff check`, `ruff format --check`, type check, frontend checks, and Playwright E2E for implemented stories.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Redis (Upstash/ElastiCache) in addition to PostgreSQL | Asynchronous notifications, payment reconciliation, Zoom transcript handling, deletion jobs, and delayed nudges require retries and scheduling | PostgreSQL-only polling would increase reliability risk and operational complexity |
| React frontend in addition to Python backend | Patient intake, booking, psychiatrist notes, admin dashboards, and notification settings need rich authenticated workflows | Server-rendered templates would slow UI iteration and make complex form states harder to test |
| StoragePort abstraction (LocalStorageAdapter + S3StorageAdapter) | Demo must run without AWS credentials; production must use S3; tests must not hit real S3 | Calling boto3 directly would couple all environments to AWS and break local dev and CI |
