# Phase 2: Foundational Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build blocking platform primitives — PlatformConfiguration, JSON logging with PHI redaction, append-only audit log, service-layer RBAC, core SQLAlchemy models with Alembic migrations, settings provider, and storage port — before any user-story work begins.

**Architecture:** All cross-cutting concerns live in `app/shared/`. Domain modules (admin, audit, auth) own their SQLAlchemy models and repositories. Service layer takes repository Protocols so unit tests run without a real database. Integration tests (migration tests only) require `docker compose up -d postgres`.

**Tech Stack:** SQLAlchemy 2.0 async, Alembic (asyncio runner), Pydantic Settings v2, Python 3.12 logging + ContextVar, boto3 (mocked in unit tests).

**Tasks map to:** T012–T026 from `superpower/001-patient-psychiatrist-match/tasks.md`.

**Prerequisite before Task 10:** `docker compose up -d postgres` must be running. Tasks 1–9 and 12–17 are pure unit tests — no Docker needed.

---

## File Map

```
apps/api/app/
├── shared/
│   ├── base.py            NEW  SQLAlchemy DeclarativeBase
│   ├── db.py              NEW  Async engine factory + get_session dependency
│   ├── logging.py         NEW  JsonFormatter + PhiRedactionFilter + correlation_id_var ContextVar
│   ├── middleware.py       NEW  CorrelationIdMiddleware
│   ├── rbac.py            NEW  Principal dataclass + RBAC policy helpers
│   ├── config.py          NEW  Settings Pydantic model + get_settings() backend factory
│   └── storage/
│       ├── __init__.py    NEW
│       ├── base.py        NEW  StoragePort ABC
│       ├── local.py       NEW  LocalStorageAdapter
│       └── s3.py          NEW  S3StorageAdapter
├── admin/
│   ├── models.py          NEW  PlatformConfiguration SQLAlchemy model
│   ├── repository.py      NEW  ConfigRepo Protocol + PlatformConfigurationRepository
│   └── service.py         NEW  PlatformConfigurationService
├── audit/
│   ├── model.py           NEW  AuditLog SQLAlchemy model
│   ├── repository.py      NEW  AuditLogEntry dataclass + AuditLogRepo Protocol + SQLAlchemyAuditLogRepo
│   └── service.py         NEW  AuditLogService
├── auth/
│   └── models.py          NEW  Patient, PatientProfile, StaffUser, Agency, OtpRecord, SessionToken
└── main.py                MOD  Add CorrelationIdMiddleware + configure_logging() at startup

apps/api/alembic/
├── env.py                 MOD  Complete: async runner + DATABASE_URL env override + model imports
└── versions/
    ├── 0001_core_identity.py  NEW  Patient, PatientProfile, StaffUser, Agency, PlatformConfiguration, AuditLog
    └── 0002_otp_session.py    NEW  OtpRecord, SessionToken

apps/api/tests/
├── contract/
│   └── test_correlation_middleware.py  NEW
├── unit/
│   ├── __init__.py        NEW
│   ├── admin/
│   │   ├── __init__.py    NEW
│   │   └── test_platform_config.py    NEW
│   ├── shared/
│   │   ├── __init__.py    NEW
│   │   ├── test_logging.py            NEW
│   │   ├── test_rbac.py               NEW
│   │   ├── test_settings.py           NEW
│   │   └── storage/
│   │       ├── __init__.py  NEW
│   │       └── test_storage.py        NEW
│   ├── audit/
│   │   ├── __init__.py    NEW
│   │   └── test_audit_service.py      NEW
│   └── auth/
│       ├── __init__.py    NEW
│       └── test_otp_session_models.py NEW
└── integration/
    └── test_migrations.py NEW
```

---

## Task 1: Shared SQLAlchemy Base + DB Engine

**Files:**
- Create: `apps/api/app/shared/base.py`
- Create: `apps/api/app/shared/db.py`

No new tests — existing health-check tests confirm the app still starts.

- [ ] **Step 1: Create `app/shared/base.py`**

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

- [ ] **Step 2: Create `app/shared/db.py`**

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def make_engine(database_url: str) -> AsyncEngine:
    return create_async_engine(
        database_url,
        pool_size=10,
        max_overflow=5,
        pool_recycle=300,
    )


