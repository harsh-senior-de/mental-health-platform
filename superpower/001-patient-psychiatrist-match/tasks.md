# Tasks: Patient Intake, Psychiatrist Matching & Personalized Care

**Input**: [plan.md](./plan.md), [spec.md](../../specs/001-patient-psychiatrist-match/spec.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml)
**Architecture**: Python/FastAPI modular monolith, React/Vite frontend, demo on App Runner + Neon + Upstash, production on AWS ECS Fargate + RDS Multi-AZ + ElastiCache + Terraform
**Method**: Superpowers TDD workflow. For every behavior task, write the failing test first, run it, implement the minimum code, run it again, refactor, then request review at checkpoints.

## Phase 1: Setup

**Purpose**: Create the approved Python/AWS project skeleton and verification commands.

- [ ] T001 Create backend directories under `apps/api/app`: `auth`, `intake`, `matching`, `booking`, `clinical`, `notifications`, `admin`, `data_lifecycle`, `audit`, `shared`
- [ ] T002 Create backend `apps/api/pyproject.toml` with FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Celery, Redis client, boto3, pytest, ruff, and type checker config
- [ ] T003 Create `docker-compose.yml` at repo root with services: `postgres` (postgres:16-alpine), `redis` (redis:7-alpine), `api` (FastAPI + Celery worker + beat combined for demo), `web` (Vite dev server); and production Dockerfiles for separate `api`, `worker`, and `beat` containers
- [ ] T004 Create React/Vite frontend directory skeleton under `apps/web`
- [ ] T005 Create Terraform directory skeleton under `infra/terraform` for `staging` and `prod` environments and modules: `network`, `ecs`, `rds`, `elasticache`, `s3`, `kms`, `secrets`, `apprunner`, `observability`, `waf`, `cdn` — demo deploys via App Runner CLI, not Terraform
- [ ] T006 Add local verification commands for backend: `pytest`, `ruff check`, `ruff format --check`, `mypy app`
- [ ] T007 Add local verification commands for frontend and E2E placeholders
- [ ] T008 Write failing pytest for FastAPI `GET /api/v1/health`
- [ ] T009 Implement minimal FastAPI app and `GET /api/v1/health`
- [ ] T010 Write failing frontend unit test for public app shell with crisis helplines
- [ ] T011 Implement minimal React/Vite app shell with crisis helplines

**Checkpoint**: Setup passes backend tests/lint/type-check and frontend shell test. No domain logic starts before this checkpoint.

## Phase 2: Foundational Infrastructure

**Purpose**: Blocking platform primitives required before user stories.

- [ ] T012 Write failing tests for `PlatformConfiguration` default loading and DB override behavior
- [ ] T013 Implement `PlatformConfiguration` model/service for OTP expiry, lockouts, session timeout, slot hold, reminders, daily caps, access window, invoice prefix, and no-show mode
- [ ] T014 Write failing tests proving structured logger redacts configured PHI/PII fields
- [ ] T015 Implement JSON logging, redaction filters, and correlation ID middleware
- [ ] T016 Write failing tests for append-only audit log creation with hashed actor/resource identifiers
- [ ] T017 Implement audit log SQLAlchemy model, repository, and service
- [ ] T018 Write failing tests for service-layer RBAC denying lateral PHI access
- [ ] T019 Implement shared principal model and RBAC policy helpers
- [ ] T020 Write failing Alembic migration tests for core identity, configuration, and audit tables
- [ ] T021 Implement initial SQLAlchemy models and Alembic migration for `Patient`, `PatientProfile`, `StaffUser`, `Agency`, `PlatformConfiguration`, and `AuditLog`
- [ ] T022 Write failing tests for settings provider: `.env` loading (local), SSM Parameter Store (demo), and Secrets Manager (production) all returning the same typed config
- [ ] T023 Implement `SettingsProvider` with `SETTINGS_BACKEND=env|ssm|secrets_manager` env var selecting the backend at runtime
- [ ] T024 Write failing tests for `StoragePort`: local filesystem write/read/delete and signed-URL generation, and S3 upload/download/delete/presigned-URL — both via the same interface
- [ ] T025 Implement `LocalStorageAdapter` (writes to `./storage/`, generates local URLs) and `S3StorageAdapter` (boto3); `STORAGE_BACKEND=local|s3` selects at runtime; no code outside `shared/storage` imports boto3 directly
- [ ] T026 Request code review for foundation against plan, constitution, PHI/PII logging, RBAC rules, storage adapter, and settings provider

