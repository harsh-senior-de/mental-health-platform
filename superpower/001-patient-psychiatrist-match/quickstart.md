# Quickstart: Patient Intake, Psychiatrist Matching & Personalized Care

## Prerequisites

- Python 3.12+
- Node.js 22 LTS for the React/Vite frontend
- Docker with Compose for local PostgreSQL and Redis
- AWS CLI (for demo deployment to App Runner)
- Terraform (for production infrastructure only — not needed for demo)

## Backend Setup

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

## Frontend Setup

```bash
cd apps/web
npm install
npm run dev
```

## Local Services

```bash
# All services (PostgreSQL + Redis + API + Celery worker/beat + Web dev server)
docker compose up

# Backing services only (if running api/web processes manually)
docker compose up postgres redis
```

Copy `.env.example` to `.env` and fill in fake provider credentials for local dev. Set:
```
STORAGE_BACKEND=local
SETTINGS_BACKEND=env
CELERY_BROKER_URL=redis://localhost:6379/0
DATABASE_URL=postgresql://mhp:mhp_dev_password@localhost:5432/mhp_dev
```

## Backend Verification

```bash
cd apps/api
pytest
ruff check .
ruff format --check .
mypy app
```

## Frontend Verification

```bash
cd apps/web
npm run test
npm run lint
npm run typecheck
```

## Infrastructure Verification

```bash
# Production Terraform (staging/prod only — not needed for demo)
cd infra/terraform/environments/staging
terraform fmt -check
terraform validate
terraform plan
```

## Cloud Demo Deployment (App Runner)

**One-time setup** — create a free Neon database and Upstash Redis instance, then set:
```
DATABASE_URL=postgresql://...neon.tech/...
CELERY_BROKER_URL=rediss://...upstash.io:6379
STORAGE_BACKEND=s3
STORAGE_S3_BUCKET=mhp-demo
SETTINGS_BACKEND=ssm
```

**Deploy**:
```bash
# Build and push image, create/update App Runner service
bash scripts/deploy-demo.sh
```

App Runner provides HTTPS automatically. No ALB, no CloudFront, no Terraform needed.

**Promote to production**: change `apprunner` → `ecs` Terraform module, point to RDS Multi-AZ and ElastiCache. Same Docker image, no code changes.

## TDD Workflow

1. Pick the next unchecked task from `tasks.md`.
2. Write the failing test first.
3. Run the smallest relevant test command and confirm the failure is for the intended behavior.
4. Implement the minimal production code.
5. Run the same test and confirm it passes.
6. Run the broader relevant suite.
7. Request code review before moving past a story checkpoint.

## Local Provider Modes

External providers use fake adapters by default:

- SMS: fake primary and backup adapters with configurable delivery acknowledgement delay.
- WhatsApp: fake template sender with quick-reply callback simulation.
- Razorpay: fake signed browser callback, webhook replay, and reconciliation fixture.
- Zoom: fake meeting creation, participant webhook, and transcript webhook.
- Storage: `LocalStorageAdapter` writes to `./storage/` — no AWS credentials needed locally.
- Secrets: `SETTINGS_BACKEND=env` reads from `.env` — no SSM or Secrets Manager needed locally.

Real provider credentials are required only in staging and production.
