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

**Decision**: ECS Fargate behind Application Load Balancer, with CloudFront + AWS WAF at the edge.

**Rationale**: Fargate supports containerized FastAPI/Celery workloads without EC2 server management. ALB handles health checks and routing. CloudFront/WAF adds edge caching and request filtering.

## Database

**Decision**: Amazon RDS PostgreSQL Multi-AZ.

**Rationale**: PostgreSQL is mandated by the constitution. Multi-AZ improves availability and failover for clinical and payment workflows.

## Async Workflows

**Decision**: Celery backed by Amazon ElastiCache Redis.

**Rationale**: V1 needs delayed reminders, no-show nudges, payment reconciliation, Zoom transcript handling, export generation, and deletion/anonymisation jobs. Celery is common in Python and operationally simpler than Temporal for launch.

**Deferred alternative**: Temporal can be reconsidered if workflow replayability and long-running orchestration become more important than operational simplicity.

## File Storage

**Decision**: Amazon S3 with KMS encryption for generated prescription PDFs and export packages.

**Rationale**: S3 is durable, integrates with time-limited download links, lifecycle policies, and KMS encryption.

## Secrets and Encryption

**Decision**: AWS Secrets Manager for provider credentials and AWS KMS for encryption keys.

**Rationale**: Razorpay, Zoom, SMS, WhatsApp, database credentials, and signing keys must not live in source or plain environment files.

## Infrastructure

**Decision**: Terraform.

**Rationale**: Terraform provides explicit, reviewable AWS infrastructure and avoids manual console drift.
