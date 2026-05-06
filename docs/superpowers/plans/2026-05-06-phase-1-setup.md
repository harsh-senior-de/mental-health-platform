# Phase 1 Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the project skeleton — backend directories, Python dependencies, Docker Compose, React/Vite frontend with i18n, Terraform stubs, a passing health check endpoint, and a public app shell that always shows crisis helplines.

**Architecture:** Python/FastAPI modular monolith under `apps/api/`, React/Vite TypeScript SPA under `apps/web/`, all local services via Docker Compose. No domain logic in this phase — only the skeleton required for every subsequent task to have a place to land.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, asyncpg, pytest + pytest-asyncio + httpx, ruff, mypy; React 18, TypeScript, Vite, Vitest, React Testing Library, react-i18next; Docker Compose; Terraform (stubs only).

---

## File Map

**Created this phase:**

```
apps/
├── api/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── auth/__init__.py
│   │   ├── intake/__init__.py
│   │   ├── matching/__init__.py
│   │   ├── booking/__init__.py
│   │   ├── clinical/__init__.py
│   │   ├── notifications/__init__.py
│   │   ├── admin/__init__.py
│   │   ├── data_lifecycle/__init__.py
│   │   ├── audit/__init__.py
│   │   └── shared/__init__.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── contract/
│   │   │   ├── __init__.py
│   │   │   └── test_health.py
│   │   ├── integration/__init__.py
│   │   └── unit/__init__.py
│   ├── alembic/
│   │   └── env.py          ← stub, wired in Phase 2
│   ├── alembic.ini
│   ├── Dockerfile
│   └── pyproject.toml
└── web/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── App.test.tsx
    │   └── i18n/
    │       ├── index.ts
    │       ├── en.json
    │       └── hi.json
    ├── Dockerfile.dev
    ├── index.html
    ├── tsconfig.json
    ├── vite.config.ts
    └── package.json

infra/
└── terraform/
    ├── environments/
    │   ├── staging/
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   └── prod/
    │       ├── main.tf
    │       ├── variables.tf
    │       └── outputs.tf
    └── modules/
        ├── network/main.tf
        ├── ecs/main.tf
        ├── rds/main.tf
        ├── elasticache/main.tf
        ├── s3/main.tf
        ├── kms/main.tf
        ├── secrets/main.tf
        ├── apprunner/main.tf
        ├── observability/main.tf
        ├── waf/main.tf
        └── cdn/main.tf

docker-compose.yml
.env.example
scripts/
└── demo.sh                 ← stub, wired in Phase 7
```

---

## Task 1: Backend Directory Skeleton (T001)

**Files:**
- Create: `apps/api/app/__init__.py` and all module `__init__.py` files
- Create: `apps/api/tests/` tree
- Create: `apps/api/alembic/env.py` (stub)
- Create: `apps/api/alembic.ini` (stub)

This is a structural task — no TDD required. Directories and empty `__init__.py` files are prerequisites for every subsequent import.

- [ ] **Step 1: Create backend app directories and `__init__.py` files**

```bash
mkdir -p apps/api/app/{auth,intake,matching,booking,clinical,notifications,admin,data_lifecycle,audit,shared}
mkdir -p apps/api/tests/{contract,integration,unit}
mkdir -p apps/api/alembic/versions

touch apps/api/app/__init__.py
touch apps/api/app/auth/__init__.py
touch apps/api/app/intake/__init__.py
touch apps/api/app/matching/__init__.py
touch apps/api/app/booking/__init__.py
touch apps/api/app/clinical/__init__.py
touch apps/api/app/notifications/__init__.py
touch apps/api/app/admin/__init__.py
touch apps/api/app/data_lifecycle/__init__.py
touch apps/api/app/audit/__init__.py
touch apps/api/app/shared/__init__.py

touch apps/api/tests/__init__.py
touch apps/api/tests/contract/__init__.py
touch apps/api/tests/integration/__init__.py
touch apps/api/tests/unit/__init__.py
```

- [ ] **Step 2: Create Alembic stub files**

