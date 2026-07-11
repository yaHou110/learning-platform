# NEXT_SESSION.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 002 |
| Date opened | 2026-07-10 |
| Agent | (fill in: human / ChatGPT / Claude / Codex / …) |
| Goal | **Write the four foundation documents, then review before any ADR.** |

---

## Task

Produce the v1 foundation layer. **No implementation choices are made here.**

1. `docs/01-product/MVP_SCOPE.md` — product scope: problem, target users, goals, in/out scope, success criteria (product outcomes only).
2. `docs/02-architecture/BOUNDED_CONTEXTS.md` — domain boundaries, responsibilities, domain events.
3. `docs/00-bootstrap/PROJECT_PRINCIPLES.md` — binding long-term principles.
4. `docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md` — hard constraints, SLOs, API-contract rule.

Each new doc opens with its **responsibility** and **references** existing docs instead of repeating them (single source of truth). No duplication.

**After the four docs exist: STOP and review with the founder. Do NOT write `ADR-0003`–`ADR-0006` yet.**

Only after review, **propose ADR candidates** (framework, DB, auth, plugin model), each justified against `MVP_SCOPE` + `BOUNDED_CONTEXTS` + `PROJECT_PRINCIPLES` + `ARCHITECTURE_CONSTRAINTS`. The founder picks; then write the ADRs.

---

## Out of scope (do NOT do in this session)

- Writing `ADR-0003`–`ADR-0006` or any technology decision.
- Any source code.
- Deployment config.
- Rewriting existing ADRs or docs (`ADR-0001`/`0002`, `SYSTEM_ARCHITECTURE`, `DATA_MODEL`, `PLUGIN_MATRIX`, `PERMISSION_MATRIX`).

---

## Done-when checklist

- [x] Four foundation docs created and indexed.
- [x] `PROJECT_STATE.md` open-questions 1–4 marked pending (foundation written).
- [x] `MASTER_HANDOFF.md` has a Session 002 entry.
- [x] `CHANGELOG.md` has an `[Unreleased]` entry.
- [ ] Founder reviews the foundation docs.
- [ ] Commit (after review/approval).
- [ ] `NEXT_SESSION.md` updated to Session 003 (ADR candidates) after review.

---

## Notes for the agent

- Requirements drive technology, not the reverse (`PROJECT_PRINCIPLES.md`).
- Keep docs cohesive: reference, don't repeat.
- Known inconsistencies to resolve during ADRs: `SYSTEM_ARCHITECTURE.md` "Next.js" diagram; `PLUGIN_MATRIX.md` "monorepo package / plugin.json" wording vs the compile-time-only principle.
