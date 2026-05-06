# Research: Patient Intake, Psychiatrist Matching & Personalized Care

## Backend Stack

**Decision**: Python 3.12+ with FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, pytest, ruff, and mypy/pyright.

**Rationale**: The user selected Python. FastAPI gives a strong fit for typed REST APIs, OpenAPI generation, async provider boundaries, and a productive test-driven workflow. Pydantic v2 keeps request/response DTOs explicit. SQLAlchemy 2.0 and Alembic are mature choices for regulated PostgreSQL systems.

**Alternatives considered**:

- Django: strong batteries-included framework, but heavier coupling between ORM, views, and admin than desired for strict service boundaries.
- Flask: flexible, but requires more framework assembly for OpenAPI, validation, and async boundaries.

## Frontend Stack

**Decision**: React + Vite authenticated SPA.

**Rationale**: The platform is mostly authenticated workflows: intake, booking, psychiatrist records, prescriptions, admin dashboards, preferences. React/Vite supports rich forms, stateful workflows, and Playwright-driven E2E testing without requiring Next.js complexity.

## Service Shape

**Decision**: Modular monolith.

**Rationale**: 500 launch users and 5,000 scale target do not justify microservices from day one. A modular monolith keeps transactions, RBAC, audit, and PHI controls simpler while preserving clear service boundaries for future extraction.

## AWS Hosting

**Decision**: AWS App Runner for demo; ECS Fargate + ALB for production.

**Rationale**: App Runner runs the same Docker image as ECS Fargate, scales to zero when idle ($0 cost), and includes load balancing and HTTPS with no extra components. An ALB alone costs ~$20/month with zero traffic — unacceptable for a demo. When real users arrive, the promotion is a Terraform module swap; the Docker image never changes. CloudFront + WAF are added at production launch only.

**Demo cost**: ~$5–15/month active, $0 idle.
**Production cost**: ECS Fargate + ALB ~$40–80/month depending on task count and traffic.

## Database

**Decision**: Neon free tier or RDS t3.micro single-AZ for demo; RDS PostgreSQL Multi-AZ for production.

**Rationale**: PostgreSQL is mandated by the constitution. For demo, Neon provides a serverless PostgreSQL free tier (3GB storage) that accepts the same SQLAlchemy connection string as RDS — zero code changes at promotion. Alternatively, RDS t3.micro single-AZ costs ~$15/month and promotes to Multi-AZ with one Terraform variable change. Multi-AZ is the production target for clinical data availability and payment workflow failover.

**Local dev**: `postgres:16-alpine` via Docker Compose (free).

## Async Workflows

**Decision**: Celery backed by Upstash Redis (demo) or ElastiCache Redis (production).

**Rationale**: V1 needs delayed reminders, no-show nudges, payment reconciliation, Zoom transcript handling, export generation, and deletion/anonymisation jobs. Celery is common in Python and operationally simpler than Temporal for launch. Upstash Redis provides a free tier (10,000 commands/day, 256MB) that accepts the same `CELERY_BROKER_URL` as ElastiCache — zero code changes at promotion. For local dev, `redis:7-alpine` via Docker Compose is free.

**Deferred alternative**: Temporal can be reconsidered if workflow replayability and long-running orchestration become more important than operational simplicity.

## File Storage

**Decision**: `LocalStorageAdapter` for dev; Cloudflare R2 free tier for demo; S3 + KMS for production.

**Rationale**: A `StoragePort` interface with two adapters (`LocalStorageAdapter` writing to `./storage/`, `S3StorageAdapter` using boto3) allows local dev and CI to run without any cloud credentials. Cloudflare R2 is S3-compatible — the same `S3StorageAdapter` works with R2 by setting `STORAGE_S3_ENDPOINT_URL`; R2 has a free tier (10GB/month, no egress fees) making it strictly better than S3 for demo. Production uses S3 + KMS for AWS-native key management, audit trails, and VPC endpoint access. The `STORAGE_BACKEND=local|s3` env var selects the adapter; `STORAGE_S3_ENDPOINT_URL` points to R2 (demo) or AWS S3 (production).

## Secrets and Encryption

**Decision**: `.env` for local dev; SSM Parameter Store free tier for demo; Secrets Manager + KMS for production.

**Rationale**: Razorpay, Zoom, SMS, WhatsApp, database credentials, and signing keys must not live in source. SSM Parameter Store standard parameters are free (up to 10,000) and SecureString uses the AWS default KMS key at no extra charge — sufficient for demo. Secrets Manager adds automatic rotation, fine-grained IAM policies, and cross-service access needed in production. The `SETTINGS_BACKEND=env|ssm|secrets_manager` env var selects the provider; the `settings provider` service (T022–T023) abstracts this from all other code.

## Infrastructure

**Decision**: Docker Compose + App Runner CLI for demo; Terraform for production.

**Rationale**: Terraform provides explicit, reviewable AWS infrastructure and avoids manual console drift — correct for production. For demo, Terraform adds operational overhead before any users exist. Docker Compose covers local dev; App Runner deploys from a container image via CLI (`aws apprunner create-service`). Terraform is introduced in Phase 7 (production hardening) once the feature is validated on the demo stack.

## Demo-First Strategy

All infrastructure decisions share one constraint: **the application code must not know which environment it is running in**. Config is injected via environment variables at startup. The promotion path from demo to production is:

| Env var | Demo value | Production value |
|---|---|---|
| `DATABASE_URL` | Neon connection string | RDS connection string |
| `CELERY_BROKER_URL` | `rediss://...upstash.io` | `redis://...elasticache` |
| `STORAGE_BACKEND` | `local` (dev) / `s3` (demo+prod) | `s3` |
| `STORAGE_S3_ENDPOINT_URL` | (unset for dev) / `https://...r2.cloudflarestorage.com` | (unset — AWS S3) |
| `STORAGE_S3_BUCKET` | (unset for dev) / R2 bucket name | prod S3 bucket + KMS key ARN |
| `SETTINGS_BACKEND` | `env` (dev+demo) | `secrets_manager` |

No code changes. Every promotion is a configuration change and optionally a Terraform module addition.