**Checkpoint**: Foundation reviewed and passing. No user-story work starts until T012–T026 pass.

## Phase 3: User Story 1 - Patient Onboarding & Intake (P1)

**Goal**: Patient can register/login with OTP, accept consent, complete and edit intake, and resume progress.
**Independent Test**: A new user completes OTP, profile setup, consent, intake, and returns to a persisted active profile without booking dependencies.

- [ ] T027 Write failing unit tests for OTP issue, invalidation of previous OTP, expiry, and lockout rules
- [ ] T028 Implement patient OTP service with primary/backup SMS provider ports and audit logging without OTP values
- [ ] T029 Write failing contract tests for `/api/v1/auth/patient/otp` and `/api/v1/auth/patient/otp/verify`
- [ ] T030 Implement patient OTP API routes and session creation
- [ ] T031 Write failing E2E test for first-registration profile setup gate
- [ ] T032 Implement patient profile setup UI and API persistence
- [ ] T033 Write failing E2E test for consent hard gate and declined-consent deletion
- [ ] T034 Implement consent screen, consent record, and decline cleanup
- [ ] T035 Write failing service tests for intake section autosave and resume position
- [ ] T036 Implement intake section persistence and progress service
- [ ] T037 Write failing E2E test for full intake completion and account status transition to `active`
- [ ] T038 Implement intake questionnaire UI, section counter, estimated time text, submit flow, and active profile creation
- [ ] T039 Write failing tests for patient intake view/edit history and psychiatrist notification dispatch
- [ ] T040 Implement intake view/edit API, edit history, and in-platform notification event
- [ ] T041 Request code review for US1, including DPDPA consent, OTP audit safety, accessibility, i18n hooks, and test coverage

**Checkpoint**: US1 works independently and its acceptance scenarios pass.

## Phase 4: User Story 2 - Matching & Appointment Booking (P1)

**Goal**: Patient with completed intake can view ranked matches, select a slot, pay, and receive a confirmed Zoom booking.
**Independent Test**: Seed eligible psychiatrists and slots, run matching, hold a slot, simulate Razorpay success, create Zoom meeting, and confirm booking.

- [ ] T042 Write failing model tests for `PsychiatristProfile`, `PsychiatristFee`, `AvailabilitySlot`, `Appointment`, `Payment`, and `ZoomMeeting`
- [ ] T043 Implement booking and psychiatrist SQLAlchemy models and Alembic migration
- [ ] T044 Write failing tests for staff account activation, password policy, TOTP setup, and lockout
- [ ] T045 Implement staff auth service and API routes
- [ ] T046 Write failing tests for AgencyAdmin-scoped psychiatrist creation and optional profile completion rules
- [ ] T047 Implement agency, psychiatrist profile, fee, and availability management APIs
- [ ] T048 Write failing tests for session type classification and urgent review eligibility
- [ ] T049 Implement session type service
- [ ] T050 Write failing unit tests for matching score inputs, eligibility filtering, rating percentile display, `closest available`, and max-five result limit
- [ ] T051 Implement matching service and `/api/v1/matches` API
- [ ] T052 Write failing integration tests for slot hold, hold expiry, duplicate submit idempotency, and concurrent availability conflict
- [ ] T053 Implement slot hold and booking checkout service
- [ ] T054 Write failing integration tests for Razorpay signed browser callback, webhook backup, and 15-minute reconciliation Celery task
- [ ] T055 Implement Razorpay provider port, payment confirmation, and reconciliation worker
- [ ] T056 Write failing integration tests for Zoom meeting creation retry and refund-on-failure behavior
- [ ] T057 Implement Zoom provider port, meeting creation, refund-on-failure, and patient/psychiatrist notifications
- [ ] T058 Write failing tests for cancellation, reschedule shortcut, refund rules, and psychiatrist deactivation cancellation
- [ ] T059 Implement cancellation, reschedule, refund, and deactivation workflows
- [ ] T060 Request code review for US2, including payment idempotency, Zoom failure handling, match explainability, RBAC, and audit logs

