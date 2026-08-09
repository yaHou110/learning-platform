# DEFINITION_OF_DONE.md

> **Checklist for ENGINEERING_PROTOCOL §20 and §60.** Copy into sprint evidence or PR description.

---

```markdown
# Definition of Done — <task or milestone>

- **Task:** …
- **Date completed:** YYYY-MM-DD
- **Verifier:** <name>
- **Risk level:** LOW | MEDIUM | HIGH | CRITICAL

---

## Definition of Ready (§39) — non-trivial tasks

- [ ] DoR was satisfied before implementation began
- [ ] Specification/plan was approved (§40)

---

## Acceptance criteria (§21)

- [ ] Expected behavior verified
- [ ] Non-goals respected
- [ ] Constraints honored
- [ ] Edge cases tested or documented
- [ ] Failure scenarios handled

---

## Quality gates (§6)

- [ ] `pnpm lint` — exit 0
- [ ] `pnpm typecheck` — exit 0
- [ ] `pnpm test` — exit 0, no skipped required tests
- [ ] `pnpm build` — exit 0
- [ ] `pnpm verify` — all gates pass

**Evidence:** `<path to output files or commit sha>`

---

## Documentation (§13)

- [ ] `PROJECT_BACKLOG.md` updated
- [ ] `PROJECT_STATE.md` updated (if milestone/phase changed)
- [ ] `PROJECT_HANDOVER.md` appended (non-trivial work)
- [ ] `CHANGELOG.md` updated
- [ ] ADR created/updated (if binding decision)
- [ ] Sprint evidence files complete (if in sprint)

---

## Security (§29) — when applicable

- [ ] Auth / authz reviewed
- [ ] Validation and sanitization reviewed
- [ ] No secrets in code
- [ ] No security regressions

---

## Rollback (§30, §55) — non-trivial changes

- [ ] Rollback method documented
- [ ] Rollback verification documented
- [ ] Recovery procedure documented
- [ ] Affected systems listed
- [ ] Data recovery considered

---

## Verification before completion (§60)

- [ ] All §20 items satisfied
- [ ] Acceptance criteria verified with evidence
- [ ] Context preserved (`PROJECT_STATE`, `PROJECT_BACKLOG`)
- [ ] Handover appended (`PROJECT_HANDOVER.md`)

---

## Sign-off

**Status:** ☐ Not done | ☑ Done

**Notes:** …
```