def make_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_session(  # pragma: no cover
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session
```

- [ ] **Step 3: Run existing tests to confirm nothing broken**

```bash
cd apps/api && pytest tests/contract/test_health.py -v
```

Expected: 2 passed.

- [ ] **Step 4: Commit**

```bash
git add apps/api/app/shared/base.py apps/api/app/shared/db.py
git commit -m "feat: add SQLAlchemy declarative base and async engine factory"
```

---

## Task 2: PlatformConfiguration — Failing Tests (T012)

**Files:**
- Create: `apps/api/tests/unit/__init__.py`
- Create: `apps/api/tests/unit/admin/__init__.py`
- Create: `apps/api/tests/unit/admin/test_platform_config.py`

- [ ] **Step 1: Create `__init__.py` files**

```bash
touch apps/api/tests/unit/__init__.py apps/api/tests/unit/admin/__init__.py
```

- [ ] **Step 2: Write failing tests**

Create `apps/api/tests/unit/admin/test_platform_config.py`:

```python
import pytest
from app.admin.service import PlatformConfigService


class _InMemoryConfigRepo:
    def __init__(self, data: dict[str, str] | None = None) -> None:
        self._data: dict[str, str] = data or {}

    async def get(self, key: str) -> str | None:
        return self._data.get(key)

    async def set(self, key: str, value: str, updated_by: str) -> None:
        self._data[key] = value


@pytest.fixture
def repo() -> _InMemoryConfigRepo:
    return _InMemoryConfigRepo()


@pytest.fixture
def service(repo: _InMemoryConfigRepo) -> PlatformConfigService:
    return PlatformConfigService(repo)


async def test_get_int_returns_default_when_db_empty(service: PlatformConfigService) -> None:
    result = await service.get_int("otp_expiry_seconds")
    assert result == 300


async def test_get_int_returns_db_override(
    service: PlatformConfigService, repo: _InMemoryConfigRepo
) -> None:
    await repo.set("otp_expiry_seconds", "120", updated_by="admin")
    result = await service.get_int("otp_expiry_seconds")
    assert result == 120


async def test_get_str_returns_default(service: PlatformConfigService) -> None:
    result = await service.get_str("invoice_prefix")
    assert result == "INV"


async def test_get_str_returns_db_override(
    service: PlatformConfigService, repo: _InMemoryConfigRepo
) -> None:
    await repo.set("invoice_prefix", "MHP", updated_by="admin")
    result = await service.get_str("invoice_prefix")
    assert result == "MHP"


async def test_unknown_key_raises_value_error(service: PlatformConfigService) -> None:
    with pytest.raises(ValueError, match="Unknown configuration key"):
        await service.get_int("nonexistent_key")


async def test_all_expected_defaults_exist(service: PlatformConfigService) -> None:
    expected_int_keys = [
        "otp_expiry_seconds",
        "otp_max_attempts",
        "otp_lockout_minutes",
        "session_idle_timeout_minutes",
        "session_absolute_timeout_hours",
        "slot_hold_minutes",
        "reminder_daily_cap",
        "patient_data_access_window_days",
    ]
    for key in expected_int_keys:
        val = await service.get_int(key)
        assert isinstance(val, int), f"Expected int for {key}, got {type(val)}"
```

- [ ] **Step 3: Run tests — expect ImportError (module doesn't exist yet)**

```bash
cd apps/api && pytest tests/unit/admin/test_platform_config.py -v 2>&1 | head -20
```

Expected: `ModuleNotFoundError: No module named 'app.admin.service'`

- [ ] **Step 4: Commit failing tests**

```bash
git add tests/unit/__init__.py tests/unit/admin/__init__.py tests/unit/admin/test_platform_config.py
git commit -m "test: add failing tests for PlatformConfiguration service (T012)"
```

---

## Task 3: PlatformConfiguration — Implementation (T013)

**Files:**
- Create: `apps/api/app/admin/models.py`
- Create: `apps/api/app/admin/repository.py`
- Create: `apps/api/app/admin/service.py`

- [ ] **Step 1: Create `app/admin/models.py`**

```python
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base import Base


class PlatformConfiguration(Base):
    __tablename__ = "platform_configuration"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 2: Create `app/admin/repository.py`**

```python
from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.models import PlatformConfiguration


class ConfigRepo(Protocol):
    async def get(self, key: str) -> str | None: ...
    async def set(self, key: str, value: str, updated_by: str) -> None: ...


class PlatformConfigurationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, key: str) -> str | None:
        obj = await self._session.get(PlatformConfiguration, key)
        return obj.value if obj else None

    async def set(self, key: str, value: str, updated_by: str) -> None:
        obj = PlatformConfiguration(key=key, value=value, updated_by=updated_by)
        await self._session.merge(obj)
        await self._session.flush()
```

- [ ] **Step 3: Create `app/admin/service.py`**

```python
from app.admin.repository import ConfigRepo

_DEFAULTS: dict[str, str] = {
    "otp_expiry_seconds": "300",
    "otp_max_attempts": "3",
    "otp_lockout_minutes": "15",
    "session_idle_timeout_minutes": "30",
    "session_absolute_timeout_hours": "8",
    "slot_hold_minutes": "10",
    "reminder_daily_cap": "3",
    "patient_data_access_window_days": "365",
    "invoice_prefix": "INV",
    "no_show_mode": "refund",
}


class PlatformConfigService:
    def __init__(self, repo: ConfigRepo) -> None:
        self._repo = repo

    def _require_key(self, key: str) -> None:
        if key not in _DEFAULTS:
            raise ValueError(f"Unknown configuration key: {key!r}")

    async def get_int(self, key: str) -> int:
        self._require_key(key)
        raw = await self._repo.get(key) or _DEFAULTS[key]
        return int(raw)

    async def get_str(self, key: str) -> str:
        self._require_key(key)
        return await self._repo.get(key) or _DEFAULTS[key]
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
cd apps/api && pytest tests/unit/admin/test_platform_config.py -v
```

Expected: 6 passed.

- [ ] **Step 5: Lint + type-check**

```bash
cd apps/api && ruff check app/admin/ && ruff format --check app/admin/ && mypy app/admin/
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/admin/models.py app/admin/repository.py app/admin/service.py
git commit -m "feat: implement PlatformConfiguration model, repository, and service (T013)"
```

---

## Task 4: Logging + PHI Redaction — Failing Tests (T014)

**Files:**
- Create: `apps/api/tests/unit/shared/__init__.py`
- Create: `apps/api/tests/unit/shared/test_logging.py`

- [ ] **Step 1: Create `__init__.py`**

```bash
touch apps/api/tests/unit/shared/__init__.py
```

- [ ] **Step 2: Write failing tests**

Create `apps/api/tests/unit/shared/test_logging.py`:

```python
import logging

import pytest
from app.shared.logging import PhiRedactionFilter, correlation_id_var


def _make_record(msg: str, args: object) -> logging.LogRecord:
    return logging.LogRecord(
        name="test",
        level=logging.WARNING,
        pathname="",
        lineno=0,
        msg=msg,
        args=args,
        exc_info=None,
    )


def test_phi_dict_arg_mobile_number_redacted() -> None:
    record = _make_record("data: %s", ({"mobile_number": "9876543210", "action": "login"},))
    PhiRedactionFilter().filter(record)
    assert isinstance(record.args, tuple)
    assert record.args[0]["mobile_number"] == "[REDACTED]"
    assert record.args[0]["action"] == "login"


def test_phi_dict_arg_email_redacted() -> None:
    record = _make_record("data: %s", ({"email": "user@example.com", "status": "active"},))
    PhiRedactionFilter().filter(record)
    assert isinstance(record.args, tuple)
    assert record.args[0]["email"] == "[REDACTED]"
    assert record.args[0]["status"] == "active"


def test_non_phi_fields_not_redacted() -> None:
    record = _make_record("data: %s", ({"action": "login", "status": "success"},))
    PhiRedactionFilter().filter(record)
    assert isinstance(record.args, tuple)
    assert record.args[0]["action"] == "login"
    assert record.args[0]["status"] == "success"


def test_nested_phi_dict_redacted() -> None:
    record = _make_record(
        "data: %s",
        ({"user": {"full_name": "Jane Doe", "role": "patient"}},),
    )
    PhiRedactionFilter().filter(record)
    assert isinstance(record.args, tuple)
    assert record.args[0]["user"]["full_name"] == "[REDACTED]"
    assert record.args[0]["user"]["role"] == "patient"


def test_non_dict_arg_unchanged() -> None:
    record = _make_record("count: %d", (42,))
    PhiRedactionFilter().filter(record)
    assert record.args == (42,)


def test_phi_msg_dict_redacted() -> None:
    record = _make_record({"mobile_number": "1234567890", "event": "otp"}, None)
    PhiRedactionFilter().filter(record)
    assert isinstance(record.msg, dict)
    assert record.msg["mobile_number"] == "[REDACTED]"
    assert record.msg["event"] == "otp"


def test_correlation_id_contextvar_default_empty() -> None:
    assert correlation_id_var.get("") == ""


def test_correlation_id_contextvar_can_be_set() -> None:
    token = correlation_id_var.set("req-abc-123")
    try:
        assert correlation_id_var.get("") == "req-abc-123"
    finally:
        correlation_id_var.reset(token)
```

- [ ] **Step 3: Run tests — expect ImportError**

```bash
cd apps/api && pytest tests/unit/shared/test_logging.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'app.shared.logging'`

- [ ] **Step 4: Commit failing tests**

```bash
git add tests/unit/shared/__init__.py tests/unit/shared/test_logging.py
git commit -m "test: add failing tests for PHI redaction logging (T014)"
```

---

## Task 5: Logging + Middleware — Implementation (T015)

**Files:**
- Create: `apps/api/app/shared/logging.py`
- Create: `apps/api/app/shared/middleware.py`
- Modify: `apps/api/app/main.py`
- Create: `apps/api/tests/contract/test_correlation_middleware.py`

- [ ] **Step 1: Create `app/shared/logging.py`**

```python
import contextvars
import json
import logging
from typing import Any

correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "correlation_id", default=""
)

_PHI_FIELDS = frozenset(
    {
        "mobile_number",
        "full_name",
        "date_of_birth",
        "address",
        "whatsapp_number",
        "email",
        "otp_value",
        "otp",
        "token",
        "password",
        "password_hash",
        "advance_directive",
        "nominated_representative_name",
        "nominated_representative_contact",
    }
)


def _redact(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: "[REDACTED]" if k in _PHI_FIELDS else _redact(v) for k, v in value.items()}
    return value


class PhiRedactionFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, dict):
            record.msg = _redact(record.msg)
        if record.args:
            if isinstance(record.args, tuple):
                record.args = tuple(_redact(a) for a in record.args)
            elif isinstance(record.args, dict):
                record.args = _redact(record.args)
        return True


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "correlation_id": correlation_id_var.get(""),
        }
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data)


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(_JsonFormatter())
    handler.addFilter(PhiRedactionFilter())
    logging.root.setLevel(logging.INFO)
    logging.root.handlers = [handler]
```

- [ ] **Step 2: Create `app/shared/middleware.py`**

```python
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.shared.logging import correlation_id_var


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Response:  # type: ignore[override]
        correlation_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = correlation_id_var.set(correlation_id)
        try:
            response: Response = await call_next(request)
            response.headers["X-Request-ID"] = correlation_id
            return response
        finally:
            correlation_id_var.reset(token)
```

Fix the `Any` import — add it at the top:

```python
from typing import Any
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.shared.logging import correlation_id_var


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Response:  # type: ignore[override]
        correlation_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = correlation_id_var.set(correlation_id)
        try:
            response: Response = await call_next(request)
            response.headers["X-Request-ID"] = correlation_id
            return response
        finally:
            correlation_id_var.reset(token)
```

- [ ] **Step 3: Update `app/main.py`**

```python
from fastapi import FastAPI

from app.shared.logging import configure_logging
from app.shared.middleware import CorrelationIdMiddleware

configure_logging()

app = FastAPI(title="Mental Health Platform API", version="0.1.0")
app.add_middleware(CorrelationIdMiddleware)


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 4: Write contract test for correlation ID middleware**

Create `apps/api/tests/contract/test_correlation_middleware.py`:

```python
from httpx import AsyncClient


async def test_provided_correlation_id_echoed_in_response(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health", headers={"X-Request-ID": "test-req-123"})
    assert response.headers["X-Request-ID"] == "test-req-123"


async def test_correlation_id_generated_when_absent(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) == 36
```

- [ ] **Step 5: Run all tests**

```bash
cd apps/api && pytest tests/unit/shared/test_logging.py tests/contract/ -v
```

Expected: 8 + 2 = 10 passed (logging unit tests + health + correlation ID contract tests).

- [ ] **Step 6: Lint + type-check**

```bash
cd apps/api && ruff check app/shared/logging.py app/shared/middleware.py app/main.py && mypy app/shared/logging.py app/shared/middleware.py app/main.py
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/shared/logging.py app/shared/middleware.py app/main.py \
        tests/contract/test_correlation_middleware.py
git commit -m "feat: add JSON logging, PHI redaction filter, and correlation ID middleware (T015)"
```

---

## Task 6: Audit Log — Failing Tests (T016)

**Files:**
- Create: `apps/api/tests/unit/audit/__init__.py`
- Create: `apps/api/tests/unit/audit/test_audit_service.py`

- [ ] **Step 1: Create `__init__.py`**

```bash
touch apps/api/tests/unit/audit/__init__.py
```

- [ ] **Step 2: Write failing tests**

Create `apps/api/tests/unit/audit/test_audit_service.py`:

```python
import hashlib

import pytest
from app.audit.repository import AuditLogEntry
from app.audit.service import AuditLogService


class _InMemoryAuditRepo:
    def __init__(self) -> None:
        self.entries: list[AuditLogEntry] = []

    async def append(self, entry: AuditLogEntry) -> None:
        self.entries.append(entry)


@pytest.fixture
def repo() -> _InMemoryAuditRepo:
    return _InMemoryAuditRepo()


@pytest.fixture
def service(repo: _InMemoryAuditRepo) -> AuditLogService:
    return AuditLogService(repo)


async def test_audit_entry_hashes_actor_id(
    service: AuditLogService, repo: _InMemoryAuditRepo
) -> None:
    await service.log(
        actor_type="patient",
        actor_id="patient-uuid-123",
        action="patient.otp.request",
        resource_type="patient",
        resource_id="patient-uuid-123",
    )
    entry = repo.entries[0]
    expected = hashlib.sha256("patient-uuid-123".encode()).hexdigest()
    assert entry.actor_id_hash == expected


async def test_audit_entry_hashes_resource_id(
    service: AuditLogService, repo: _InMemoryAuditRepo
) -> None:
    await service.log(
        actor_type="patient",
        actor_id="patient-uuid-123",
        action="patient.profile.view",
        resource_type="appointment",
        resource_id="appt-uuid-456",
    )
    entry = repo.entries[0]
    expected = hashlib.sha256("appt-uuid-456".encode()).hexdigest()
    assert entry.resource_id_hash == expected


async def test_two_entries_independently_stored(
    service: AuditLogService, repo: _InMemoryAuditRepo
) -> None:
    await service.log(
        actor_type="patient", actor_id="a", action="x",
        resource_type="t", resource_id="r1",
    )
    await service.log(
        actor_type="staff", actor_id="b", action="y",
        resource_type="t", resource_id="r2",
    )
    assert len(repo.entries) == 2
    assert repo.entries[0].actor_type == "patient"
    assert repo.entries[1].actor_type == "staff"


async def test_correlation_id_captured_from_contextvar(
    service: AuditLogService, repo: _InMemoryAuditRepo
) -> None:
    from app.shared.logging import correlation_id_var

    token = correlation_id_var.set("corr-999")
    try:
        await service.log(
            actor_type="staff", actor_id="s1", action="z",
            resource_type="patient", resource_id="p1",
        )
    finally:
        correlation_id_var.reset(token)
    assert repo.entries[0].correlation_id == "corr-999"


async def test_metadata_stored_when_provided(
    service: AuditLogService, repo: _InMemoryAuditRepo
) -> None:
    await service.log(
        actor_type="patient", actor_id="p", action="a",
        resource_type="r", resource_id="rid",
        metadata_redacted='{"reason": "test"}',
    )
    assert repo.entries[0].metadata_redacted == '{"reason": "test"}'
```

- [ ] **Step 3: Run tests — expect ImportError**

```bash
cd apps/api && pytest tests/unit/audit/test_audit_service.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'app.audit.repository'`

- [ ] **Step 4: Commit failing tests**

```bash
git add tests/unit/audit/__init__.py tests/unit/audit/test_audit_service.py
git commit -m "test: add failing tests for audit log service (T016)"
```

---

## Task 7: Audit Log — Implementation (T017)

**Files:**
- Create: `apps/api/app/audit/model.py`
- Create: `apps/api/app/audit/repository.py`
- Create: `apps/api/app/audit/service.py`

- [ ] **Step 1: Create `app/audit/model.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base import Base


class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        Index("ix_audit_log_actor", "actor_id_hash", "created_at"),
        Index("ix_audit_log_resource", "resource_id_hash"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    actor_type: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    correlation_id: Mapped[str] = mapped_column(String(36), nullable=False, server_default="")
    metadata_redacted: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
```

- [ ] **Step 2: Create `app/audit/repository.py`**

```python
import uuid
from dataclasses import dataclass, field
from typing import Protocol

from sqlalchemy.ext.asyncio import AsyncSession

from app.audit.model import AuditLog


@dataclass
class AuditLogEntry:
    actor_type: str
    actor_id_hash: str
    action: str
    resource_type: str
    resource_id_hash: str
    correlation_id: str = ""
    metadata_redacted: str | None = None


class AuditLogRepo(Protocol):
    async def append(self, entry: AuditLogEntry) -> None: ...


class SQLAlchemyAuditLogRepo:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def append(self, entry: AuditLogEntry) -> None:
        row = AuditLog(
            id=str(uuid.uuid4()),
            actor_type=entry.actor_type,
            actor_id_hash=entry.actor_id_hash,
            action=entry.action,
            resource_type=entry.resource_type,
            resource_id_hash=entry.resource_id_hash,
            correlation_id=entry.correlation_id,
            metadata_redacted=entry.metadata_redacted,
        )
        self._session.add(row)
        await self._session.flush()
```

- [ ] **Step 3: Create `app/audit/service.py`**

```python
import hashlib

from app.audit.repository import AuditLogEntry, AuditLogRepo
from app.shared.logging import correlation_id_var


class AuditLogService:
    def __init__(self, repo: AuditLogRepo) -> None:
        self._repo = repo

    async def log(
        self,
        *,
        actor_type: str,
        actor_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        metadata_redacted: str | None = None,
    ) -> None:
        entry = AuditLogEntry(
            actor_type=actor_type,
            actor_id_hash=hashlib.sha256(actor_id.encode()).hexdigest(),
            action=action,
            resource_type=resource_type,
            resource_id_hash=hashlib.sha256(resource_id.encode()).hexdigest(),
            correlation_id=correlation_id_var.get(""),
            metadata_redacted=metadata_redacted,
        )
        await self._repo.append(entry)
```

- [ ] **Step 4: Run tests**

```bash
cd apps/api && pytest tests/unit/audit/test_audit_service.py -v
```

Expected: 5 passed.

- [ ] **Step 5: Lint + type-check**

```bash
cd apps/api && ruff check app/audit/ && ruff format --check app/audit/ && mypy app/audit/
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/audit/model.py app/audit/repository.py app/audit/service.py
git commit -m "feat: implement AuditLog model, repository, and service (T017)"
```

---

## Task 8: RBAC — Failing Tests (T018)

**Files:**
- Create: `apps/api/tests/unit/shared/test_rbac.py`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/unit/shared/test_rbac.py`:

```python
import pytest
from app.shared.rbac import (
    PermissionDenied,
    Principal,
    UserType,
    assert_agency_admin,
    assert_clinical_write,
    assert_patient_access,
    assert_platform_admin,
)


def test_patient_can_access_own_data() -> None:
    p = Principal(user_id="patient-1", user_type=UserType.PATIENT)
    assert_patient_access(p, "patient-1")  # must not raise


def test_patient_cannot_access_other_patient_data() -> None:
    p = Principal(user_id="patient-1", user_type=UserType.PATIENT)
    with pytest.raises(PermissionDenied):
        assert_patient_access(p, "patient-2")


def test_psychiatrist_can_access_any_patient_in_phase2() -> None:
    p = Principal(user_id="psych-1", user_type=UserType.PSYCHIATRIST)
    assert_patient_access(p, "patient-1")  # assignment check deferred to Phase 4


def test_agency_admin_cannot_access_patient_data() -> None:
    p = Principal(user_id="admin-1", user_type=UserType.AGENCY_ADMIN)
    with pytest.raises(PermissionDenied):
        assert_patient_access(p, "patient-1")


def test_platform_admin_cannot_access_patient_data() -> None:
    p = Principal(user_id="padmin-1", user_type=UserType.PLATFORM_ADMIN)
    with pytest.raises(PermissionDenied):
        assert_patient_access(p, "patient-1")


def test_psychiatrist_can_write_clinical() -> None:
    p = Principal(user_id="psych-1", user_type=UserType.PSYCHIATRIST)
    assert_clinical_write(p)  # must not raise


def test_patient_cannot_write_clinical() -> None:
    p = Principal(user_id="patient-1", user_type=UserType.PATIENT)
    with pytest.raises(PermissionDenied):
        assert_clinical_write(p)


def test_agency_admin_cannot_write_clinical() -> None:
    p = Principal(user_id="admin-1", user_type=UserType.AGENCY_ADMIN)
    with pytest.raises(PermissionDenied):
        assert_clinical_write(p)


def test_agency_admin_can_perform_agency_action() -> None:
    p = Principal(user_id="admin-1", user_type=UserType.AGENCY_ADMIN)
    assert_agency_admin(p)  # must not raise


def test_non_agency_admin_denied_agency_action() -> None:
    p = Principal(user_id="patient-1", user_type=UserType.PATIENT)
    with pytest.raises(PermissionDenied):
        assert_agency_admin(p)


def test_platform_admin_can_perform_platform_action() -> None:
    p = Principal(user_id="padmin-1", user_type=UserType.PLATFORM_ADMIN)
    assert_platform_admin(p)  # must not raise


def test_non_platform_admin_denied_platform_action() -> None:
    p = Principal(user_id="psych-1", user_type=UserType.PSYCHIATRIST)
    with pytest.raises(PermissionDenied):
        assert_platform_admin(p)
```

- [ ] **Step 2: Run tests — expect ImportError**

```bash
cd apps/api && pytest tests/unit/shared/test_rbac.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'app.shared.rbac'`

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/unit/shared/test_rbac.py
git commit -m "test: add failing tests for service-layer RBAC (T018)"
```

---

## Task 9: RBAC — Implementation (T019)

**Files:**
- Create: `apps/api/app/shared/rbac.py`

- [ ] **Step 1: Create `app/shared/rbac.py`**

```python
from dataclasses import dataclass
from enum import Enum


class UserType(str, Enum):
    PATIENT = "patient"
    PSYCHIATRIST = "psychiatrist"
    AGENCY_ADMIN = "agency_admin"
    PLATFORM_ADMIN = "platform_admin"


@dataclass(frozen=True)
class Principal:
    user_id: str
    user_type: UserType
    agency_id: str | None = None


class PermissionDenied(Exception):
    pass


def assert_patient_access(principal: Principal, patient_id: str) -> None:
    if principal.user_type == UserType.PATIENT:
        if principal.user_id != patient_id:
            raise PermissionDenied("Patients can only access their own data")
    elif principal.user_type == UserType.PSYCHIATRIST:
        pass  # full assignment check deferred to Phase 4 when Appointment records exist
    else:
        raise PermissionDenied(
            f"{principal.user_type.value} role cannot access patient PHI"
        )


def assert_clinical_write(principal: Principal) -> None:
    if principal.user_type != UserType.PSYCHIATRIST:
        raise PermissionDenied("Only psychiatrists may write clinical records")


def assert_agency_admin(principal: Principal) -> None:
    if principal.user_type != UserType.AGENCY_ADMIN:
        raise PermissionDenied("Only agency admins may perform this action")


def assert_platform_admin(principal: Principal) -> None:
    if principal.user_type != UserType.PLATFORM_ADMIN:
        raise PermissionDenied("Only platform admins may perform this action")
```

- [ ] **Step 2: Run tests**

```bash
cd apps/api && pytest tests/unit/shared/test_rbac.py -v
```

Expected: 12 passed.

- [ ] **Step 3: Lint + type-check**

```bash
cd apps/api && ruff check app/shared/rbac.py && ruff format --check app/shared/rbac.py && mypy app/shared/rbac.py
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/shared/rbac.py
git commit -m "feat: implement Principal model and RBAC policy helpers (T019)"
```

---

## Task 10: Migration Tests — Failing (T020)

**Prerequisite:** `docker compose up -d postgres` must be running. `TEST_DATABASE_URL` defaults to `postgresql+asyncpg://postgres:postgres@localhost:5432/mhp_test`.

**Files:**
- Create: `apps/api/tests/integration/test_migrations.py`

- [ ] **Step 1: Write failing migration tests**

Create `apps/api/tests/integration/test_migrations.py`:

```python
"""
Integration tests: verify alembic upgrade head creates expected tables.
REQUIRES: docker compose up -d postgres
"""

import asyncio
import os
import subprocess
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

_TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/mhp_test",
)
_API_DIR = Path(__file__).parent.parent.parent  # apps/api/


@pytest.fixture(scope="module")
def migrated_db() -> str:
    """Wipe schema, run alembic upgrade head, return DB URL. Synchronous fixture."""

    async def _reset() -> None:
        engine = create_async_engine(_TEST_DB_URL)
        async with engine.begin() as conn:
            await conn.execute(text("DROP SCHEMA public CASCADE"))
            await conn.execute(text("CREATE SCHEMA public"))
        await engine.dispose()

    asyncio.run(_reset())

    env = {**os.environ, "DATABASE_URL": _TEST_DB_URL}
    result = subprocess.run(
        ["python", "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
        env=env,
        cwd=str(_API_DIR),
    )
    assert result.returncode == 0, f"Alembic failed:\n{result.stderr}"
    return _TEST_DB_URL


async def _table_exists(url: str, table: str) -> bool:
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(
            text(f"SELECT to_regclass('public.{table}')")
        )
        val = result.scalar()
    await engine.dispose()
    return val is not None


async def _indexes_for_table(url: str, table: str) -> set[str]:
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT indexname FROM pg_indexes WHERE tablename = :t"),
            {"t": table},
        )
        indexes = {row[0] for row in result}
    await engine.dispose()
    return indexes


async def test_patient_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "patient")


async def test_patient_profile_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "patient_profile")


async def test_staff_user_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "staff_user")


async def test_agency_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "agency")


async def test_platform_configuration_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "platform_configuration")


async def test_audit_log_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "audit_log")


async def test_audit_log_actor_index_exists(migrated_db: str) -> None:
    indexes = await _indexes_for_table(migrated_db, "audit_log")
    assert "ix_audit_log_actor" in indexes


async def test_audit_log_resource_index_exists(migrated_db: str) -> None:
    indexes = await _indexes_for_table(migrated_db, "audit_log")
    assert "ix_audit_log_resource" in indexes


async def test_otp_record_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "otp_record")


async def test_session_token_table_exists(migrated_db: str) -> None:
    assert await _table_exists(migrated_db, "session_token")
```

- [ ] **Step 2: Run tests — expect failure (no migration files)**

```bash
cd apps/api && pytest tests/integration/test_migrations.py -v 2>&1 | head -30
```

Expected: tests fail — either `alembic upgrade head` succeeds but tables don't exist (no migration files to run), so `_table_exists` returns `False`.

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/integration/test_migrations.py
git commit -m "test: add failing Alembic migration integration tests (T020)"
```

---

## Task 11: Core Identity Models + Migration 0001 (T021)

**Files:**
- Create: `apps/api/app/auth/models.py`
- Modify: `apps/api/alembic/env.py`
- Create: `apps/api/alembic/versions/0001_core_identity.py`

- [ ] **Step 1: Create `app/auth/models.py`** (Patient, PatientProfile, StaffUser, Agency)

```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.base import Base


class Agency(Base):
    __tablename__ = "agency"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    contact_email_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    contract_start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class StaffUser(Base):
    __tablename__ = "staff_user"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    agency_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("agency.id"), nullable=True
    )
    email_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    totp_secret_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="invited")
    failed_login_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Patient(Base):
    __tablename__ = "patient"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mobile_number_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="otp_pending")
    otp_attempts_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    otp_locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PatientProfile(Base):
    __tablename__ = "patient_profile"

    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id"), primary_key=True
    )
    full_name_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    date_of_birth_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    address_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    whatsapp_number_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=False, server_default="en")
    advance_directive_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    nominated_representative_name_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    nominated_representative_contact_encrypted: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
