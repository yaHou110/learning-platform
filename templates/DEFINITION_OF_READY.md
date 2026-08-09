# DEFINITION_OF_READY.md

> **Checklist for ENGINEERING_PROTOCOL §39.** Complete before starting any non-trivial task.

---

```markdown
# Definition of Ready — <task title>

- **Task ID / session:** …
- **Date:** YYYY-MM-DD
- **Owner:** <name>
- **Risk level:** LOW | MEDIUM | HIGH | CRITICAL (see RISK_CLASSIFICATION.md)
- **Status:** ☐ Not ready | ☑ Ready

---

## Objective

<One clear sentence: what will be delivered.>

---

## Motivation

<Business or technical reason this work is needed.>

---

## Acceptance criteria

- [ ] Expected behavior defined
- [ ] Non-goals listed
- [ ] Constraints documented
- [ ] Edge cases identified
- [ ] Failure scenarios identified

**Criteria:**
1. …
2. …

---

## Dependencies

| Dependency | Status | Blocker? |
| --- | --- | --- |
| … | ready / pending | yes / no |

---

## Known risks

| Risk | Level | Mitigation |
| --- | --- | --- |
| … | LOW/MEDIUM/HIGH/CRITICAL | … |

---

## Expected deliverables

- [ ] …
- [ ] …

---

## Priority

P0 (critical) | P1 (high) | P2 (normal) | P3 (low)

**Rationale:** …

---

## Success metrics (§46)

| Metric | Target | Verification method |
| --- | --- | --- |
| … | … | … |

---

## Human approval required? (§41)

- [ ] No
- [ ] Yes — obtained from: …
- [ ] Pending — STOP until approved

---

## Specification reference (§40)

- Plan: `templates/IMPLEMENTATION_PLAN.md` or link to spec
- ADR compliance checked: ☐ yes ☐ N/A

---

## Ready gate

**All required fields complete:** ☐ No → STOP | ☑ Yes → proceed to implementation
```
