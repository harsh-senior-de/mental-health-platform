<!-- generated-by: gsd-doc-writer -->
# Testing

This document describes the testing strategy, requirements, and conventions for the Mental
Health Platform. The project is currently in the **specification phase** — no application
code exists yet. This document establishes the testing baseline that all implementation
work must meet from the first task onwards.

---

## Test-Driven Development Requirement

Testing on this platform is non-negotiable. The project constitution (v1.1.0) mandates
Test-Driven Development for all production code:

- Tests MUST be written and reviewed **before** implementation begins (Red → Green → Refactor).
- No feature is considered complete until its acceptance scenarios from the spec pass.
- Test coverage MUST NOT drop below **80%** on any merge to the main branch.
- Pull requests that reduce coverage below 80% are blocked from merging.

---

## Test Framework and Setup

The tech stack — including the specific test framework — will be confirmed during the
planning phase (`/speckit-plan`). The framework selection must satisfy the following
mandatory requirements derived from the spec and constitution:

- Support for **unit tests** covering all business logic and data transformation functions.
- Support for **integration tests** covering all external service boundaries (PostgreSQL,
  Razorpay, Zoom API, SMS providers, WhatsApp Business API).
- Support for **end-to-end tests** covering clinical safety paths.
- Ability to produce a **coverage report** with a configurable minimum threshold (80%).
- Compatibility with a CI pipeline that blocks merges on coverage failures.

<!-- VERIFY: test framework name and version to be confirmed in planning -->

---

## Running Tests

Test commands will be defined in `package.json` (or the equivalent for the chosen runtime)
during the planning phase. The expected script structure is:

```bash
# Run the full test suite
npm test

# Run tests in watch mode during development
npm run test:watch

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run end-to-end tests only
npm run test:e2e

# Generate a coverage report
npm run test:coverage
```

<!-- VERIFY: exact test commands to be confirmed once the tech stack is defined in planning -->

---

## Test Categories

### Unit Tests

Required for all business logic and data transformation. Each service in the planned
`src/` structure has its own unit test scope:

| Service | Key unit test areas |
|---------|-------------------|
| `auth/` | OTP generation and expiry, lockout counter logic, TOTP validation, session creation and timeout enforcement |
| `intake/` | Section progress persistence, PatientProfile construction from questionnaire responses, account status transitions |
| `matching/` | Scoring algorithm (symptom, preference, severity, rating weight), eligibility filtering, ranking and threshold labelling |
| `booking/` | Slot hold and release, idempotency key enforcement, refund rule application, reminder window selection |
| `clinical/` | List C drug block logic, care recommendation state transitions, access window enforcement, transcript-to-draft mapping |
| `notification/` | Tier classification, daily cap enforcement, preference application, same-day reschedule on preference update |
| `admin/` | PlatformConfiguration CRUD, account lifecycle actions, reconciliation flag resolution |
| `data-lifecycle/` | Two-phase deletion pipeline (PII erasure then clinical anonymisation), job type routing, SLA tracking |
| `shared/` | Correlation ID generation, structured log formatting, DTO validation |

### Integration Tests

Required for all external service boundaries. These tests use test-mode credentials
and sandbox environments — never production credentials.

| Boundary | What to test |
|----------|-------------|
| PostgreSQL | Schema migrations, encrypted column round-trips, audit log immutability, FK constraint enforcement |
| Razorpay | Payment initiation, HMAC-SHA256 signature verification, webhook payload validation, refund triggering |
| Zoom API | Meeting creation, retry behaviour on failure (up to 3 attempts), transcript webhook receipt and signature verification |
| SMS providers (primary + backup) | OTP delivery, 30-second failover to backup provider |
| WhatsApp Business API | Tier 2 and Tier 3 message dispatch, delivery status handling |

### End-to-End Tests

Required for all clinical safety paths. These tests run against a staging environment
with full external service connectivity.

**Mandatory E2E coverage** (constitution requirement — clinical safety paths):

- Crisis helpline visibility — confirm hotlines are accessible on login page, booking
  screen, and patient dashboard without authentication.
- List C drug hard block — confirm the e-prescription tool rejects all List C drugs and
  logs the blocked attempt to the audit trail.
- Prescription delivery flow — confirm the PDF is delivered in-platform and via WhatsApp
  after psychiatrist approval.
