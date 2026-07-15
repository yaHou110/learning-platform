# Learning Platform

> A non-WordPress, portable learning platform built for Islamic seminary families — designed to run for years and survive any change of tool.

[![Status](https://img.shields.io/badge/status-v1.0-blueviolet)](#project-state)
[![Docs](https://img.shields.io/badge/docs-21%20files-success)](#documentation-map)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](#license)
[![Contributors](https://img.shields.io/badge/contributor--ready-yes-brightgreen)](#for-contributors)

---

## What is this?

This repository is **two things at once**:

1. **A real product** — the *Learning Platform* (LPC + deployment), a non-WordPress learning platform.
2. **A documentation system** — an *Engineering Protocol* that lets any contributor pick up the project without re-explaining the context.

It is **not** a 20k-word super-prompt. It is a small, modular, Git-versioned body of knowledge.

---

## Quick start

```bash
git clone <this-repo>
cd <this-repo>
# Open DEVELOPMENT_GUIDE.md first if you are a contributor
# Open README.md if you are a human
```

If you are a contributor, **start here**: [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) (it is intentionally short — under 100 lines).

---

## Documentation map

```
.
├── README.md                      ← you are here (human entry)
├── DEVELOPMENT_GUIDE.md           ← contributor entry (router, < 100 lines)
├── LICENSE
├── CHANGELOG.md
│
├── docs/
│   ├── 00-bootstrap/              ← how to onboard a new contributor/session
│   │   ├── PROJECT_FOUNDATION.md
│   │   ├── PROJECT_HANDOVER.md
│   │   ├── PROJECT_STATE.md
│   │   └── PROJECT_BACKLOG.md
│   │
│   ├── 01-product/                ← what we build and why
│   │   ├── PRODUCT_BIBLE.md
│   │   ├── REQUIREMENTS.md
│   │   ├── FEATURE_CATALOG.md
│   │   ├── PERSONAS.md
│   │   └── ROADMAP.md
│   │
│   ├── 02-architecture/           ← how it is built
│   │   ├── SYSTEM_ARCHITECTURE.md
│   │   ├── DATA_MODEL.md
│   │   ├── PLUGIN_MATRIX.md
│   │   └── PERMISSION_MATRIX.md
│   │
│   ├── 03-development/            ← conventions and rules
│   │   └── TECH_STACK.md
│   │
│   └── 05-decisions/              ← why we chose what we chose
│       ├── DECISIONS.md
│       ├── ADR-0001-no-wordpress.md
│       └── ADR-0002-operating-manual.md
│
└── templates/                     ← copy-paste starters
    ├── HANDOFF_TEMPLATE.md
    ├── SESSION_NOTES.md
    ├── ADR_TEMPLATE.md
    └── FEATURE_REQUEST.md
```

---

## The 30-second version (for humans)

- **Problem**: seminary families need a structured learning platform. WordPress is a poor fit long-term.
- **Solution**: A modular, plugin-based, portable learning platform with a Persian-first UX.
- **Stack** (locked in [TECH_STACK.md](./docs/03-development/TECH_STACK.md), backed by ADR-0003..0006): Next.js 15 + TypeScript strict + PostgreSQL 16 + Drizzle ORM + Auth.js v5 + pnpm monorepo + internal compile-time plugins.
- **Status**: v1.1 — documentation system + first ADR batch + monorepo scaffold (no production deployment yet).
- **Owner**: single founder, multiple contributors.

For the full story, read [`docs/01-product/PRODUCT_BIBLE.md`](./docs/01-product/PRODUCT_BIBLE.md).

---

## The 30-second version (for contributors)

You are looking at the Learning Platform repo.

1. Read `DEVELOPMENT_GUIDE.md` (it's the router — under 100 lines).
2. Read `docs/00-bootstrap/PROJECT_STATE.md` (what's done, what's next).
3. Read `docs/00-bootstrap/PROJECT_BACKLOG.md` (what to do this session).
4. If you need history, read `docs/00-bootstrap/PROJECT_HANDOVER.md`.
5. **Do not** read all `docs/01-product/*` unless the task requires it. They are large.

When you finish a session, **update `PROJECT_BACKLOG.md` and append to `PROJECT_HANDOVER.md`**. That is your only obligation.

---

## Project state

| Layer | State |
| --- | --- |
| Repository structure | ✅ v1.0 |
| Product documentation | ✅ v1.0 (skeleton) |
| Architecture documentation | ✅ v1.0 (skeleton) |
| Foundation documents (MVP_SCOPE, BOUNDED_CONTEXTS, PROJECT_PRINCIPLES, ARCHITECTURE_CONSTRAINTS) | ✅ v1.1 |
| Core stack ADRs (framework, DB, auth, plugins) | ✅ v1.1 (ADR-0003..0006 Accepted) |
| Monorepo scaffold (pnpm + apps/web + packages/core + 5 plugins) | ✅ v1.1 |
| First bounded context wired (Identity & Access) | ⏳ next session |
| Code (UI, course/lesson content) | ❌ not started |
| Deployment | ❌ not started (hosting ADR pending) |

See [`docs/00-bootstrap/PROJECT_STATE.md`](./docs/00-bootstrap/PROJECT_STATE.md) for details.

---

## Contributing

This project is currently single-founder. Until v1.0 ships, the process is:

1. Read the docs (especially PRODUCT_BIBLE).
2. Open a branch: `git checkout -b <scope>/<short-name>`.
3. Make changes.
4. Update PROJECT_BACKLOG.md.
5. Open a PR or self-merge with a clear commit message.

## Local dev (after `pnpm install` at the repo root)

```bash
# 1. Start Postgres + Adminer
docker compose up -d

# 2. Apply migrations
pnpm db:migrate

# 3. Seed a dev tenant + super admin (idempotent)
pnpm db:seed:dev

# 4. Start the web app
pnpm dev
# → http://localhost:3000   (web)
# → http://localhost:8080   (Adminer — login: System=PostgreSQL, Server=postgres,
#                            Username=learning_platform, Password=learning_platform, Database=learning_platform)
```

Default seeded credentials: tenant `demo`, email `admin@lp.local`,
password `changeme`. **Change in production.**

---

## License

Proprietary — see [`LICENSE`](./LICENSE).
