# Mental Health Platform — Claude Code Runtime Guidance

## What This Project Is

A web-based mental health platform for India ("Hims & Hers Mental Health, India Edition").
Patients log in, complete a mental health intake questionnaire, get matched to a psychiatrist
from a partner agency, book Zoom video sessions via the platform, and receive personalised
long-term care — medication reminders, activity nudges, follow-up prompts — via WhatsApp.

Target market: India. Regulatory obligations: Mental Healthcare Act 2017 + DPDPA 2023.
Scale target: 500 concurrent users at launch, designed to reach 5,000 without structural rewrites.

## Development Workflow (Spec-Driven — NON-NEGOTIABLE)

Every feature follows this pipeline in order. No step may be skipped.

```
Constitution → Spec → Plan → Tasks → Implementation
```

| Command | Purpose |
|---------|---------|
| `/speckit-constitution` | Define or amend non-negotiable project principles |
| `/speckit-specify` | Write the feature specification |
| `/speckit-clarify` | Resolve ambiguities before planning |
| `/speckit-plan` | Architecture and implementation plan |
| `/speckit-tasks` | Break plan into atomic dev tasks |
| `/speckit-implement` | Implement a specific task |

**Rule**: No code is written without a corresponding spec and plan. No assumptions — if
something is unclear, run `/speckit-clarify` before proceeding.

## Key Files

| File | Purpose |
|------|---------|
| `.specify/memory/constitution.md` | Project constitution v1.1.0 — non-negotiable principles |
| `specs/001-patient-psychiatrist-match/spec.md` | Active feature spec — fully clarified, source of truth for WHAT to build |
| `specs/001-patient-psychiatrist-match/actor-flows.md` | User journeys and role-scoped flows |
| `specs/001-patient-psychiatrist-match/checklists/requirements.md` | Spec quality checklist — all items passing |
| `superpower/001-patient-psychiatrist-match/plan.md` | Implementation plan — architecture decisions and delivery strategy |
| `superpower/001-patient-psychiatrist-match/tasks.md` | **Active task list — T001–T108, pick next unchecked task here** |
| `superpower/001-patient-psychiatrist-match/data-model.md` | SQLAlchemy entity definitions and relationships |
| `superpower/001-patient-psychiatrist-match/contracts/openapi.yaml` | REST API contract skeleton |
| `superpower/001-patient-psychiatrist-match/quickstart.md` | Local dev setup and verification commands |
| `superpower/001-patient-psychiatrist-match/research.md` | Tech stack decision rationale |

## Current Status

- Constitution: v1.1.0 — ratified
- Feature spec `001-patient-psychiatrist-match`: fully clarified (25 questions across 5 sessions)
- Plan: complete — Python/FastAPI + AWS ECS Fargate + Terraform
- Tasks: T001–T108 defined, **none started — next task is T001**
- Implementation workflow: Superpowers TDD (failing test → implement → pass → review gate)

## Non-Negotiable Principles (summary — full detail in constitution.md)

1. **Privacy & Data Sovereignty**: All PHI encrypted at rest (AES-256) and in transit (TLS 1.2+).
   No PII/PHI in logs, metrics, or traces. Audit logs immutable, retained ≥7 years.
2. **Clinical Safety First**: No automated diagnosis or treatment. Crisis pathways always reachable.
   Only licensed psychiatrists make clinical decisions.
3. **Accessibility**: WCAG 2.1 AA minimum. i18n hooks in all user-visible strings from day one.
4. **Test-Driven Development**: Tests written before implementation. Coverage ≥80% on every merge.
5. **Observability**: Structured JSON logging throughout. Correlation IDs on all critical flows.
   No PHI in any observability system.

## Forbidden Practices

- Hardcoded business logic, thresholds, or mappings
- Direct database access from controllers or routers — all DB access via service layer
- Coding before spec and plan are complete and approved
- Storing sensitive data without encryption
- Logging, tracing, or emitting PHI or PII in any observability system
- Automated clinical diagnosis or treatment recommendations

## Architecture Constraints

- Backend: Python 3.12+ / FastAPI modular monolith; routers validate DTOs only, all logic in service layer
- APIs: REST, versioned `/api/v1/...`; no silent breaking changes
- ORM: SQLAlchemy 2.0 + Alembic migrations; no raw SQL in service or route files
- Async jobs: Celery + ElastiCache Redis (reminders, reconciliation, export, deletion)
- Database: RDS PostgreSQL Multi-AZ; no unstructured JSON columns without written justification
- Storage: S3 + KMS for prescription PDFs and export packages
- Infrastructure: AWS ECS Fargate + ALB + CloudFront/WAF, managed via Terraform
- No route handler may access the database directly — repositories/services only

## Tech Stack & Verification Commands

```bash
# Backend
cd apps/api
pytest                          # unit + integration tests
ruff check .                    # lint
ruff format --check .           # format check
mypy app                        # type check

# Frontend
cd apps/web
npm run test
npm run lint
npm run typecheck

# Local services
docker compose up postgres redis

# Infrastructure
cd infra/terraform/environments/dev
terraform validate && terraform plan
```

## User Roles

| Role | Auth method | Access |
|------|-------------|--------|
| Patient | OTP via SMS (every login) | Own profile, intake, bookings, care history |
| Psychiatrist | Email + password + TOTP (mandatory) | Assigned patients only |
| AgencyAdmin | Email + password + TOTP (mandatory) | Psychiatrist profiles and availability; no clinical data |
| PlatformAdmin | Email + password + TOTP (mandatory) | Ops dashboards and account actions; zero clinical data |

For full project structure, AWS topology, and delivery strategy see `superpower/001-patient-psychiatrist-match/plan.md`.