- Refund guarantee — confirm that a payment confirmed via any of the three paths (browser
  HMAC, webhook, reconciliation job) that fails to produce a booking triggers an automatic
  full refund.
- Patient data deletion — confirm Phase 1 (PII erasure) and Phase 2 (clinical anonymisation)
  complete within the 72-hour SLA, and that the resulting audit entry contains no PII.
- Psychiatrist data access scoping — confirm a psychiatrist cannot access another
  psychiatrist's patients, and that access expires after 3 months of inactivity.
- TOTP enforcement — confirm that non-patient role login cannot complete without a valid
  TOTP code.

---

## Writing New Tests

### File Naming Convention

<!-- VERIFY: exact naming convention to be confirmed once the test framework is selected in planning -->

The expected conventions based on common patterns for the planned architecture are:

| Test type | Convention | Example |
|-----------|-----------|---------|
| Unit | `*.test.ts` co-located with the source file | `src/matching/scoring.test.ts` |
| Integration | `*.integration.test.ts` in a `tests/integration/` directory | `tests/integration/razorpay.integration.test.ts` |
| End-to-end | `*.e2e.test.ts` in a `tests/e2e/` directory | `tests/e2e/drug-block.e2e.test.ts` |

### Test Helpers and Fixtures

A shared test helper layer will be established during implementation. Expected locations:

- `tests/helpers/` — shared setup utilities, mock factories, and assertion helpers
- `tests/fixtures/` — static fixture data for intake responses, psychiatrist profiles, and
  payment payloads
- `tests/setup.ts` — global test lifecycle hooks (database seeding, mock server setup)

### Privacy Rule in Tests

No real PII or PHI may appear in any test file, fixture, or seed script. All patient names,
mobile numbers, and clinical data in tests must use clearly synthetic values (e.g.,
`Test Patient`, `+91 99999 00001`). This rule applies to committed test data and generated
snapshots. See the project constitution — no PHI in any observable system.

---

## Coverage Requirements

| Coverage type | Minimum threshold |
|--------------|-------------------|
| Lines | 80% |
| Branches | 80% |
| Functions | 80% |
| Statements | 80% |

These thresholds apply to the entire codebase on every merge to `main`. They are configured
in the test framework's coverage settings and enforced by CI.

<!-- VERIFY: per-service coverage threshold configuration to be confirmed in planning — consideration for whether stricter thresholds apply to clinical-safety-critical services -->

---

## CI Integration

No CI pipeline configuration exists yet — it will be created during the planning and tasks
phases. The required CI gates for every pull request, as defined in the constitution, are:

1. **Automated test suite** — full test run with coverage check (80% minimum).
2. **Linting / formatting checks** — code style compliance.
3. **Security scan** — dependency CVE check (Dependabot or equivalent).
4. **Peer code review** — minimum one approval.
5. **Safety review** — required for any user-facing change.

A merge to `main` is blocked unless all five gates pass.

<!-- VERIFY: CI platform (GitHub Actions, GitLab CI, etc.) and workflow file paths to be confirmed in planning -->

---

## Test Environment Credentials

Test and integration tests use dedicated sandbox credentials — never production secrets.
Environment variables required for the test environment mirror those in `docs/CONFIGURATION.md`,
using test-mode equivalents:

| Variable | Test-environment value |
|----------|----------------------|
| `DATABASE_URL` | Local PostgreSQL or CI-provisioned test database |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay test-mode credentials |
| `ZOOM_*` | Zoom sandbox account credentials |
| `SMS_PROVIDER_API_KEY` | SMS provider test/sandbox API key |
| `WHATSAPP_BUSINESS_API_TOKEN` | WhatsApp test account token |

No test credential value may be committed to version control. See `docs/CONFIGURATION.md`
and the project constitution's Secrets Management rule.

---

## Related Documentation

- `docs/ARCHITECTURE.md` — service boundaries and key abstractions under test
- `docs/CONFIGURATION.md` — environment variables required for test environments
- `.specify/memory/constitution.md` — TDD mandate (Principle IV) and clinical safety
  requirements (Principle II)
- `specs/001-patient-psychiatrist-match/spec.md` — acceptance scenarios that E2E tests
  must verify