Create `apps/api/alembic.ini`:
```ini
[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = driver://user:pass@localhost/dbname
```

Create `apps/api/alembic/env.py`:
```python
from alembic import context

config = context.config


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=None, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    pass


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

Create `apps/api/alembic/versions/.gitkeep`:
```bash
touch apps/api/alembic/versions/.gitkeep
```

- [ ] **Step 3: Verify structure**

```bash
find apps/api -type f | sort
```

Expected output includes:
```
apps/api/alembic.ini
apps/api/alembic/env.py
apps/api/alembic/versions/.gitkeep
apps/api/app/__init__.py
apps/api/app/admin/__init__.py
apps/api/app/audit/__init__.py
apps/api/app/auth/__init__.py
apps/api/app/booking/__init__.py
apps/api/app/clinical/__init__.py
apps/api/app/data_lifecycle/__init__.py
apps/api/app/intake/__init__.py
apps/api/app/matching/__init__.py
apps/api/app/notifications/__init__.py
apps/api/app/shared/__init__.py
apps/api/tests/__init__.py
apps/api/tests/contract/__init__.py
apps/api/tests/integration/__init__.py
apps/api/tests/unit/__init__.py
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/
git commit -m "feat: create backend directory skeleton with module stubs"
```

---

## Task 2: Python Dependencies (T002)

**Files:**
- Create: `apps/api/pyproject.toml`

- [ ] **Step 1: Create `apps/api/pyproject.toml`**

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "mhp-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.5.0",
    "sqlalchemy>=2.0.35",
    "alembic>=1.13.0",
    "asyncpg>=0.29.0",
    "celery[redis]>=5.4.0",
    "redis>=5.0.0",
    "boto3>=1.35.0",
    "bcrypt>=4.2.0",
    "pyotp>=2.9.0",
    "slowapi>=0.1.9",
    "cryptography>=43.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=5.0.0",
    "httpx>=0.27.0",
    "ruff>=0.7.0",
    "mypy>=1.13.0",
    "boto3-stubs[s3]>=1.35.0",
    "types-redis>=4.6.0",
    "types-bcrypt>=4.0.0",
]

[tool.hatch.build.targets.wheel]
packages = ["app"]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "S", "B", "A", "C4", "T20"]
ignore = ["S101"]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101", "S105", "S106"]

[tool.mypy]
python_version = "3.12"
strict = true
ignore_missing_imports = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
addopts = "--cov=app --cov-report=term-missing --cov-fail-under=80"
```

- [ ] **Step 2: Create virtual environment and install**

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

Expected: Installation completes without errors. Last line looks like `Successfully installed mhp-api-0.1.0 ...`

- [ ] **Step 3: Verify all tools are importable**

```bash
cd apps/api
source .venv/bin/activate
python -c "import fastapi, pydantic, sqlalchemy, alembic, celery, redis, boto3, asyncpg; print('all imports ok')"
```

Expected output: `all imports ok`

- [ ] **Step 4: Verify lint and type check run (they will pass on empty codebase)**

```bash
cd apps/api
source .venv/bin/activate
ruff check .
ruff format --check .
mypy app
```

Expected: `ruff check` and `ruff format` produce no output (no files to check yet). `mypy` reports `Success: no issues found in 10 source files` (the empty `__init__.py` files).

- [ ] **Step 5: Add `.venv` to `.gitignore`**

Append to repo root `.gitignore` (create it if absent):
```bash
cat >> .gitignore << 'EOF'

# Python virtual environments
apps/api/.venv/
apps/api/__pycache__/
apps/api/.mypy_cache/
apps/api/.ruff_cache/
apps/api/.pytest_cache/
apps/api/htmlcov/
apps/api/.coverage

# Frontend
apps/web/node_modules/
apps/web/dist/

# Storage
storage/

# Environment files
.env
EOF
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/pyproject.toml .gitignore
git commit -m "feat: add Python dependency manifest and dev tooling config"
```

---

## Task 3: Docker Compose + Dockerfiles (T003)

