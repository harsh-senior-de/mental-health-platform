<!-- generated-by: gsd-doc-writer -->
# Getting Started

This guide covers everything a new contributor needs to understand and navigate the Mental
Health Platform repository. The project is currently in the **specification phase** — no
application code exists yet.

---

## Prerequisites

Before you can contribute, ensure the following tools are installed:

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| `git` | Any recent version | Version control |
| `node` / `npm` | <!-- VERIFY: to be confirmed when tech stack is finalised in /speckit-plan --> | Application runtime (post-planning) |
| Claude Code | Current | Primary development agent; used for all speckit workflow commands |

The tech stack (runtime, framework, database client tooling) will be finalised during the
planning phase (`/speckit-plan`). Check back after that step for exact version requirements.

---

## Cloning the Repository

```bash
git clone <repository-url>
cd mental-health-platform
```

No dependencies to install in the current specification phase. Once the plan is complete and
implementation begins, an install step will be added here.

---

## Understanding the Workflow

Every feature follows this pipeline in strict order. **No step may be skipped.**

```
Constitution → Spec → Plan → Tasks → Implementation
```

| Command | Purpose |
|---------|---------|
| `/speckit-constitution` | Define or amend non-negotiable project principles |
| `/speckit-specify` | Write the feature specification |
| `/speckit-clarify` | Resolve ambiguities before planning |
| `/speckit-plan` | Architecture and implementation plan |
| `/speckit-tasks` | Break the plan into atomic dev tasks |
| `/speckit-implement` | Implement a specific task |

No code is written without a corresponding spec and a reviewed plan. If anything is unclear,
run `/speckit-clarify` before proceeding.

---

## Repository Layout

```
mental-health-platform/
├── CLAUDE.md                                   # Runtime guidance for Claude Code — read this first
├── docs/                                       # Project documentation
│   ├── ARCHITECTURE.md                         # System architecture and component diagram
│   ├── CONFIGURATION.md                        # Environment variables and runtime settings
│   └── GETTING-STARTED.md                      # This file
├── specs/
│   └── 001-patient-psychiatrist-match/         # Active feature spec
│       ├── spec.md                             # Full feature specification (fully clarified)
│       ├── actor-flows.md                      # Actor-level flow diagrams
│       ├── competitive-edge.md                 # Product differentiation analysis
│       ├── checklists/                         # Spec quality and gap checklists
│       └── research/                           # Background research documents
└── .specify/
    ├── memory/constitution.md                  # Project constitution v1.1.0 — non-negotiable principles
    ├── feature.json                            # Active feature directory pointer
    └── extensions.yml                          # Git auto-commit hook configuration
```

---

## Current Project Status

| Phase | Status |
|-------|--------|
| Constitution | v1.1.0 — ratified |
| Feature spec `001-patient-psychiatrist-match` | Fully clarified — ready for planning |
| Plan | Not started — next step |
| Tasks | Not started |
| Implementation | Not started |

The **next step** for any contributor picking up this project is to run `/speckit-plan` to
produce the architecture and implementation plan for feature `001-patient-psychiatrist-match`.

---

## Common Setup Issues

**I ran a speckit command and nothing happened.**
Speckit commands run inside Claude Code. Open the project in Claude Code, then run the
command in the Claude Code chat interface — not in a terminal shell.

**I am not sure whether to start coding.**
Do not write code yet. The project has not reached the implementation phase. Check the
Current Project Status table above and follow the pipeline.

**I cannot find `.env` or environment variable documentation.**
Environment variables are fully documented in `docs/CONFIGURATION.md`. No `.env.example`
file exists yet — it will be added when the planning phase is complete and the tech stack
is confirmed.

---

## Key Non-Negotiable Principles

All contributors must understand these constraints before making any changes:

1. **Privacy** — All PHI encrypted at rest (AES-256) and in transit (TLS 1.2+). No PII or
   PHI in logs, metrics, or traces. Audit logs are immutable and retained for 7 years minimum.
2. **Clinical safety** — No automated diagnosis or treatment recommendations. Only licensed
   psychiatrists make clinical decisions. Crisis pathways must always be reachable.
3. **Accessibility** — WCAG 2.1 AA minimum. i18n hooks in all user-visible strings from day one.
4. **Test-driven development** — Tests are written before implementation. Coverage >= 80% on
   every merge to `main`.
5. **Observability** — Structured JSON logging throughout. Correlation IDs on all critical flows.
   No PHI in any observability system.

The full project constitution is at `.specify/memory/constitution.md`.

---

## Next Steps

Once the planning phase is complete, refer to:

- `docs/ARCHITECTURE.md` — System architecture, component diagram, and directory structure rationale
- `docs/CONFIGURATION.md` — All environment variables and runtime `PlatformConfiguration` settings
- `CLAUDE.md` — Complete runtime guidance, user roles, and forbidden practices
