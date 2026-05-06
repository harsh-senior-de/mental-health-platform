<!-- generated-by: gsd-doc-writer -->
# Development

This document covers local development setup, the spec-driven workflow, code standards,
branch conventions, and the PR process for the Mental Health Platform.

---

## Local Setup

The project is currently in the **specification phase** — no application code or build
toolchain exists yet. The tech stack will be confirmed during the planning phase
(`/speckit-plan`). This section will be updated with concrete commands once the plan is
complete.

Until then, the minimum requirements to participate in spec and planning work are:

- **Git** — all workflow steps produce git commits via the speckit extension hooks
- **Claude Code** — the speckit commands (`/speckit-*`) are Claude Code slash commands
  that drive the entire development pipeline

To begin:

```bash
git clone <repository-url>
cd mental-health-platform
```

Environment variable setup (`.env` file) and dependency installation commands will be added
here after `/speckit-plan` completes. See `docs/CONFIGURATION.md` for the full list of
required environment variables.

---

## Build Commands

No build scripts exist yet — the tech stack has not been decided. This section will be
populated after `/speckit-plan` completes and a `package.json` or equivalent is introduced.

The following categories of scripts will be documented here once defined:

| Category | Purpose |
|----------|---------|
| Build | Compile TypeScript / bundle assets |
| Dev | Start the development server with hot reload |
| Lint | Run linter across all source files |
| Format | Run formatter and apply fixes |
| Test | Run the full test suite |
| Test (watch) | Run tests in watch mode during development |

---

## Spec-Driven Development Workflow

**No code may be written without a completed, clarified spec and a reviewed plan.** Every
feature follows this pipeline in strict order:

```
Constitution → Spec → Plan → Tasks → Implementation
```

| Command | Purpose |
|---------|---------|
| `/speckit-constitution` | Define or amend non-negotiable project principles |
| `/speckit-specify` | Write the feature specification |
| `/speckit-clarify` | Resolve specification ambiguities before planning |
| `/speckit-plan` | Architecture and implementation plan |
| `/speckit-tasks` | Break the plan into atomic dev tasks |
| `/speckit-implement` | Implement a specific task |

Git commits are triggered automatically at each transition by the speckit extension hooks
configured in `.specify/extensions.yml`. The hooks run `git commit` before and after each
step to ensure every workflow transition is tracked.

### Current state

| Phase | Status |
|-------|--------|
| Constitution | v1.1.0 — ratified |
| Feature spec `001-patient-psychiatrist-match` | Fully clarified — ready for planning |
| Plan | Not started — next step is `/speckit-plan` |
| Tasks | Not started |
| Implementation | Not started |

---

## Code Style

The linting and formatting tools will be confirmed during the planning phase. Until then,
the following standards are non-negotiable per the project constitution:

- **Clean architecture**: business logic lives exclusively in the service layer — never in
  controllers, routes, or handlers
- **No duplicate logic**: reuse existing services; never re-implement existing behaviour
- **No hardcoded values**: all business logic thresholds and mappings must be configurable
  via `PlatformConfiguration` (see `docs/CONFIGURATION.md`)
- **DTOs everywhere**: all API inputs and outputs use Data Transfer Objects
- **Structured logging**: JSON format throughout; no `console.log`; no PHI in any log field

This section will be updated with the specific linter (ESLint / Biome), formatter (Prettier
/ Biome), config file locations, and `npm run lint` / `npm run format` commands after the
plan is complete.

---

## Branch Conventions

Per the project constitution (`constitution.md` — Development Workflow):

- **All work happens on feature branches.** Direct commits to `main` are prohibited.
- **Branch naming**: `###-feature-name` — the three-digit number matches the feature spec
  directory (e.g., `001-patient-psychiatrist-match`).
- Feature branches are created automatically by the `/speckit-specify` command via the
  `speckit.git.feature` hook.

### Current active branch

`001-patient-psychiatrist-match` — tracks all spec and planning work for the first feature.

---

## PR Process

Per the project constitution, all pull requests must pass the following gates before merge:

1. **Automated test suite** — all tests must pass; coverage must not drop below 80%
2. **Linting and formatting checks** — no lint errors; formatter must report no diff
3. **Security scan** — dependency CVE scan (Dependabot or equivalent) must be clear
4. **Peer code review** — minimum one approval from a senior contributor
5. **Safety review** — mandatory for any user-facing change (the platform serves users who
   may be in psychological distress; every UI change requires an explicit safety sign-off)

A task is considered **done** only when:

- Code is merged to `main`
- All tests pass in CI
- The acceptance scenarios from the feature spec are verified in staging

No GitHub Actions workflow files exist yet — CI configuration will be introduced during the
planning phase. This section will be updated with the workflow name and trigger conditions
once CI is set up.

---

## Non-Negotiable Development Rules

These rules are enforced by the project constitution (v1.1.0) and apply to every
contribution:

- **Tests before code**: tests are written before implementation begins (Red → Green →
  Refactor). Unit tests for all business logic; integration tests for all external service
  boundaries (database, Razorpay, Zoom, SMS, WhatsApp).
- **Clinical safety paths have dedicated end-to-end tests**: crisis routing, content flags,
  and prescription flows each require an E2E test before the feature may be considered done.
- **No PHI in observability**: no PII or PHI may appear in any log field, metric label, or
  trace attribute — ever.
- **RBAC at the service layer**: authorization is enforced in the service layer, not only at
  the UI layer.
- **Regulatory compliance review**: any feature touching clinical data must be reviewed for
  compliance with the Mental Healthcare Act 2017 and DPDPA 2023 before shipping.
- **YAGNI**: do not write code for hypothetical future requirements. Build the simplest thing
  that passes the acceptance scenarios.
- **Penetration testing**: a security review is required before any major release that
  introduces new authentication, authorization, or PHI-handling flows.

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Runtime guidance for Claude Code — read this first |
| `.specify/memory/constitution.md` | Non-negotiable project principles (v1.1.0) |
| `specs/001-patient-psychiatrist-match/spec.md` | Active feature spec — fully clarified |
| `.specify/extensions.yml` | Git hook configuration for automated commits between workflow steps |
| `.specify/feature.json` | Active feature directory pointer used by all speckit commands |
| `docs/ARCHITECTURE.md` | System architecture, component diagram, and key abstractions |
| `docs/CONFIGURATION.md` | All environment variables and `PlatformConfiguration` settings |

---

## Next Steps

1. Run `/speckit-plan` to produce the architecture and implementation plan for
   `001-patient-psychiatrist-match`. This will confirm the tech stack, define build scripts,
   and establish the CI/CD pipeline.
2. Run `/speckit-tasks` to break the plan into atomic dev tasks.
3. Run `/speckit-implement` for each task in order.

Build commands, linter configuration, and CI details will be added to this document as each
step completes.
