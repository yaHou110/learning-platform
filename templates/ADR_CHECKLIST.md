# ADR Checklist Template

> **Use this before submitting a new ADR.** Every item must be ✅ before the PR opens. If something does not apply, write "N/A — <reason>".

---

## Mandatory fields

- [ ] **Status**: `Proposed | Accepted | Superseded | Rejected` (exactly one)
- [ ] **Date**: `YYYY-MM-DD` (today; no relative dates like "next sprint")
- [ ] **Deciders**: comma-separated list of names/roles (at least one)
- [ ] **Title**: `ADR-NNNN: <short slug>` — matches filename `ADR-NNNN-<short-slug>.md`

---

## Content sections (all required unless noted)

- [ ] **Context** — what forces/constraints/deadlines motivate this decision? Key terms defined?
- [ ] **Decision** — single crisp statement. *One decision per ADR.* If you write "and also…", split it.
- [ ] **Rationale** — for each major argument, say *why it matters for this project* (tie to constraints, ADRs, principles). Do not repeat Context.
- [ ] **Consequences** — **Positive / Negative / Neutral** (at least one bullet each; "None" is valid for Neutral).
- [ ] **Alternatives considered** — table with columns: **Option | Verdict | Why**. Minimum 3 rows (chosen + 2 rejected). Include "do nothing" if applicable.
- [ ] **When to revisit** — concrete triggers (new requirement, new tech, team change, cost change). "A new ADR is required to overturn this one" must be the last line.
- [ ] **References** — links to repo docs (`docs/...`) and external sources. Relative paths for repo links.

---

## ADR-0014 escalation triggers (if this ADR touches reusable-platform / capability-vs-operation / no-premature-abstraction)

- [ ] **Escalation triggers section** added (per `ADR-0014` §58/§59 convention) listing patterns that must stop and propose an ADR instead of silently generalizing.
- [ ] Explicitly lists **what is NOT a trigger** (to prevent the ADR from becoming a pretext for premature work).

---

## Cross-reference hygiene

- [ ] **DECISIONS.md** — new row added to `Active` table (number, title, status, date, link).
- [ ] **CHANGELOG.md** — entry under `## [Unreleased] → ### Added` with one-line summary + evidence path.
- [ ] **PROJECT_STATE.md** — relevant "What's locked" row updated or added; "What's still open" updated if a question is closed.
- [ ] **PROJECT_BACKLOG.md** — current session reflects the ADR work.
- [ ] **PROJECT_HANDOVER.md** — session entry appended (append-only).
- [ ] **Superseded/Rejected tables** — if this ADR supersedes or rejects a previous one, move the old entry and add the link.

---

## Formatting & style

- [ ] Markdown headings use `##` for top-level sections (file starts with `# ADR-NNNN: Title`).
- [ ] No trailing whitespace; LF line endings.
- [ ] No inline HTML; plain Markdown only.
- [ ] Tables use pipes (`|`) with header separator row.
- [ ] Code fences have language hints (`bash`, `ts`, `json`, etc.).
- [ ] All repo links are relative (`./ADR-0007-...md`, `../02-architecture/...`).

---

## Evidence requirement (per ADR-0013 §5, §36)

- [ ] If the decision introduces code/infra change: DoR exists, spec exists, risk classified, test strategy defined, rollback plan written.
- [ ] Evidence directory created: `docs/06-sprints/<SPRINT>/evidence/M{n}-<slug>/` with `checklist.md`, `commands.txt`, `output-*.txt`, `notes.md`.

---

## Quick self-review (answer before PR)

| Question | Yes/No |
|---|---|
| Can a future contributor understand *why* without asking the author? |  |
| Does the ADR contradict any existing binding ADR? (check `DECISIONS.md` "What's locked") |  |
| Are the consequences honest (real negatives listed, not hand-waved)? |  |
| Is the "When to revisit" specific enough to fire automatically? |  |
| Did I run `pnpm governance:validate:local`? |  |

---

## Example minimal ADR (copy-paste starter)

```markdown
# ADR-NNNN: <Title>

- **Status:** Proposed
- **Date:** 2026-07-20
- **Deciders:** <name>

---

## Context

<issue/situation>
- Forces: <constraints, requirements>
- Key terms: <definitions>
- Deadline: <date or "none">

---

## Decision

<One direct statement. One decision per ADR.>

---

## Rationale

- <Argument 1> — matters because <project-specific reason>.
- <Argument 2> — matters because <project-specific reason>.

---

## Consequences

### Positive
- ✅ ...

### Negative
- ❌ ...

### Neutral
- 🔁 ...

---

## Alternatives considered

| Option | Verdict | Why |
|---|---|---|
| <Chosen> | Accepted | <reason> |
| <Alt 1> | Rejected | <reason> |
| <Alt 2> | Rejected | <reason> |

---

## When to revisit

- <Concrete trigger 1>
- <Concrete trigger 2>
- A new ADR is required to overturn this one.

---

## References

- [`docs/...`](./...)
- <External URL>

---

## Escalation triggers

Decision §X states *<value>*; concrete patterns are matched against it. Before changing <area>, stop and propose an ADR-style alternative if the change would:

1. <Pattern 1 — the anti-pattern this ADR prevents>
2. <Pattern 2 — the anti-pattern this ADR prevents>

These are **triggers to propose, not to silently generalize**. On a trigger: do not proceed as written; do not add speculative abstraction; propose the minimal customer-agnostic alternative, record the trade-off, route through §59 → §43 (ADR) before implementation.

Two anti-patterns explicitly *not* triggers:

- <Intended work that matches the decision, not a violation>
- <Using the existing model as designed, not changing it>

---
```

---

## Where this template lives

- **Canonical**: `templates/ADR_CHECKLIST.md` (this file)
- **For new ADRs**: copy from `templates/ADR_TEMPLATE.md`, then run through this checklist before opening the PR.

---

*Append-only. Update the template when the governance process evolves (e.g. new ADR-0014 trigger pattern).*