**Files:**
- Create: `docker-compose.yml` (repo root)
- Create: `.env.example` (repo root)
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile.dev`

- [ ] **Step 1: Create `docker-compose.yml` at repo root**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mhp_dev
      POSTGRES_USER: mhp
      POSTGRES_PASSWORD: mhp_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mhp -d mhp_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file: .env
    environment:
      DATABASE_URL: postgresql+asyncpg://mhp:mhp_dev_password@postgres:5432/mhp_dev
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api:/app
      - ./storage:/app/storage
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    env_file: .env
    environment:
      DATABASE_URL: postgresql+asyncpg://mhp:mhp_dev_password@postgres:5432/mhp_dev
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api:/app
      - ./storage:/app/storage
    command: celery -A app.worker worker --loglevel=info

  beat:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    env_file: .env
    environment:
      DATABASE_URL: postgresql+asyncpg://mhp:mhp_dev_password@postgres:5432/mhp_dev
      CELERY_BROKER_URL: redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/api:/app
    command: celery -A app.worker beat --loglevel=info

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./apps/web:/app
      - /app/node_modules
    command: npm run dev -- --host

volumes:
  postgres_data:
```

- [ ] **Step 2: Create `.env.example`**

```bash
cat > .env.example << 'EOF'
# Copy this to .env and fill in values for local development.
# Never commit .env to git.

# ── Database ──────────────────────────────────────────────
# For docker compose this is set automatically; for manual run override here.
DATABASE_URL=postgresql+asyncpg://mhp:mhp_dev_password@localhost:5432/mhp_dev

# ── Redis / Celery ────────────────────────────────────────
CELERY_BROKER_URL=redis://localhost:6379/0

# ── Storage ───────────────────────────────────────────────
# local: writes to ./storage/ (no credentials needed)
# s3: uses boto3 (set S3 vars below)
STORAGE_BACKEND=local

# Required only when STORAGE_BACKEND=s3 (Cloudflare R2 for demo, AWS S3 for production)
# STORAGE_S3_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
# STORAGE_S3_BUCKET=mhp-demo
# STORAGE_S3_ACCESS_KEY_ID=
# STORAGE_S3_SECRET_ACCESS_KEY=

# ── Secrets backend ───────────────────────────────────────
# env: reads from this file (local dev)
# ssm: AWS SSM Parameter Store (demo)
# secrets_manager: AWS Secrets Manager (production)
SETTINGS_BACKEND=env

# ── Provider credentials (fake values for local dev) ─────
RAZORPAY_KEY_ID=rzp_test_fake
RAZORPAY_KEY_SECRET=fake_secret
RAZORPAY_WEBHOOK_SECRET=fake_webhook_secret

ZOOM_CLIENT_ID=fake_zoom_client_id
ZOOM_CLIENT_SECRET=fake_zoom_client_secret
ZOOM_WEBHOOK_SECRET=fake_zoom_webhook_secret

SMS_PROVIDER_API_KEY=fake_sms_key
WHATSAPP_PROVIDER_API_KEY=fake_wa_key

# ── Crypto ────────────────────────────────────────────────
# 32-byte URL-safe base64 key: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
FIELD_ENCRYPTION_KEY=
EOF
```

- [ ] **Step 3: Copy `.env.example` to `.env` for local dev**

```bash
cp .env.example .env
# Generate a real encryption key:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Paste the output as FIELD_ENCRYPTION_KEY in .env
```

- [ ] **Step 4: Create `apps/api/Dockerfile`**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system deps for asyncpg / cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

COPY . .

EXPOSE 8000
```

- [ ] **Step 5: Verify Docker Compose config parses**

```bash
docker compose config --quiet
```

Expected: No output (valid config). If you see errors, check YAML indentation.

- [ ] **Step 6: Smoke-test backing services start**

```bash
docker compose up postgres redis -d
docker compose ps
```

Expected: Both services show `healthy` status within 30 seconds.

```bash
docker compose down
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example apps/api/Dockerfile
git commit -m "feat: add Docker Compose with postgres, redis, api, worker, beat, web services"
```

---

## Task 4: Frontend Skeleton with i18n (T004)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/i18n/index.ts`
- Create: `apps/web/src/i18n/en.json`
- Create: `apps/web/src/i18n/hi.json`
- Create: `apps/web/Dockerfile.dev`

