# DEVELOPMENT_GUIDE.md

> **Engineering onboarding router.** Read this first, then read only the documentation
> section you need. Do not preload every document.

---

## What this project is

A **non-WordPress learning platform** — a modular, self-hosted, multi-tenant LMS.
The repository is a single product: the Learning Platform, whose architecture is a
modular monolith over a pnpm workspace.

Read [`README.md`](./README.md) and [`docs/01-product/PRODUCT_BIBLE.md`](./docs/01-product/PRODUCT_BIBLE.md)
only if the task requires product context.

---

## How to onboard (five reads, in order)

| # | File | Why |
| --- | --- | --- |
| 1 | `docs/00-bootstrap/PROJECT_STATE.md` | What is done, what is next. |
| 2 | `docs/00-bootstrap/PROJECT_BACKLOG.md` | The exact task for this work cycle. |
| 3 | `docs/00-bootstrap/PROJECT_HANDOVER.md` | Recent history, decisions, open questions. |
| 4 | `docs/05-decisions/DECISIONS.md` | Why we chose what we chose (binding). |
| 5 | `docs/03-development/ENGINEERING_PROTOCOL.md` | **Engineering Protocol v2** — 60 rules; before any code work (ADR-0012/0013). |

Read `docs/01-product/*` or `docs/02-architecture/*` only when the current task touches
them. They are large.

---

## Hard rules (binding)

1. **No WordPress.** Period. See `ADR-0001`.
2. **No editing of historical files** (CHANGELOG, past ADRs, past handovers). Append-only.
3. **Update `PROJECT_BACKLOG.md` at the end of every work cycle**, even if "no progress."
4. **Append a handover entry to `PROJECT_HANDOVER.md`** when you finish a non-trivial task.
5. **Do not invent product facts.** If something is not in the docs, say so. Do not
   hallucinate features, users, or constraints.
6. **Default to the smallest change that works.** Do not refactor on a whim.
7. **English for code, identifiers, file names.** Farsi (Persian) for product copy,
   user-facing text, and project-specific narrative sections of docs.
8. **Run `pnpm verify` before every commit.** See `docs/03-development/QUALITY_GATES.md`.
9. **Complete `docs/03-development/GOVERNANCE_CHECKLIST.md` every session.** CI: `.github/workflows/governance.yml`.

---

## Build / test / run

```bash
# Pinned in package.json / engines: Node >= 20, pnpm >= 9
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm verify   # lint + typecheck + test + build — required before commit
```

Do not invent build commands. Check `docs/03-development/TECH_STACK.md` before running
anything unfamiliar.

---

## When you finish a work cycle

```markdown
1. Update docs/00-bootstrap/PROJECT_BACKLOG.md
2. Append to docs/00-bootstrap/PROJECT_HANDOVER.md (date, what changed, what's next)
3. If you made a binding decision, add a new ADR under docs/05-decisions/
4. Commit with a Conventional Commits message
5. Report the file paths and commit hash
```

The documentation is the source of truth.

---

## Tooling notes

- This guide follows a standard project structure supported across major editors and
  automation tooling (VS Code, JetBrains, CLI workflows).
- The repository is versioned and self-documenting on purpose so any contributor or
  automation working against it reads the same files without re-explaining context.

---

## What is intentionally NOT here

- No coding style rules (live in `docs/03-development/` once written).
- No architecture deep-dive (live in `docs/02-architecture/`).
- No feature lists (live in `docs/01-product/FEATURE_CATALOG.md`).
- No deployment steps (live in `docs/07-deployment/` once written).

If you find yourself wanting to put something in this file, it probably belongs in a
deeper document. Keep this file **under 100 lines**.
