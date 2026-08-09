# PROJECT_FOUNDATION.md

> The minimal context needed to start working on this project in any new contributor session.
>
> _Renamed from `PROJECT_BOOTSTRAP.md` on 2026-07-12._

---

## Quick start

When you start working on this project in a new session, start from the following block:

```text
We are continuing the Learning Platform project.

Repository state: see DEVELOPMENT_GUIDE.md (in the repo).
Immediate task: see docs/00-bootstrap/PROJECT_BACKLOG.md.
Project state: see docs/00-bootstrap/PROJECT_STATE.md.
Recent history: see docs/00-bootstrap/PROJECT_HANDOVER.md.

Rules (binding):
- No WordPress (see ADR-0001).
- Documentation is the source of truth.
- At the end of every session, update PROJECT_BACKLOG.md and append to PROJECT_HANDOVER.md.
- If you make a binding decision, add a new ADR under docs/05-decisions/.

Do not preload all docs. Read only what the task needs.
```

Then read the **three** files above. The rest of the repo is available on demand.

---

## Why this exists

Every new contributor starts with zero context. This file exists so that you can:

1. Re-establish full project context quickly.
2. Switch between development tools without re-explaining the project.
3. Pick up where a previous session left off.

---

## What this file is NOT

- It is **not** an onboarding substitute for the docs.
- It is **not** the source of truth (the docs in the repo are).
- It is **not** a feature spec (use `PRODUCT_BIBLE.md` for that).
- It is **not** the latest state (use `PROJECT_BACKLOG.md` for that).

This is a **boilerplate** — adjust it as the project evolves, but keep it short.