**Checkpoint**: US2 works independently on fake providers and preserves US1 behavior.

## Phase 5: User Story 3 - Clinical Records, Prescriptions & Care History (P2)

**Goal**: Psychiatrist can complete post-session notes, approve care recommendations, issue legal e-prescriptions, and update patient care history.
**Independent Test**: Seed a completed appointment, ingest a Zoom transcript or manual fallback, approve notes, create prescription, and verify patient care history.

- [ ] T061 Write failing model tests for `SessionTranscript`, `CareRecommendation`, `Prescription`, `PrescriptionMedication`, and `SessionFeedback`
- [ ] T062 Implement clinical SQLAlchemy models and Alembic migration
- [ ] T063 Write failing tests for Zoom transcript webhook ownership, no-transcript fallback, and raw transcript access restrictions
- [ ] T064 Implement transcript ingestion and manual recommendation fallback
- [ ] T065 Write failing tests for Form B-1 required fields, consent checkbox, identity verification checkbox, and approval gate
- [ ] T066 Implement session notes service and psychiatrist UI
- [ ] T067 Write failing tests for care history visibility across active access window and raw transcript own-session-only rule
- [ ] T068 Implement care history APIs and patient/psychiatrist views
- [ ] T069 Write failing tests for prescription mandatory fields, uppercase drug names, digital signature, PDF record stored via StoragePort, and patient download link
- [ ] T070 Implement prescription service, UI, PDF generation, and storage via `StoragePort` (local in dev, S3 in demo/prod)
- [ ] T071 Write failing tests for List C drug hard block and audit logging
- [ ] T072 Implement List C validation with no override path
- [ ] T073 Write failing tests for feedback prompt skip/submit behavior and rating visibility restrictions
- [ ] T074 Implement session feedback service and UI
- [ ] T075 Request code review for US3, including clinical safety, MHCA Form B-1, Telemedicine Guidelines, raw transcript access, and PHI logging

**Checkpoint**: US3 works independently on a seeded completed appointment and preserves US1–US2 behavior.

## Phase 6: User Story 4 - Personalized Notifications & Lifecycle (P2)

**Goal**: Care plans drive personalized WhatsApp reminders, adherence confirmations, follow-up nudges, no-show nudges, export, and deletion/anonymisation.
**Independent Test**: Seed a patient with approved recommendations and preferences, execute Celery notification jobs, update preferences, confirm adherence, and run lifecycle jobs.

- [ ] T076 Write failing model tests for `NotificationPreference`, `NotificationJob`, `AdherenceConfirmation`, and `DataLifecycleJob`
- [ ] T077 Implement notification and lifecycle SQLAlchemy models and Alembic migration
- [ ] T078 Write failing tests for Tier 1, Tier 2, and Tier 3 channel rules and daily cap enforcement
- [ ] T079 Implement notification service and WhatsApp/SMS provider ports
- [ ] T080 Write failing tests for preference updates cancelling and rescheduling pending Tier 3 Celery jobs, including same-day reminders
- [ ] T081 Implement preference update and reschedule workflow
- [ ] T082 Write failing tests for medication reminder quick-reply adherence confirmation and streak calculation
- [ ] T083 Implement adherence confirmation callback and progress dashboard data
- [ ] T084 Write failing tests for recommended follow-up date nudge suppression when future booking exists
- [ ] T085 Implement follow-up nudge workflow
- [ ] T086 Write failing tests for patient no-show two-nudge sequence and psychiatrist no-show refund modes
- [ ] T087 Implement no-show detection and nudge/refund workflows
- [ ] T088 Write failing tests for new medication initiation day-7 patient nudge and psychiatrist dashboard alert
- [ ] T089 Implement medication initiation review workflow
- [ ] T090 Write failing tests for patient data export package contents, StoragePort delivery link, and transcript/prescription exclusions
- [ ] T091 Implement asynchronous export job, encrypted S3 package via StoragePort, and time-limited delivery link
- [ ] T092 Write failing tests for on-demand deletion, abandoned account deletion, expiry purge, and two-phase anonymisation
- [ ] T093 Implement data lifecycle job service and platform admin job dashboard
- [ ] T094 Request code review for US4, including DPDPA rights, notification consent, daily caps, anonymisation, and audit safety

