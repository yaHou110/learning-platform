# HUMAN_APPROVAL_CHECKLIST.md

> **Checklist for ENGINEERING_PROTOCOL §41.** Explicit founder approval before high-impact actions.

---

```markdown
# Human Approval Request — <short title>

- **Date:** YYYY-MM-DD
- **Requester:** <name>
- **Risk level:** LOW | MEDIUM | HIGH | CRITICAL

---

## Action requested

<Describe exactly what will be done.>

---

## Trigger category (§41)

Check all that apply:

- [ ] Deleting files
- [ ] Deleting large code sections
- [ ] Changing public APIs
- [ ] Changing architecture
- [ ] Modifying ADR-governed components
- [ ] Changing authentication or authorization
- [ ] Adding or removing dependencies
- [ ] Database migrations
- [ ] Infrastructure changes
- [ ] Deployment configuration
- [ ] Production configuration
- [ ] Security-related changes
- [ ] Licensing changes
- [ ] Destructive operations

---

## Impact summary

| Area | Impact |
| --- | --- |
| Files affected | … |
| APIs affected | … |
| Data affected | … |
| Rollback plan | … |

---

## Alternatives considered

| Option | Verdict |
| --- | --- |
| … | … |

---

## Approval

- [ ] **Approved** by: _____________ Date: _______
- [ ] **Rejected** — reason: …
- [ ] **Pending** — do NOT proceed

> Never assume approval. If pending, task status = blocked.
```
