# PROJECT_BOOTSTRAP.md

> The one-shot prompt + minimal context needed to start working on this project in any new agent / chat / account.

---

## What to copy into a new chat

When you open a new conversation (ChatGPT, Claude, Gemini, etc.) and want to continue this project, paste the following block as your **first message**:

```text
We are continuing the Hawza Family Learning Platform project.

Repository state: see AGENTS.md (in the repo).
Immediate task: see docs/00-bootstrap/NEXT_SESSION.md.
Project state: see docs/00-bootstrap/PROJECT_STATE.md.
Recent history: see docs/00-bootstrap/MASTER_HANDOFF.md.

Rules (binding):
- No WordPress (see ADR-0001).
- Documentation is the source of truth, not the chat.
- At the end of every session, update NEXT_SESSION.md and append to MASTER_HANDOFF.md.
- If you make a binding decision, add a new ADR under docs/05-decisions/.

Do not preload all docs. Read only what the task needs.
```

After pasting, attach (or copy-paste the contents of) the **three** files above. The rest of the repo is available on demand.

---

## Why this exists

Every new agent / chat / account starts with zero context. This file exists so that you can:

1. Re-establish full project context in **one paste**.
2. Switch between ChatGPT, Claude, Codex, Cursor, Gemini without re-explaining the project.
3. Survive a context window reset.

---

## What this file is NOT

- It is **not** a system prompt for the agent.
- It is **not** the source of truth (the docs in the repo are).
- It is **not** a feature spec (use `PRODUCT_BIBLE.md` for that).
- It is **not** the latest state (use `NEXT_SESSION.md` for that).

This is a **boilerplate** — adjust it as the project evolves, but keep it short.
