# ADR-0002: Documentation is AI-native, agent-portable

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Founder

---

## Context

This project's documentation must:

1. Survive a change of model, agent, or tool (ChatGPT → Claude → Codex → Cursor → Gemini → …).
2. Not depend on a specific chat history or single AI session.
3. Be readable in < 5 minutes by a new agent with zero context.
4. Avoid the "context bloat" problem (oversized `AGENTS.md` files that hurt performance).
5. Be maintainable by a single human over years.

We considered three approaches.

---

## Decision

**We adopt the "AI Project OS" pattern:**

- A small, **router-style `AGENTS.md`** (< 100 lines) that points at deeper docs.
- A set of **modular Markdown docs** organized by concern (bootstrap, product, architecture, development, decisions).
- **Append-only history** for `CHANGELOG.md`, `MASTER_HANDOFF.md`, and ADRs.
- **Tool-agnostic structure** that works in ChatGPT web, Claude Code, Codex CLI, Cursor, Gemini CLI, and any agent that supports the `AGENTS.md` convention.
- **No "super-prompt"** as the source of truth — the repo is.

---

## Rationale

### 1. Avoid context bloat

Recent guidance (and our own experience) shows that stuffing all project knowledge into a single file (super-prompt or oversized `AGENTS.md`) leads to:

- Token waste on every request.
- Confused model behavior (too many constraints, no clear priority).
- Higher cost.
- Lower success rate on agentic tasks.

By contrast, a small `AGENTS.md` + on-demand doc loading keeps each request focused.

### 2. Survive model migration

A super-prompt is bound to the chat it was written in. If the user switches accounts, models, or tools, the project context is lost.

A versioned repo with docs committed to git is **the** durable artifact. A new agent reads the same files; no human re-explanation needed.

### 3. Single human maintainer

We are a single founder. Documentation must be:
- Easy to update (small files, clear ownership).
- Easy to skim (good structure, table of contents).
- Easy to commit (one PR per logical change).

### 4. Append-only history protects truth

Decisions should not silently change. The `MASTER_HANDOFF.md`, `CHANGELOG.md`, and ADR pattern enforce this: history is preserved, new entries are appended.

### 5. Standard `AGENTS.md` is an emerging convention

The `AGENTS.md` convention is now supported by:
- OpenAI Codex (CLI)
- Cursor (`.cursorrules` compatible)
- Claude Code
- Gemini CLI
- Windsurf, Continue, Aider (with mapping)

By following the convention, we get multi-agent support for free.

---

## Consequences

### Positive

- ✅ Project state is durable and tool-agnostic.
- ✅ Onboarding a new agent takes < 5 min (read AGENTS.md + 3 bootstrap files).
- ✅ Cost per session is lower (small context window).
- ✅ History is preserved and auditable.
- ✅ Easy to contribute to (good docs = good OSS).

### Negative

- ❌ Discipline required: docs must be updated each session, or they rot.
- ❌ Slight overhead for the founder (writing 1–2 small files per session).
- ❌ Some agents don't yet support `AGENTS.md` natively → need a symlink or paste.

### Neutral

- 🔁 If the project is later opened to a team, the same docs serve as onboarding.
- 🔁 The OS can be reused (as a template) for other projects.

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Super-prompt in one chat** | Rejected | Lost on session end; model-specific. |
| **Single big `AGENTS.md`** | Rejected | Context bloat; violates "small router" best practice. |
| **Wiki (Notion, Confluence)** | Rejected | Not in-repo, not git-versioned, paid, agent-unfriendly. |
| **AI Project OS (chosen)** | Accepted | All boxes ticked. |

---

## The specific shape we use

```
README.md          → human entry, 1-page summary
AGENTS.md          → AI agent router (< 100 lines)
docs/
  00-bootstrap/    → onboarding (PROJECT_STATE, NEXT_SESSION, MASTER_HANDOFF, BOOTSTRAP)
  01-product/      → product truth (BIBLE, REQUIREMENTS, FEATURES, PERSONAS, ROADMAP)
  02-architecture/ → system shape (SYSTEM_ARCHITECTURE, DATA_MODEL, PLUGIN_MATRIX, PERMISSION_MATRIX)
  03-development/  → conventions (TECH_STACK, …)
  05-decisions/    → why (DECISIONS, ADR-NNNN)
templates/         → copy-paste starters
```

Each file:
- Has a single concern.
- Is < ~500 lines.
- Cross-links to related files (never duplicates).
- Is owned by exactly one folder (no split responsibility).

---

## How agents are expected to behave

(From `AGENTS.md`.)

1. Read `AGENTS.md`.
2. Read `docs/00-bootstrap/PROJECT_STATE.md`.
3. Read `docs/00-bootstrap/NEXT_SESSION.md`.
4. Read `docs/00-bootstrap/MASTER_HANDOFF.md` (recent entries).
5. Read `docs/05-decisions/DECISIONS.md` if the task touches a binding decision.
6. **Do not** read `docs/01-product/*` or `docs/02-architecture/*` unless the task requires it.
7. At the end of a session, update `NEXT_SESSION.md` and append to `MASTER_HANDOFF.md`.
8. If a binding decision is made, write a new ADR.

---

## When to revisit

If:
- A clear new convention supersedes `AGENTS.md` (e.g. an open standard ratified by a major org).
- The OS overhead (writing 1 file per session) becomes a bottleneck.
- We move to a fully team-based model that needs a different coordination pattern.

A new ADR is required to overturn this one.