- [ ] **Step 1: Scaffold Vite React TypeScript project**

```bash
cd apps/web
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose `y` only if the directory is empty (it should be).

- [ ] **Step 2: Install dependencies**

```bash
cd apps/web
npm install
npm install react-i18next i18next
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

- [ ] **Step 3: Update `apps/web/vite.config.ts` to add Vitest config**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 4: Create `apps/web/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Update `apps/web/package.json` scripts**

In the `"scripts"` section, ensure these keys exist (Vite scaffold adds most of them; add `test`, `typecheck`):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

- [ ] **Step 6: Create i18n setup at `apps/web/src/i18n/index.ts`**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import hi from './hi.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
```

- [ ] **Step 7: Create `apps/web/src/i18n/en.json`**

```json
{
  "crisis": {
    "heading": "Need immediate help?",
    "icare_label": "iCare (free, 24/7)",
    "icare_number": "9152987821",
    "vandrevala_label": "Vandrevala Foundation (24/7)",
    "vandrevala_number": "1860-2662-345"
  }
}
```

- [ ] **Step 8: Create `apps/web/src/i18n/hi.json`**

```json
{
  "crisis": {
    "heading": "तत्काल सहायता चाहिए?",
    "icare_label": "iCare (मुफ़्त, 24/7)",
    "icare_number": "9152987821",
    "vandrevala_label": "वंद्रेवाला फाउंडेशन (24/7)",
    "vandrevala_number": "1860-2662-345"
  }
}
```

- [ ] **Step 9: Create `apps/web/Dockerfile.dev`**

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
```

- [ ] **Step 10: Verify frontend tooling runs**

```bash
cd apps/web
npm run typecheck
```

Expected: No errors.

```bash
npm run lint
```

Expected: No errors (empty src is fine; Vite scaffold has no violations).

- [ ] **Step 11: Commit**

```bash
git add apps/web/
git commit -m "feat: scaffold React/Vite TypeScript frontend with react-i18next and Vitest"
```

---

## Task 5: Terraform Skeleton (T005)

**Files:** All under `infra/terraform/`

This phase creates empty `.tf` stubs so the directory structure exists. No real Terraform values — that is Phase 7.

- [ ] **Step 1: Create Terraform directory tree**

```bash
mkdir -p infra/terraform/environments/{staging,prod}
mkdir -p infra/terraform/modules/{network,ecs,rds,elasticache,s3,kms,secrets,apprunner,observability,waf,cdn}
```

- [ ] **Step 2: Create environment stubs**

Create `infra/terraform/environments/staging/main.tf`:
```hcl
# Staging environment — wired in Phase 7 (T097-T098)
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}
```

Create `infra/terraform/environments/staging/variables.tf`:
```hcl
variable "environment" {
  type    = string
  default = "staging"
}
```

Create `infra/terraform/environments/staging/outputs.tf`:
```hcl
# Outputs defined in Phase 7
```

Repeat the same three files for `infra/terraform/environments/prod/` (change default to `"prod"`).

- [ ] **Step 3: Create module stubs**

For each module directory, create a `main.tf` with just a comment. Run this loop:

```bash
for module in network ecs rds elasticache s3 kms secrets apprunner observability waf cdn; do
  cat > infra/terraform/modules/$module/main.tf << EOF
# Module: $module — implemented in Phase 7 (T097-T098)
EOF
done
```

- [ ] **Step 4: Verify Terraform validates on staging**

```bash
cd infra/terraform/environments/staging
terraform init -backend=false
terraform validate
```

Expected:
```
Success! The configuration is valid.
```

- [ ] **Step 5: Commit**

```bash
git add infra/
git commit -m "feat: add Terraform directory skeleton for staging and prod environments"
```

---

## Task 6: Failing Health Check Test (T008)

**Files:**
- Create: `apps/api/tests/conftest.py`
- Create: `apps/api/tests/contract/test_health.py`

Write the failing test first. `app.main` does not exist yet — the import will fail, which is the expected failure.

- [ ] **Step 1: Create `apps/api/tests/conftest.py`**

```python
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
async def client():
    from app.main import app
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
```

- [ ] **Step 2: Create `apps/api/tests/contract/test_health.py`**

```python
from httpx import AsyncClient


