# RISK_CLASSIFICATION.md

> **Risk matrix for ENGINEERING_PROTOCOL §42.** Classify every non-trivial implementation before coding.
>
> Last updated: 2026-07-12

---

## Risk levels

| Level | Definition | Examples |
| --- | --- | --- |
| **LOW** | Isolated change; no API, schema, auth, or infra impact | Doc fix, test addition, internal refactor within one file |
| **MEDIUM** | Multi-file change; no public contract change | Plugin-internal logic, UI copy, new internal helper |
| **HIGH** | Public API, schema, auth, dependency, or cross-package change | New API route, migration, new npm package |
| **CRITICAL** | Security, production config, destructive ops, architecture change | Auth model change, data deletion, deployment topology |

---

## Requirements by level

| Requirement | LOW | MEDIUM | HIGH | CRITICAL |
| --- | --- | --- | --- | --- |
| Definition of Ready (§39) | Optional | ✅ Required | ✅ Required | ✅ Required |
| Implementation plan | Optional | ✅ Required | ✅ Required | ✅ Required |
| Risk noted in plan | ✅ | ✅ | ✅ | ✅ |
| `pnpm verify` before commit | ✅ | ✅ | ✅ | ✅ |
| Regression test | If applicable | ✅ | ✅ | ✅ |
| Human approval (§41) | Not required | Not required | ✅ Required | ✅ Required |
| ADR or ADR check (§43) | Not required | Not required | ✅ If architectural | ✅ Required |
| Rollback documented (§55) | Not required | Optional | ✅ Required | ✅ Required |
| Rollback verified | Not required | Not required | Recommended | ✅ Required |
| Security review (§29) | If touching auth/data | If applicable | ✅ Required | ✅ Required |
| Founder sign-off before merge | Not required | Not required | Recommended | ✅ Required |

---

## Deployment strategy by level

| Level | Deployment |
| --- | --- |
| LOW | Standard commit; no special deployment steps |
| MEDIUM | Standard commit; smoke test if runtime behavior changed |
| HIGH | Staged verification; evidence in sprint `evidence/`; rollback plan tested mentally or in dev |
| CRITICAL | Explicit founder approval; rollback plan documented and verified; no production deploy without runbook |

---

## How to classify

1. Identify the **highest** applicable level from the examples above.
2. Record the level in the implementation plan or `PROJECT_BACKLOG.md`.
3. If classification is uncertain, treat as **one level higher**.
4. If **CRITICAL**, stop and obtain human approval before writing code (§59).

---

## Cross-references

- Human approval triggers: `templates/HUMAN_APPROVAL_CHECKLIST.md`
- Rule priority when risk conflicts with scope: ENGINEERING_PROTOCOL §47
