# Hawza Family Learning Platform

> A non-WordPress, AI-native learning platform built for Hawza (Islamic seminary) families — designed to run for years and survive any change of model, agent, or tool.

[![Status](https://img.shields.io/badge/status-v1.0-blueviolet)](#project-state)
[![Docs](https://img.shields.io/badge/docs-21%20files-success)](#documentation-map)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](#license)
[![Agents](https://img.shields.io/badge/agent--ready-yes-brightgreen)](#for-ai-agents)

---

## What is this?

This repository is **two things at once**:

1. **A real product** — the *Hawza Family Learning Platform* (LPC + Hawza instance), a non-WordPress learning platform.
2. **A documentation system** — an *AI Project OS* that lets any AI agent (ChatGPT, Claude Code, Codex, Cursor, Gemini CLI, …) pick up the project without re-explaining the context.

It is **not** a 20k-word super-prompt. It is a small, modular, Git-versioned body of knowledge.

---

## Quick start

```bash
git clone <this-repo>
cd <this-repo>
# Open AGENTS.md first if you are an AI agent
# Open README.md if you are a human
```

If you are an AI agent, **start here**: [`AGENTS.md`](./AGENTS.md) (it is intentionally short — under 100 lines).

---

## Documentation map

```
.
├── README.md                      ← you are here (human entry)
├── AGENTS.md                      ← AI agent entry (router, < 80 lines)
├── LICENSE
├── CHANGELOG.md
│
├── docs/
│   ├── 00-bootstrap/              ← how to onboard a new agent/session
│   │   ├── PROJECT_BOOTSTRAP.md
│   │   ├── MASTER_HANDOFF.md
│   │   ├── PROJECT_STATE.md
│   │   └── NEXT_SESSION.md
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
│       └── ADR-0002-ai-project-os.md
│
└── templates/                     ← copy-paste starters
    ├── HANDOFF_TEMPLATE.md
    ├── SESSION_NOTES.md
    ├── ADR_TEMPLATE.md
    └── FEATURE_REQUEST.md
```

---

## The 30-second version (for humans)

- **Problem**: Hawza families need a structured learning platform. WordPress is a poor fit long-term.
- **Solution**: A modular, plugin-based, AI-native learning platform with a Persian-first UX.
- **Stack** (decisions pending — see [TECH_STACK.md](./docs/03-development/TECH_STACK.md)): TypeScript, Next.js or similar, Postgres, plugin architecture.
- **Status**: v1.0 — repository skeleton, product bible, and decision log established. Implementation phase has not started.
- **Owner**: single founder, multi-agent team.

For the full story, read [`docs/01-product/PRODUCT_BIBLE.md`](./docs/01-product/PRODUCT_BIBLE.md).

---

## The 30-second version (for agents)

You are looking at the Hawza Family Learning Platform repo.

1. Read `AGENTS.md` (it's the router — 80 lines).
2. Read `docs/00-bootstrap/PROJECT_STATE.md` (what's done, what's next).
3. Read `docs/00-bootstrap/NEXT_SESSION.md` (what to do this session).
4. If you need history, read `docs/00-bootstrap/MASTER_HANDOFF.md`.
5. **Do not** read all `docs/01-product/*` unless the task requires it. They are large.

When you finish a session, **update `NEXT_SESSION.md` and append to `MASTER_HANDOFF.md`**. That is your only obligation.

---

## Project state

| Layer | State |
| --- | --- |
| Repository structure | ✅ v1.0 |
| Product documentation | ✅ v1.0 (skeleton) |
| Architecture documentation | ✅ v1.0 (skeleton) |
| Development conventions | ⏳ TBD |
| Code | ❌ not started |
| Deployment | ❌ not started |

See [`docs/00-bootstrap/PROJECT_STATE.md`](./docs/00-bootstrap/PROJECT_STATE.md) for details.

---

## Contributing

This project is currently single-founder. Until v1.0 ships, the process is:

1. Read the docs (especially PRODUCT_BIBLE).
2. Open a branch: `git checkout -b <scope>/<short-name>`.
3. Make changes.
4. Update NEXT_SESSION.md.
5. Open a PR or self-merge with a clear commit message.

---

## License

Proprietary — see [`LICENSE`](./LICENSE).