async def test_health_returns_200(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200


async def test_health_body_is_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Run the test and confirm it fails**

```bash
cd apps/api
source .venv/bin/activate
pytest tests/contract/test_health.py -v
```

Expected output:
```
FAILED tests/contract/test_health.py::test_health_returns_200 - ModuleNotFoundError: No module named 'app.main'
FAILED tests/contract/test_health.py::test_health_body_is_ok - ModuleNotFoundError: No module named 'app.main'
```

The failure must be a `ModuleNotFoundError` or `ImportError` for `app.main`. If you see a different error, stop and investigate.

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/
git commit -m "test: add failing contract tests for GET /api/v1/health"
```

---

## Task 7: Implement Health Check (T009)

**Files:**
- Create: `apps/api/app/main.py`

Implement the minimum code needed to make the two failing tests pass.

- [ ] **Step 1: Create `apps/api/app/main.py`**

```python
from fastapi import FastAPI

app = FastAPI(title="Mental Health Platform API", version="0.1.0")


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 2: Run the tests and confirm they pass**

```bash
cd apps/api
source .venv/bin/activate
pytest tests/contract/test_health.py -v
```

Expected:
```
PASSED tests/contract/test_health.py::test_health_returns_200
PASSED tests/contract/test_health.py::test_health_body_is_ok

2 passed in X.XXs
```

- [ ] **Step 3: Run the full verification suite**

```bash
cd apps/api
source .venv/bin/activate
pytest
ruff check .
ruff format --check .
mypy app
```

Expected:
- `pytest`: 2 passed (coverage warning if < 80% — acceptable at this skeleton stage; coverage gate applies from T026 onward)
- `ruff check`: no output
- `ruff format --check`: no output
- `mypy app`: `Success: no issues found in 11 source files`

- [ ] **Step 4: Verify the server starts**

```bash
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --reload &
sleep 2
curl -s http://localhost:8000/api/v1/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Commit**

```bash
git add app/main.py
git commit -m "feat: implement GET /api/v1/health endpoint"
```

---

## Task 8: Failing Frontend App Shell Test (T010)

**Files:**
- Create: `apps/web/src/App.test.tsx`

Write the failing test. `App.tsx` will exist from the Vite scaffold but will not yet render crisis helplines — the tests should fail.

- [ ] **Step 1: Create `apps/web/src/App.test.tsx`**

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll } from 'vitest'
import '../i18n'  // initialise i18n before rendering
import App from './App'

describe('App shell — crisis helplines', () => {
  beforeAll(() => {
    // i18n initialised via import above
  })

  it('renders the iCare helpline number', () => {
    render(<App />)
    expect(screen.getByText('9152987821')).toBeInTheDocument()
  })

  it('renders the Vandrevala Foundation helpline number', () => {
    render(<App />)
    expect(screen.getByText('1860-2662-345')).toBeInTheDocument()
  })

  it('crisis helpline section has correct aria role', () => {
    render(<App />)
    expect(
      screen.getByRole('complementary', { name: /crisis/i })
    ).toBeInTheDocument()
  })

  it('iCare number is a tel link', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: /9152987821/ })
    expect(link).toHaveAttribute('href', 'tel:9152987821')
  })

  it('Vandrevala number is a tel link', () => {
    render(<App />)
    const link = screen.getByRole('link', { name: /1860-2662-345/ })
    expect(link).toHaveAttribute('href', 'tel:18602662345')
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
cd apps/web
npm run test
```

Expected: All 5 tests fail with messages like:
```
FAIL  src/App.test.tsx
  ✗ renders the iCare helpline number
    AssertionError: expected element to be in the document
```

The Vite scaffold's `App.tsx` renders a counter and Vite logo — not crisis helplines.

- [ ] **Step 3: Commit the failing tests**

```bash
git add src/App.test.tsx
git commit -m "test: add failing frontend tests for crisis helplines in app shell"
```

---

## Task 9: Implement App Shell with Crisis Helplines (T011)

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`

Replace the Vite scaffold's default App with a minimal shell that imports i18n and always shows the crisis helplines.

- [ ] **Step 1: Update `apps/web/src/main.tsx` to import i18n before rendering**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 2: Replace `apps/web/src/App.tsx`**

```typescript
import { useTranslation } from 'react-i18next'

function CrisisHelplines() {
  const { t } = useTranslation()
  return (
    <aside aria-label="Crisis helplines">
      <h2>{t('crisis.heading')}</h2>
      <ul>
        <li>
          <span>{t('crisis.icare_label')}: </span>
          <a href={`tel:${t('crisis.icare_number')}`}>
            {t('crisis.icare_number')}
          </a>
        </li>
        <li>
          <span>{t('crisis.vandrevala_label')}: </span>
          <a href="tel:18602662345">
            {t('crisis.vandrevala_number')}
          </a>
        </li>
      </ul>
    </aside>
  )
}

export default function App() {
  return (
    <div>
      <main>
        {/* Application routes rendered here in later phases */}
      </main>
      <CrisisHelplines />
    </div>
  )
}
```

- [ ] **Step 3: Run the tests and confirm they all pass**

```bash
cd apps/web
npm run test
```

Expected:
```
✓ src/App.test.tsx (5)
  ✓ renders the iCare helpline number
  ✓ renders the Vandrevala Foundation helpline number
  ✓ crisis helpline section has correct aria role
  ✓ iCare number is a tel link
  ✓ Vandrevala number is a tel link

Test Files  1 passed (1)
Tests  5 passed (5)
```

- [ ] **Step 4: Run full frontend verification**

```bash
cd apps/web
npm run typecheck
npm run lint
npm run test
```

Expected: All three commands exit with code 0.

- [ ] **Step 5: Verify dev server renders correctly in browser**

```bash
cd apps/web
npm run dev
```

Open `http://localhost:5173` in a browser. Confirm:
- Both helpline numbers are visible on screen
- Clicking a helpline number triggers the tel: link (on mobile) or shows a tel: URL

Stop the dev server with `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: implement app shell with always-visible crisis helplines"
```

---

## Checkpoint: Phase 1 Complete

Run the full verification suite before marking this phase done:

```bash
# Backend
cd apps/api
source .venv/bin/activate
pytest
ruff check .
ruff format --check .
mypy app

# Frontend
cd ../web
npm run test
npm run lint
npm run typecheck

# Infrastructure
cd ../../infra/terraform/environments/staging
terraform validate
```

All commands must exit 0. Once they do, this phase is complete and Phase 2 (Foundation) can begin.

---

## Self-Review Against Spec

| Requirement | Covered by |
|---|---|
| T001 Backend dirs | Task 1 |
| T002 pyproject.toml with all deps | Task 2 |
| T003 Docker Compose (postgres, redis, api, worker, beat, web) | Task 3 |
| T004 React/Vite + react-i18next + i18n stubs | Task 4 |
| T005 Terraform skeleton (staging + prod + all modules) | Task 5 |
| T006 Backend verification commands (pytest, ruff, mypy) | Task 2 Step 4, Task 7 Step 3 |
| T007 Frontend verification commands (test, lint, typecheck) | Task 9 Step 4 |
| T008 Failing health check test | Task 6 |
| T009 Implement health check | Task 7 |
| T010 Failing crisis helplines test | Task 8 |
| T011 Implement app shell with crisis helplines | Task 9 |
| i18n from day one (constitution) | Task 4 (react-i18next) + Task 9 (useTranslation) |
| Crisis helplines always reachable (constitution) | Task 9 — hardwired outside main routes |
| TDD: test before implementation | Tasks 6→7 and 8→9 |
| WCAG: crisis helplines accessible | Task 9 — `<aside aria-label>`, `<a href="tel:">` |
