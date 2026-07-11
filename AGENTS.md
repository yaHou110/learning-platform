# AGENTS.md

> **Router for AI agents.** Read this first. Then read only the docs you need. Do NOT preload all docs.

---

## What this project is

A **non-WordPress, AI-native learning platform** for Hawza (Islamic seminary) families.
Two products in one repo: a generic `Learning Platform Core` and a Hawza-customized instance.

See [`README.md`](./README.md) and [`docs/01-product/PRODUCT_BIBLE.md`](./docs/01-product/PRODUCT_BIBLE.md) only if the task requires product context.

---

## How to onboard (4 reads, in order)

| # | File | Why |
| --- | --- | --- |
| 1 | `docs/00-bootstrap/PROJECT_STATE.md` | What is done, what is next. |
| 2 | `docs/00-bootstrap/NEXT_SESSION.md` | The exact task for this session. |
| 3 | `docs/00-bootstrap/MASTER_HANDOFF.md` | Recent history, decisions, open questions. |
| 4 | `docs/05-decisions/DECISIONS.md` | Why we chose what we chose (binding). |

**Do not** read `docs/01-product/*` or `docs/02-architecture/*` unless the current task touches them. They are large.

---

## Hard rules (binding)

1. **No WordPress.** Period. See `ADR-0001`.
2. **No editing of historical files** (CHANGELOG, past ADRs, past handoffs). Append-only.
3. **Update `NEXT_SESSION.md` at the end of every session**, even if "no progress."
4. **Append a handoff entry to `MASTER_HANDOFF.md`** when you finish a non-trivial task.
5. **Do not invent product facts.** If something is not in the docs, say so. Do not hallucinate features, users, or constraints.
6. **Default to the smallest change that works.** Do not refactor on a whim.
7. **English for code, identifiers, file names.** Farsi (Persian) for product copy, user-facing text, and project-specific narrative sections of docs.

---

## Build / test / run

```bash
# Not yet implemented — see docs/03-development/TECH_STACK.md
# Placeholder for v1.1:
#   pnpm install
#   pnpm dev
#   pnpm test
#   pnpm build
```

Do not invent build commands. Check `TECH_STACK.md` before running anything.

---

## When you finish a session

```markdown
1. Update docs/00-bootstrap/NEXT_SESSION.md
2. Append to docs/00-bootstrap/MASTER_HANDOFF.md (date, what changed, what's next)
3. If you made a binding decision, add a new ADR under docs/05-decisions/
4. Commit with a Conventional Commits message
5. Tell the user the file paths and commit hash
```

That is it. Do not write essays about your process in chat. The docs are the source of truth.

---

## Agent-specific notes

- **ChatGPT / Claude / Gemini (web chat)**: paste `NEXT_SESSION.md` content as your prompt. Do not paste the full repo.
- **Cursor / Windsurf**: this repo is configured to be consumed via this `AGENTS.md`. Use `.cursorrules` symlink if needed.
- **Codex / Claude Code (CLI)**: read the bootstrap files via the repo tools. Do not paste contents into chat.
- **Other agents**: if they understand `AGENTS.md` convention, you are good. Otherwise, point them at `README.md`.

---

## What is intentionally NOT here

- No coding style rules (live in `docs/03-development/` once written).
- No architecture deep-dive (live in `docs/02-architecture/`).
- No feature lists (live in `docs/01-product/FEATURE_CATALOG.md`).
- No deployment steps (live in `docs/07-deployment/` once written).

If you find yourself wanting to put something in this file, it probably belongs in a deeper doc. Keep this file **under 100 lines**.
