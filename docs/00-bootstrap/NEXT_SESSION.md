# NEXT_SESSION.md

> **The single task for the current session.** Read this **second** (after `PROJECT_STATE.md`).
> Update this file at the end of every session, even if "no progress."

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 001 |
| Date opened | 2026-07-10 |
| Agent | (fill in: human / ChatGPT / Claude / Codex / …) |
| Goal | **Lock the technology stack (decisions 1–4 in `PROJECT_STATE.md`).** |

---

## Task

Make binding decisions on the four "before code starts" questions in `PROJECT_STATE.md`:

1. Web framework
2. Database (and whether we need a vector DB)
3. Auth model
4. Plugin architecture pattern

For each, produce:
- A short rationale (3–5 lines).
- A one-paragraph comparison of the leading 2–3 options.
- A final choice.
- Migration cost: what does it cost to change this in 6 months?

Save each as a new ADR: `ADR-0003-web-framework.md`, `ADR-0004-database.md`, `ADR-0005-auth.md`, `ADR-0006-plugin-architecture.md`.

After producing the ADRs:
- Update `docs/03-development/TECH_STACK.md` with the chosen stack.
- Update `PROJECT_STATE.md` to mark items 1–4 as resolved.
- Append a handoff to `MASTER_HANDOFF.md`.

---

## Out of scope (do NOT do in this session)

- Writing any source code.
- Writing any deployment config.
- Modifying product vision or feature catalog.
- Translating docs to Farsi (separate task).

---

## Done-when checklist

- [ ] Four new ADRs created and indexed in `DECISIONS.md`.
- [ ] `TECH_STACK.md` reflects the choices.
- [ ] `PROJECT_STATE.md` open-questions list updated.
- [ ] `MASTER_HANDOFF.md` has a new entry for this session.
- [ ] `CHANGELOG.md` has a new entry under `## [Unreleased]`.
- [ ] All changes committed to git with a clear message.
- [ ] `NEXT_SESSION.md` updated to point at session #002.

---

## Notes for the agent

- Do not over-research. A 30-min scan of official docs + 1 community thread per option is enough.
- Prefer boring, well-documented choices over novel ones.
- The user is a single founder. Optimize for **solo velocity**, not for team-scale.
- If you find a fifth question that needs a decision, stop and ask the user. Do not silently add ADRs.
