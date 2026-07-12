## Summary

<!-- Describe the change in 1–3 sentences. -->

---

## Governance (mandatory — CI enforced)

> Incomplete sections **block merge**. See [`docs/03-development/GOVERNANCE_CHECKLIST.md`](../docs/03-development/GOVERNANCE_CHECKLIST.md).
> CI runs `pnpm verify` + `pnpm governance:validate`.

### Risk Classification

<!-- governance:section:risk -->

**Level:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`

_Risk matrix: [`docs/03-development/RISK_CLASSIFICATION.md`](../docs/03-development/RISK_CLASSIFICATION.md)_

---

### Definition of Ready

<!-- governance:section:dor -->

- [ ] Clear objective documented
- [ ] Acceptance criteria defined
- [ ] Dependencies identified
- [ ] Risks identified
- [ ] Success metrics defined
- [ ] DoR waived — LOW risk _(check instead of above five for doc-only / single-file LOW risk)_

---

### Definition of Done

<!-- governance:section:dod -->

- [ ] Acceptance criteria verified
- [ ] `pnpm verify` passed
- [ ] Documentation updated
- [ ] Evidence attached
- [ ] Rollback documented (if non-trivial)

---

### ADR References

<!-- governance:section:adr -->

- **Required:** `yes` | `no` _(CI auto-detects architecture path changes)_
- **References:** `ADR-0003`, `ADR-0006` _(or `N/A — no architectural impact`)_
- **Compliance:** Implementation does not violate any Accepted ADR (§43)

---

### Rollback Plan

<!-- governance:section:rollback -->

_Describe revert method, affected systems, and data recovery. Required substantive content for HIGH/CRITICAL._

---

### Evidence

<!-- governance:section:evidence -->

_Commands run, CI links, test output paths, or sprint evidence directory._

```text
pnpm verify → exit 0
```

---

## Test plan

- [ ] …

---

## Related issues

Closes #
