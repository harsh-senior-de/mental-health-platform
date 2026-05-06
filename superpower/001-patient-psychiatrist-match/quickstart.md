# Quickstart: Patient Intake, Psychiatrist Matching & Personalized Care

## Prerequisites

- Python 3.12+
- Node.js 22 LTS for the React/Vite frontend
- Docker with Compose for local PostgreSQL and Redis
- Terraform for AWS infrastructure

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
docker compose up postgres redis
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
cd infra/terraform/environments/dev
terraform fmt -check
terraform validate
terraform plan
```

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
- AWS: local fakes for S3/Secrets where practical; integration tests use dependency-injected adapters.

Real provider credentials are required only in staging and production.