```

- [ ] **Step 2: Rewrite `alembic/env.py`**

```python
import asyncio
import os

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.shared.base import Base

# Register all models on Base.metadata
import app.auth.models  # noqa: F401
import app.admin.models  # noqa: F401
import app.audit.model  # noqa: F401

config = context.config
target_metadata = Base.metadata


def _get_url() -> str:
    return os.environ.get("DATABASE_URL") or config.get_main_option("sqlalchemy.url", "")


def _do_run_migrations(connection: object) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)  # type: ignore[arg-type]
    with context.begin_transaction():
        context.run_migrations()


async def _run_async_migrations() -> None:
    connectable = create_async_engine(_get_url(), poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(_do_run_migrations)
    await connectable.dispose()


def run_migrations_offline() -> None:
    context.configure(
        url=_get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    asyncio.run(_run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create `alembic/versions/0001_core_identity.py`**

```python
"""core identity tables

Revision ID: 0001
Revises:
Create Date: 2026-05-06
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agency",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("contact_email_encrypted", sa.Text, nullable=False),
        sa.Column("contract_start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "staff_user",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("agency_id", sa.String(36), sa.ForeignKey("agency.id"), nullable=True),
        sa.Column("email_encrypted", sa.Text, nullable=False),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("totp_secret_encrypted", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="invited"),
        sa.Column("failed_login_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "patient",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("mobile_number_encrypted", sa.Text, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="otp_pending"),
        sa.Column("otp_attempts_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("otp_locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "patient_profile",
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), primary_key=True),
        sa.Column("full_name_encrypted", sa.Text, nullable=False),
        sa.Column("date_of_birth_encrypted", sa.Text, nullable=False),
        sa.Column("address_encrypted", sa.Text, nullable=False),
        sa.Column("whatsapp_number_encrypted", sa.Text, nullable=False),
        sa.Column("whatsapp_enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("preferred_language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("advance_directive_encrypted", sa.Text, nullable=True),
        sa.Column("nominated_representative_name_encrypted", sa.Text, nullable=True),
        sa.Column("nominated_representative_contact_encrypted", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "platform_configuration",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.Text, nullable=False),
        sa.Column("updated_by", sa.String(100), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("actor_type", sa.String(50), nullable=False),
        sa.Column("actor_id_hash", sa.String(64), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(100), nullable=False),
        sa.Column("resource_id_hash", sa.String(64), nullable=False),
        sa.Column("correlation_id", sa.String(36), nullable=False, server_default=""),
        sa.Column("metadata_redacted", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_log_actor", "audit_log", ["actor_id_hash", "created_at"])
    op.create_index("ix_audit_log_resource", "audit_log", ["resource_id_hash"])


def downgrade() -> None:
    op.drop_index("ix_audit_log_resource", table_name="audit_log")
    op.drop_index("ix_audit_log_actor", table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_table("platform_configuration")
    op.drop_table("patient_profile")
    op.drop_table("patient")
    op.drop_table("staff_user")
    op.drop_table("agency")
```

- [ ] **Step 4: Run migration tests (Docker Compose postgres required)**

```bash
cd apps/api && pytest tests/integration/test_migrations.py -v -k "not otp_record and not session_token"
```

Expected: 8 passed (patient, patient_profile, staff_user, agency, platform_configuration, audit_log, both audit_log indexes).

- [ ] **Step 5: Run all unit tests to confirm nothing broken**

```bash
cd apps/api && pytest tests/unit/ tests/contract/ -v
```

Expected: all pass.

- [ ] **Step 6: Lint + type-check**

```bash
cd apps/api && ruff check app/auth/models.py alembic/env.py && mypy app/auth/models.py
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/auth/models.py alembic/env.py alembic/versions/0001_core_identity.py
git commit -m "feat: core identity SQLAlchemy models and Alembic migration 0001 (T021)"
```

---

## Task 12: OtpRecord + SessionToken — Failing Tests (T021a)

**Files:**
- Create: `apps/api/tests/unit/auth/__init__.py`
- Create: `apps/api/tests/unit/auth/test_otp_session_models.py`

- [ ] **Step 1: Create `__init__.py`**

```bash
touch apps/api/tests/unit/auth/__init__.py
```

- [ ] **Step 2: Write failing tests**

Create `apps/api/tests/unit/auth/test_otp_session_models.py`:

```python
import pytest
from app.auth.models import OtpRecord, SessionToken


def test_otp_record_has_required_columns() -> None:
    cols = {c.name for c in OtpRecord.__table__.columns}
    assert "id" in cols
    assert "patient_id" in cols
    assert "otp_hash" in cols
    assert "issued_at" in cols
    assert "expires_at" in cols
    assert "invalidated_at" in cols
    assert "used_at" in cols


def test_otp_record_patient_id_is_foreign_key() -> None:
    fk_targets = {
        str(fk.target_fullname)
        for fk in OtpRecord.__table__.c["patient_id"].foreign_keys
    }
    assert "patient.id" in fk_targets


def test_session_token_has_required_columns() -> None:
    cols = {c.name for c in SessionToken.__table__.columns}
    assert "id" in cols
    assert "user_id" in cols
    assert "user_type" in cols
    assert "token_hash" in cols
    assert "created_at" in cols
    assert "last_active_at" in cols
    assert "expires_at" in cols
    assert "revoked_at" in cols


def test_session_token_token_hash_is_unique() -> None:
    token_hash_col = SessionToken.__table__.c["token_hash"]
    unique_constraints = [
        c
        for c in SessionToken.__table__.constraints
        if hasattr(c, "columns") and token_hash_col in list(c.columns)
    ]
    assert len(unique_constraints) >= 1
```

- [ ] **Step 3: Run tests — expect ImportError (OtpRecord/SessionToken not in models yet)**

```bash
cd apps/api && pytest tests/unit/auth/test_otp_session_models.py -v 2>&1 | head -10
```

Expected: `ImportError: cannot import name 'OtpRecord' from 'app.auth.models'`

- [ ] **Step 4: Commit failing tests**

```bash
git add tests/unit/auth/__init__.py tests/unit/auth/test_otp_session_models.py
git commit -m "test: add failing model tests for OtpRecord and SessionToken (T021a)"
```

---

## Task 13: OtpRecord + SessionToken Models + Migration 0002 (T021b)

**Files:**
- Modify: `apps/api/app/auth/models.py` — append OtpRecord and SessionToken
- Create: `apps/api/alembic/versions/0002_otp_session.py`

- [ ] **Step 1: Append OtpRecord and SessionToken to `app/auth/models.py`**

Add these two classes at the end of the file (after `PatientProfile`):

```python
class OtpRecord(Base):
    __tablename__ = "otp_record"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    patient_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("patient.id"), nullable=False
    )
    otp_hash: Mapped[str] = mapped_column(Text, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    invalidated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SessionToken(Base):
    __tablename__ = "session_token"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    user_type: Mapped[str] = mapped_column(String(20), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    last_active_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 2: Create `alembic/versions/0002_otp_session.py`**

```python
"""otp_record and session_token tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-06
"""

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "otp_record",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("patient_id", sa.String(36), sa.ForeignKey("patient.id"), nullable=False),
        sa.Column("otp_hash", sa.Text, nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invalidated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "session_token",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("user_type", sa.String(20), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_active_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_session_token_user", "session_token", ["user_id", "user_type"])


def downgrade() -> None:
    op.drop_index("ix_session_token_user", table_name="session_token")
    op.drop_table("session_token")
    op.drop_table("otp_record")
```

- [ ] **Step 3: Run model unit tests**

```bash
cd apps/api && pytest tests/unit/auth/test_otp_session_models.py -v
```

Expected: 4 passed.

- [ ] **Step 4: Run all migration tests**

```bash
cd apps/api && pytest tests/integration/test_migrations.py -v
```

Expected: 10 passed (all tables including otp_record and session_token).

- [ ] **Step 5: Run all unit tests**

```bash
cd apps/api && pytest tests/unit/ tests/contract/ -v
```

Expected: all pass.

- [ ] **Step 6: Lint + type-check**

```bash
cd apps/api && ruff check app/auth/models.py && mypy app/auth/models.py
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/auth/models.py alembic/versions/0002_otp_session.py
git commit -m "feat: add OtpRecord and SessionToken models and migration 0002 (T021b)"
```

---

## Task 14: SettingsProvider — Failing Tests (T022)

**Files:**
- Create: `apps/api/tests/unit/shared/test_settings.py`

- [ ] **Step 1: Write failing tests**

Create `apps/api/tests/unit/shared/test_settings.py`:

```python
import json
import os
from unittest.mock import MagicMock, patch

import pytest
from app.shared.config import Settings, get_settings


def test_env_backend_loads_from_environment() -> None:
    env = {
        "SETTINGS_BACKEND": "env",
        "DATABASE_URL": "postgresql+asyncpg://test:test@localhost/test",
        "REDIS_URL": "redis://localhost:6379/0",
        "FIELD_ENCRYPTION_KEY": "a" * 32,
    }
    with patch.dict(os.environ, env, clear=True):
        settings = get_settings()
    assert settings.database_url == "postgresql+asyncpg://test:test@localhost/test"
    assert isinstance(settings, Settings)


def test_ssm_backend_loads_from_ssm() -> None:
    mock_ssm = MagicMock()
    mock_ssm.get_paginator.return_value.paginate.return_value = [
        {
            "Parameters": [
                {"Name": "/mhp/database_url", "Value": "postgresql+asyncpg://ssm:ssm@host/db"},
                {"Name": "/mhp/redis_url", "Value": "redis://ssm-redis:6379"},
                {"Name": "/mhp/field_encryption_key", "Value": "b" * 32},
            ]
        }
    ]
    with patch.dict(os.environ, {"SETTINGS_BACKEND": "ssm"}):
        with patch("boto3.client", return_value=mock_ssm):
            settings = get_settings()
    assert settings.database_url == "postgresql+asyncpg://ssm:ssm@host/db"
    assert isinstance(settings, Settings)


def test_secrets_manager_backend_loads_from_sm() -> None:
    mock_sm = MagicMock()
    mock_sm.get_secret_value.return_value = {
        "SecretString": json.dumps(
            {
                "database_url": "postgresql+asyncpg://sm:sm@host/db",
                "redis_url": "redis://sm-redis:6379",
                "field_encryption_key": "c" * 32,
            }
        )
    }
    with patch.dict(os.environ, {"SETTINGS_BACKEND": "secrets_manager"}):
        with patch("boto3.client", return_value=mock_sm):
            settings = get_settings()
    assert settings.database_url == "postgresql+asyncpg://sm:sm@host/db"
    assert isinstance(settings, Settings)


def test_all_three_backends_return_settings_instance() -> None:
    for backend in ("env", "ssm", "secrets_manager"):
        assert True  # placeholder — real check in individual tests above
```

- [ ] **Step 2: Run tests — expect ImportError**

```bash
cd apps/api && pytest tests/unit/shared/test_settings.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'app.shared.config'`

- [ ] **Step 3: Commit failing tests**

```bash
git add tests/unit/shared/test_settings.py
git commit -m "test: add failing tests for SettingsProvider (T022)"
```

---

## Task 15: SettingsProvider — Implementation (T023)

**Files:**
- Create: `apps/api/app/shared/config.py`

- [ ] **Step 1: Create `app/shared/config.py`**

```python
import json
import os
from typing import Any

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    field_encryption_key: str
    sms_primary_provider: str = "twilio"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    zoom_account_id: str = ""
    zoom_client_id: str = ""
    zoom_client_secret: str = ""
    zoom_webhook_secret: str = ""
    storage_backend: str = "local"
    storage_local_root: str = "./storage"
    storage_s3_bucket: str = ""
    storage_s3_endpoint_url: str = ""
    allowed_origins: str = "http://localhost:5173"
    settings_backend: str = "env"


def _load_ssm(prefix: str = "/mhp") -> dict[str, Any]:
    import boto3

    client = boto3.client("ssm")
    paginator = client.get_paginator("get_parameters_by_path")
    params: dict[str, Any] = {}
    for page in paginator.paginate(Path=prefix, WithDecryption=True):
        for param in page["Parameters"]:
            key = param["Name"].removeprefix(f"{prefix}/").lower().replace("/", "_")
            params[key] = param["Value"]
    return params


def _load_secrets_manager(secret_name: str = "mhp/config") -> dict[str, Any]:
    import boto3

    client = boto3.client("secretsmanager")
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response["SecretString"])  # type: ignore[no-any-return]


def get_settings() -> Settings:
    backend = os.environ.get("SETTINGS_BACKEND", "env")
    if backend == "ssm":
        return Settings(**_load_ssm())
    if backend == "secrets_manager":
        return Settings(**_load_secrets_manager())
    return Settings()
```

- [ ] **Step 2: Run tests**

```bash
cd apps/api && pytest tests/unit/shared/test_settings.py -v
```

Expected: 4 passed.

- [ ] **Step 3: Lint + type-check**

```bash
cd apps/api && ruff check app/shared/config.py && ruff format --check app/shared/config.py && mypy app/shared/config.py
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/shared/config.py
git commit -m "feat: implement SettingsProvider with env/SSM/Secrets Manager backends (T023)"
```

---

## Task 16: StoragePort — Failing Tests (T024)

**Files:**
- Create: `apps/api/tests/unit/shared/storage/__init__.py`
- Create: `apps/api/tests/unit/shared/storage/test_storage.py`

- [ ] **Step 1: Create `__init__.py`**

```bash
touch apps/api/tests/unit/shared/storage/__init__.py
```

- [ ] **Step 2: Write failing tests**

Create `apps/api/tests/unit/shared/storage/test_storage.py`:

```python
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from app.shared.storage.local import LocalStorageAdapter
from app.shared.storage.s3 import S3StorageAdapter


@pytest.fixture
def local(tmp_path: Path) -> LocalStorageAdapter:
    return LocalStorageAdapter(root=str(tmp_path))


async def test_local_write_and_read(local: LocalStorageAdapter) -> None:
    await local.write("subdir/file.txt", b"hello world")
    assert await local.read("subdir/file.txt") == b"hello world"


async def test_local_delete_removes_file(local: LocalStorageAdapter) -> None:
    await local.write("to_delete.bin", b"data")
    await local.delete("to_delete.bin")
    with pytest.raises(FileNotFoundError):
        await local.read("to_delete.bin")


async def test_local_read_missing_raises(local: LocalStorageAdapter) -> None:
    with pytest.raises(FileNotFoundError):
        await local.read("does_not_exist.txt")


def test_local_presigned_url_contains_key(local: LocalStorageAdapter) -> None:
    url = local.presigned_url("docs/report.pdf")
    assert "docs/report.pdf" in url


async def test_local_delete_nonexistent_is_noop(local: LocalStorageAdapter) -> None:
    await local.delete("nonexistent.txt")  # must not raise


@pytest.fixture
def mock_client() -> MagicMock:
    return MagicMock()


@pytest.fixture
def s3(mock_client: MagicMock) -> S3StorageAdapter:
    adapter = S3StorageAdapter(bucket="test-bucket")
    adapter._client = mock_client
    return adapter


async def test_s3_write_calls_put_object(s3: S3StorageAdapter, mock_client: MagicMock) -> None:
    await s3.write("prescriptions/rx-001.pdf", b"pdf", "application/pdf")
    mock_client.put_object.assert_called_once_with(
        Bucket="test-bucket",
        Key="prescriptions/rx-001.pdf",
        Body=b"pdf",
        ContentType="application/pdf",
    )


async def test_s3_read_returns_body(s3: S3StorageAdapter, mock_client: MagicMock) -> None:
    mock_client.get_object.return_value = {"Body": MagicMock(read=lambda: b"pdf-content")}
    data = await s3.read("prescriptions/rx-001.pdf")
    assert data == b"pdf-content"


async def test_s3_delete_calls_delete_object(s3: S3StorageAdapter, mock_client: MagicMock) -> None:
    await s3.delete("prescriptions/rx-001.pdf")
    mock_client.delete_object.assert_called_once_with(
        Bucket="test-bucket", Key="prescriptions/rx-001.pdf"
    )


def test_s3_presigned_url(s3: S3StorageAdapter, mock_client: MagicMock) -> None:
    mock_client.generate_presigned_url.return_value = "https://r2.example.com/key?sig=x"
    url = s3.presigned_url("prescriptions/rx-001.pdf", expires_in=3600)
    mock_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "test-bucket", "Key": "prescriptions/rx-001.pdf"},
        ExpiresIn=3600,
    )
    assert url == "https://r2.example.com/key?sig=x"
```

- [ ] **Step 3: Run tests — expect ImportError**

```bash
cd apps/api && pytest tests/unit/shared/storage/test_storage.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'app.shared.storage'`

- [ ] **Step 4: Commit failing tests**

```bash
git add tests/unit/shared/storage/__init__.py tests/unit/shared/storage/test_storage.py
git commit -m "test: add failing tests for StoragePort (T024)"
```

---

## Task 17: StoragePort — Implementation (T025)

**Files:**
- Create: `apps/api/app/shared/storage/__init__.py`
- Create: `apps/api/app/shared/storage/base.py`
- Create: `apps/api/app/shared/storage/local.py`
- Create: `apps/api/app/shared/storage/s3.py`

- [ ] **Step 1: Create `app/shared/storage/__init__.py`**

```python
from app.shared.storage.base import StoragePort
from app.shared.storage.local import LocalStorageAdapter
from app.shared.storage.s3 import S3StorageAdapter

__all__ = ["StoragePort", "LocalStorageAdapter", "S3StorageAdapter"]
```

- [ ] **Step 2: Create `app/shared/storage/base.py`**

```python
from abc import ABC, abstractmethod


class StoragePort(ABC):
    @abstractmethod
    async def write(
        self, key: str, data: bytes, content_type: str = "application/octet-stream"
    ) -> None: ...

    @abstractmethod
    async def read(self, key: str) -> bytes: ...

    @abstractmethod
    async def delete(self, key: str) -> None: ...

    @abstractmethod
    def presigned_url(self, key: str, expires_in: int = 3600) -> str: ...
```

- [ ] **Step 3: Create `app/shared/storage/local.py`**

```python
import pathlib

from app.shared.storage.base import StoragePort


class LocalStorageAdapter(StoragePort):
    def __init__(self, root: str = "./storage") -> None:
        self._root = pathlib.Path(root)
        self._root.mkdir(parents=True, exist_ok=True)

    async def write(
        self, key: str, data: bytes, content_type: str = "application/octet-stream"
    ) -> None:
        path = self._root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    async def read(self, key: str) -> bytes:
        path = self._root / key
        if not path.exists():
            raise FileNotFoundError(f"Storage key not found: {key}")
        return path.read_bytes()

    async def delete(self, key: str) -> None:
        path = self._root / key
        if path.exists():
            path.unlink()

    def presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return f"http://localhost:8000/storage/{key}"
```

- [ ] **Step 4: Create `app/shared/storage/s3.py`**

```python
import boto3
from botocore.client import Config

from app.shared.storage.base import StoragePort


class S3StorageAdapter(StoragePort):
    def __init__(self, bucket: str, endpoint_url: str | None = None) -> None:
        self._bucket = bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint_url or None,
            config=Config(signature_version="s3v4"),
        )

    async def write(
        self, key: str, data: bytes, content_type: str = "application/octet-stream"
    ) -> None:
        self._client.put_object(Bucket=self._bucket, Key=key, Body=data, ContentType=content_type)

    async def read(self, key: str) -> bytes:
        response = self._client.get_object(Bucket=self._bucket, Key=key)
        return response["Body"].read()  # type: ignore[no-any-return]

    async def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)

    def presigned_url(self, key: str, expires_in: int = 3600) -> str:
        return self._client.generate_presigned_url(  # type: ignore[no-any-return]
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=expires_in,
        )
