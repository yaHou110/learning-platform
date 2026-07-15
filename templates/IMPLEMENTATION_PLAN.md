# IMPLEMENTATION_PLAN.md

> **Template for ENGINEERING_PROTOCOL §19.** Copy into sprint evidence or session notes before multi-file / architectural work.

---

```markdown
# Implementation Plan — <short title>

- **Date:** YYYY-MM-DD
- **Author:** <name or agent>
- **Sprint / milestone:** SPRINT-NNN / M{n} (or "none")
- **Risk level:** LOW | MEDIUM | HIGH | CRITICAL (see `docs/03-development/RISK_CLASSIFICATION.md`)
- **Status:** Draft | Approved | Complete
- **Human approval:** ☐ Not required | ☐ Required — obtained | ☐ Pending — STOP

---

## Definition of Ready (§39)

Confirm DoR fields are complete (`templates/DEFINITION_OF_READY.md`) before proceeding.

---

## Goal

<One sentence: what this plan achieves.>

---

## Acceptance criteria (§21)

### Expected behavior
- …

### Non-goals
- …

### Constraints
- …

### Edge cases
- …

### Failure scenarios
- …

---

## Affected modules

| Path | Change type | Risk |
| --- | --- | --- |
| `apps/web/...` | modify | low / medium / high |
| `packages/core/...` | modify | … |

---

## Alternatives considered (§9)

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| A | … | … | chosen / rejected |
| B | … | … | … |

**Recommendation:** …

---

## Phases (§3)

### Phase 1 — <title>
- **Files:** ~N
- **Risk:** low / medium / high
- **Steps:** …
- **Verify:** `pnpm verify` + …

### Phase 2 — <title>
- …

---

## Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| … | … | … | … |

---

## Rollback (§30)

- **Method:** …
- **Affected systems:** …
- **Data recovery:** …

---

## Assumptions (§35)

- …

---

## Documentation updates required (§13)

- [ ] `PROJECT_BACKLOG.md`
- [ ] `PROJECT_STATE.md`
- [ ] `PROJECT_HANDOVER.md`
- [ ] `CHANGELOG.md`
- [ ] ADR (if binding decision)
- [ ] Sprint evidence

---

## Definition of done (§20)

See `templates/DEFINITION_OF_DONE.md`.
```