**Checkpoint**: US4 works independently from seeded clinical records and preserves US1–US3 behavior.

## Phase 7: Demo Deployment, Admin, Hardening & Production Release

**Purpose**: Validate on the cloud demo, complete admin surfaces, harden for production, and provision production AWS infrastructure.

### Demo Deployment

- [ ] T095 Create `apprunner.yaml` service config and `scripts/deploy-demo.sh` that builds the Docker image and creates/updates the App Runner service; document Neon and Upstash setup in quickstart.md
- [ ] T096 Deploy to App Runner + Neon + Upstash; run smoke tests against the deployed demo URL covering health, OTP flow, matching, booking, and prescription download

### Production AWS Infrastructure

- [ ] T097 Write Terraform validation tests for VPC, private subnets, ECS cluster, ALB, RDS Multi-AZ, ElastiCache, S3+KMS, Secrets Manager, CloudWatch, and WAF
- [ ] T098 Implement Terraform modules and staging environment; verify full promotion checklist end-to-end in staging

### Admin Control Surfaces

- [ ] T099 Write failing tests for PlatformAdmin configuration editing and immutable config audit entries
- [ ] T100 Implement Platform Admin configuration dashboard
- [ ] T101 Write failing tests for ops dashboards: deletion queue, payment reconciliation flags, Zoom failures, WhatsApp failures, audit search
- [ ] T102 Implement Platform Admin ops dashboards with zero clinical data exposure
- [ ] T103 Write failing tests for AgencyAdmin isolation and no clinical data access
- [ ] T104 Implement AgencyAdmin dashboard hardening

### Accessibility, Performance & Security

- [ ] T105 Run accessibility audit tests for login, intake, matching, booking, clinical notes, prescription, notifications, and admin dashboards
- [ ] T106 Fix accessibility and i18n defects found by tests
- [ ] T107 Run performance tests for matching under seeded launch-scale data
- [ ] T108 Add required indexes or query improvements behind service/repository boundaries
- [ ] T109 Run security/dependency scan and fix findings

### Release Gates

- [ ] T110 Request final code review using Superpowers plus staged reviewers: clinical safety, DPDPA, PHI/PII, accessibility/i18n, and test coverage
- [ ] T111 Run full verification: backend pytest/ruff/mypy, frontend tests/lint/typecheck, Playwright E2E, coverage ≥ 80%
- [ ] T112 Complete branch finish workflow: present merge/PR/keep/discard options after all verification passes

## Dependencies & Execution Order

- Phase 1 blocks every other phase.
- Phase 2 blocks all user stories.
- US1 and US2 are both P1; US2 depends on a completed active patient from US1 for end-to-end booking.
- US3 depends on completed appointments from US2.
- US4 depends on approved clinical records from US3.
- Phase 7 demo deployment (T095–T096) can run after US1–US2 pass; production Terraform (T097–T098) runs after US4 passes.

## Code Review Gates

- Foundation: after T026.
- US1: after T041.
- US2: after T060.
- US3: after T075.
- US4: after T094.
- Final: after T110 and before T112.

## Notes

- No production code without a failing test first.
- No route handler may access the database directly.
- No hardcoded thresholds, windows, caps, or mappings in source code.
- No PHI/PII in logs, metrics, traces, queue names, S3 object names, or audit metadata.
- Fake providers required for local and CI tests; real provider calls are demo/staging/production only.
- `StoragePort` is the only path to write or read files — no direct boto3 or filesystem calls outside `shared/storage`.
- `SettingsProvider` is the only path to read secrets — no direct SSM or Secrets Manager calls outside `shared/settings`.