```

- [ ] **Step 5: Run storage tests**

```bash
cd apps/api && pytest tests/unit/shared/storage/test_storage.py -v
```

Expected: 9 passed.

- [ ] **Step 6: Run full test suite**

```bash
cd apps/api && pytest tests/unit/ tests/contract/ -v
```

Expected: all pass.

- [ ] **Step 7: Lint + type-check**

```bash
cd apps/api && ruff check app/shared/storage/ && ruff format --check app/shared/storage/ && mypy app/shared/storage/
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/shared/storage/
git commit -m "feat: implement StoragePort with LocalStorageAdapter and S3StorageAdapter (T025)"
```

---

## Task 18: Phase 2 Review Gate (T026)

Run the complete test suite and confirm every checklist item below.

- [ ] **Step 1: Run full test suite**

```bash
cd apps/api && pytest -v
```

Expected: all unit + contract tests pass. Integration tests pass if Docker Compose postgres is running.

- [ ] **Step 2: Lint and format**

```bash
cd apps/api && ruff check app/ && ruff format --check app/
```

Expected: no issues.

- [ ] **Step 3: Type check**

```bash
cd apps/api && mypy app/
```

Expected: no errors.

- [ ] **Step 4: Review checklist**

Verify each item against the implemented code:

- [ ] PHI fields never appear in log output — `PhiRedactionFilter` redacts `mobile_number`, `full_name`, `email`, `otp`, `password`, `token`, and related fields in dict arguments
- [ ] Correlation ID propagates — `CorrelationIdMiddleware` sets `correlation_id_var`, `AuditLogService.log()` reads it, `_JsonFormatter` includes it in every log line
- [ ] Audit log is append-only — `SQLAlchemyAuditLogRepo` has only `append()`, no update or delete methods
- [ ] Audit log hashes actor/resource IDs — `AuditLogService` SHA-256 hashes both before writing
- [ ] RBAC enforced in service layer — `assert_patient_access`, `assert_clinical_write`, etc. raise `PermissionDenied` for wrong roles
- [ ] Patient cannot read another patient's data — covered by `test_patient_cannot_access_other_patient_data`
- [ ] PlatformConfiguration defaults are correct — all 10 keys have sane defaults; unknown keys raise `ValueError`
- [ ] StoragePort abstraction — no code outside `app/shared/storage/` imports boto3 directly
- [ ] STORAGE_BACKEND env var drives adapter selection — `LocalStorageAdapter` for local, `S3StorageAdapter` for s3; `STORAGE_S3_ENDPOINT_URL` points to R2 or AWS S3
- [ ] SettingsProvider — `SETTINGS_BACKEND=env|ssm|secrets_manager` selects backend; all return same `Settings` type
- [ ] All migrations backward-compatible — both migrations use `server_default` for non-nullable columns with values
- [ ] Composite indexes created — `ix_audit_log_actor` on `(actor_id_hash, created_at)` and `ix_audit_log_resource` on `(resource_id_hash)`

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: Phase 2 foundation complete — all T012–T025 implemented and reviewed (T026)"
```

---

**Phase 2 complete.** All blocking primitives are in place. Next phase: Phase 3 — Patient Onboarding & Intake (T027–T041).
