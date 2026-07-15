# ENGINEERING_PROTOCOL.md

> **Engineering Protocol** — binding governance for all architectural, implementation,
> refactoring, and deployment work. Applies to all contributors equally.
>
> **Status:** Accepted (ADR-0012, extended by ADR-0013)
> **Version:** 2.0 — 60 rules in 10 thematic chapters
> **Last updated:** 2026-07-12

---

## How to use this document

- Read after `DEVELOPMENT_GUIDE.md` when the task touches code, architecture, infrastructure, or deployment.
- For sprint work, also read the active sprint plan under `docs/06-sprints/`.
- A condensed subset lives at `docs/03-development/ENGINEERING_PROTOCOL.md`.
- Quality gate commands: [`QUALITY_GATES.md`](./QUALITY_GATES.md)
- Risk levels: [`RISK_CLASSIFICATION.md`](./RISK_CLASSIFICATION.md)

**Rule numbering is stable.** Rules §1–§38 are unchanged. Rules §39–§60 extend the protocol.
When rules overlap thematically, each numbered rule remains authoritative.

---

## Table of contents

| Chapter | Topic | Rules |
| --- | --- | --- |
| 1 | [Repository & Context](#chapter-1-repository--context) | §1, §7, §8, §48, §57 |
| 2 | [Planning & Specification](#chapter-2-planning--specification) | §19, §21, §39, §40, §46 |
| 3 | [Architecture & ADR Governance](#chapter-3-architecture--adr-governance) | §4, §43, §47 |
| 4 | [Milestone & Scope Execution](#chapter-4-milestone--scope-execution) | §2, §16 |
| 5 | [Implementation Rules](#chapter-5-implementation-rules) | §17, §22, §23, §44, §59 |
| 6 | [Refactoring & Debugging](#chapter-6-refactoring--debugging) | §3, §10, §11, §51 |
| 7 | [Quality & Verification](#chapter-7-quality--verification) | §5, §6, §20, §45, §60 |
| 8 | [Security & Risk](#chapter-8-security--risk) | §12, §29, §41, §42 |
| 9 | [Dependencies, Observability & Performance](#chapter-9-dependencies-observability--performance) | §24, §27, §28, §53, §54 |
| 10 | [Contracts, Rollback & Release Engineering](#chapter-10-contracts-rollback--release-engineering) | §25, §26, §30, §55, §14, §31, §32, §52 |
| 11 | [Root Cause, Assumptions & Evidence](#chapter-11-root-cause-assumptions--evidence) | §33, §35, §49, §50, §34, §36, §56 |
| 12 | [Documentation & Decisions](#chapter-12-documentation--decisions) | §9, §13, §15 |
| 13 | [Contributor Governance](#chapter-13-contributor-governance) | §18, §38, §58 |

---

## Rule priority (§47)

When rules conflict, apply this precedence (highest first):

| Priority | Source |
| --- | --- |
| 1 | **Security** (§12, §29, §41 security items) |
| 2 | **Human approval** (§41) |
| 3 | **Accepted ADRs** (§43) |
| 4 | **Engineering Protocol** (this document) |
| 5 | **Repository documentation** (bootstrap, sprint, architecture docs) |
| 6 | **Sprint / milestone scope** (§2) |
| 7 | **Implementation preference** (contributor or agent judgment) |

Lower-priority rules must **never** override higher-priority ones.

---

## Chapter 1: Repository & Context

### §1. Repository-driven decision making

Before any decision, read repository artifacts **in this order**:

| # | Artifact | Path |
| --- | --- | --- |
| 1 | Development router | `DEVELOPMENT_GUIDE.md` |
| 2 | Current snapshot | `docs/00-bootstrap/PROJECT_STATE.md` |
| 3 | Current session task | `docs/00-bootstrap/PROJECT_BACKLOG.md` *(formerly `NEXT_SESSION.md`)* |
| 4 | Active sprint | `docs/06-sprints/SPRINT-NNN-*/` |
| 5 | Binding decisions | Relevant ADRs in `docs/05-decisions/` |
| 6 | Related source | Only files directly tied to the task |

Never assume architecture from memory or prior sessions. When documentation and code disagree, see **§57**.

### §7. Limit contextual scope

- Decompose large tasks into independent phases.
- Load only files and modules directly related to the current phase.
- Do not retain unnecessary context across phases.

### §8. Efficient codebase navigation

- Read only task-relevant source files.
- Reuse validated information from earlier reads in the same session.
- Do not reread the entire repository unless a substantial technical change justifies it.

### §48. Context budget

For large repositories, never load unnecessary files. Preferred workflow:

```
Search → Read → Plan → Implement → Verify → Unload unnecessary context
```

Keep only task-relevant context active. Complements §7 and §8.

### §57. Repository as source of truth

If documentation and implementation disagree:

1. Treat **implementation (code)** as authoritative until verified.
2. Identify the discrepancy.
3. Determine the correct source of truth.
4. Update the incorrect artifact.
5. Record the change in `PROJECT_HANDOVER.md` or sprint `notes.md`.

Never ignore inconsistencies. (Supersedes the wording of §37; §37 remains listed for backward compatibility — both refer to the same policy.)

---

## Chapter 2: Planning & Specification

### §19. Planning before coding (mandatory)

For any task expected to modify **multiple files**, **public APIs**, **infrastructure**, or **architecture**:

**Before writing code:**

1. Explore relevant code (minimal scope)
2. Identify affected modules
3. Define acceptance criteria (see **§21**)
4. Identify risks (classify per **§42**)
5. Produce a short implementation plan (`templates/IMPLEMENTATION_PLAN.md`)

Do not implement until the plan is internally consistent.

**Complex work cycle:**

```
Explore → Plan → Review Plan → Implement → Verify → Document → Commit
```

### §21. Acceptance criteria first

Before implementation, explicitly identify:

- Expected behavior
- Non-goals
- Constraints
- Edge cases
- Failure scenarios

Never implement ambiguous requirements. Ask questions first.

### §39. Definition of ready (mandatory)

Before implementation begins, every **non-trivial** task must satisfy a Definition of Ready (DoR).

A task is **Ready** only if it includes:

| Field | Required |
| --- | --- |
| Clear objective | ✅ |
| Business or technical motivation | ✅ |
| Acceptance criteria | ✅ |
| Explicit constraints | ✅ |
| Dependencies | ✅ |
| Known risks | ✅ |
| Expected deliverables | ✅ |
| Owner (if applicable) | ✅ |
| Priority | ✅ |
| Success metrics | ✅ |

If the task is **not Ready**: **STOP.** Clarify requirements before implementation.

Template: `templates/DEFINITION_OF_READY.md`

### §40. Specification first workflow

Implementation must **never** begin directly from a prompt.

Required workflow:

```
Requirements
  ↓
Clarification
  ↓
Acceptance Criteria
  ↓
Technical Plan
  ↓
Implementation Tasks
  ↓
Implementation
  ↓
Verification
  ↓
Documentation
  ↓
Commit
  ↓
Handover
```

For complex work, the **specification is the source of truth**. Implementation follows the specification — not the other way around. Aligns with Spec-Driven Development practice.

### §46. Success metrics

Every milestone must define measurable success:

- Expected outputs
- Acceptance criteria
- Verification method
- Completion evidence

A task without measurable success criteria is **incomplete**.

---

## Chapter 3: Architecture & ADR Governance

### §4. Safeguard architectural boundaries

Do **not** alter without an explicit ADR:

- Public architecture or API contracts
- Package / module boundaries
- Plugin interfaces
- ADR-resolved decisions
- Core folder structures (`apps/`, `packages/core/`, `packages/plugins/`, `packages/contracts/`)

### §43. ADR enforcement

ADR compliance is **mandatory**.

If implementation conflicts with an **accepted** ADR:

1. **STOP.**
2. Do **not** implement the conflicting change.
3. Create a new ADR or supersede the existing ADR before proceeding.

Architectural decisions must never be silently violated.

### §47. Rule priority

See [Rule priority (§47)](#rule-priority-47) at the top of this document.

---

## Chapter 4: Milestone & Scope Execution

### §2. Focused milestone execution

- Work **only** within the current milestone scope (see active sprint or `PROJECT_BACKLOG.md`).
- If blocked, **stop** and document in `PROJECT_BACKLOG.md`:
  - The precise blocker
  - Why work cannot proceed
  - The smallest feasible unblock path
- Do not advance to future milestones or tasks prematurely.

### §16. Context preservation for handover

At the end of every session, update:

| Artifact | Purpose |
| --- | --- |
| `PROJECT_STATE.md` | Phase, milestone, blockers |
| `PROJECT_BACKLOG.md` | Next concrete task |
| `CHANGELOG.md` | Notable changes |
| `PROJECT_HANDOVER.md` | Session log (append-only) |
| Sprint evidence | Per-milestone proof |
| Sprint / issue status | When applicable |

Use `templates/HANDOFF_TEMPLATE.md` for handover entries.

---

## Chapter 5: Implementation Rules

### §17. Engineering priorities

Prioritize **correctness, clarity, and maintainability** over premature optimization, cleverness, or over-engineering. Advance incrementally.

Aligns with `docs/00-bootstrap/PROJECT_PRINCIPLES.md` (simplicity over premature extensibility).

### §22. Human review mindset

Treat every implementation as if a senior engineer will review it. Optimize for readability, explicitness, maintainability, and consistency with existing code. Never optimize for impressiveness.

See also **§45** (code review checklist).

### §23. Existing patterns first

Before introducing a new abstraction, library, helper, architecture, or utility:

1. Search the repository for an equivalent pattern.
2. Reuse it if it exists.
3. Avoid duplicate implementations.

### §44. Repository pattern reuse

Before introducing a helper, utility, abstraction, service, wrapper, component, or architecture pattern:

1. **Search the repository.**
2. If an equivalent solution exists → **reuse it.**
3. Avoid duplicate abstractions.

Extends §23 with explicit coverage of services, wrappers, and components.

### §59. Governance before generation

Before any code generation, ensure:

- [ ] Repository constraints are loaded (§1)
- [ ] Relevant ADRs are understood (§43)
- [ ] Specification is approved (§40)
- [ ] Acceptance criteria are defined (§21)
- [ ] Risk level is identified (§42)
- [ ] Human approvals obtained if required (§41)
- [ ] Definition of Ready satisfied for non-trivial work (§39)

**Governance always precedes generation.**

---

## Chapter 6: Refactoring & Debugging

### §3. Incremental refactoring only

Large refactors require a written plan (see `templates/IMPLEMENTATION_PLAN.md`) with:

- Clear phases
- Estimated impacted files and risk per phase
- Verification after each phase before continuing

**Forbidden:** repository-wide, all-encompassing refactors in a single step.

### §10. Controlled refactoring process

**Before refactoring**, document: motivation, estimated impact, migration risks.

**After refactoring:** re-verify behavior, re-run `pnpm verify`, update documentation.

### §11. Structured debugging workflow

For non-trivial bugs:

```
Plan → Hypothesis → Verify → Targeted fix → Regression test → Quality gates → Commit
```

Never ship speculative or unverified fixes.

### §51. Blast radius minimization

Every change should affect the smallest possible surface area. Avoid:

- Unrelated edits
- Opportunistic refactoring
- Unnecessary formatting changes
- Wide-ranging modifications outside approved scope

Minimize review complexity. Reinforces §34.

---

## Chapter 7: Quality & Verification

### §5. Evidence-based completion

A milestone or task is incomplete without verifiable evidence:

- Commands run (exact invocations)
- Captured outputs (test, lint, typecheck, build, runtime)
- Updated documentation
- Evidence files in sprint `evidence/M{n}-*/` when applicable

See `templates/DEFINITION_OF_DONE.md` and **§60**.

### §6. Mandatory quality gates

Before **every commit**, all gates in [`QUALITY_GATES.md`](./QUALITY_GATES.md) must pass:

```bash
pnpm verify   # lint → typecheck → test → build
```

If any gate fails, **halt** and fix before committing.

### §20. Definition of done

A task is **done** only when **all** of the following are true:

- [ ] Acceptance criteria satisfied (§21)
- [ ] No failing tests; no skipped required tests
- [ ] Lint clean (`pnpm lint`)
- [ ] Typecheck clean (`pnpm typecheck`)
- [ ] Production build successful (`pnpm build`)
- [ ] Documentation updated (§13)
- [ ] ADR updated or created if required (§43)
- [ ] `CHANGELOG.md` updated
- [ ] Rollback path identified (§30, §55)
- [ ] Evidence recorded (§5, §36)

If any item is missing, the task is **not done**.

Full checklist: `templates/DEFINITION_OF_DONE.md`. See also **§60**.

### §45. Code review checklist

Before merge, verify:

- [ ] Readability
- [ ] Consistency with existing code
- [ ] Naming clarity
- [ ] Duplication minimized
- [ ] Complexity appropriate
- [ ] Error handling adequate
- [ ] Security reviewed (§29)
- [ ] Test quality adequate
- [ ] Documentation updated (§13)
- [ ] Architectural compliance (§4, §43)
- [ ] Backward compatibility preserved (§25)

Treat every change as if a senior engineer will review it (§22).

### §60. Verification before completion

A task is **complete** only if **all** of the following are satisfied:

| Gate | Rule |
| --- | --- |
| Definition of Ready was satisfied | §39 |
| Definition of Done is satisfied | §20 |
| Acceptance criteria verified | §21 |
| Quality gates passed | §6 |
| Documentation updated | §13 |
| Evidence attached | §5, §36 |
| Rollback documented | §30, §55 |
| Context preserved | §16 |
| Handover completed | §16 |

Otherwise: the task remains **In Progress**.

---

## Chapter 8: Security & Risk

### §12. Security first

Never compromise validation, authentication, authorization, or secret management.

**Forbidden:** hardcoded secrets, auth bypasses, temporary security relaxations for convenience.

See **§29** for the security review checklist.

### §29. Security review checklist

For features affecting security, review:

- [ ] Authentication
- [ ] Authorization
- [ ] Validation
- [ ] Input sanitization
- [ ] Secrets handling
- [ ] Permissions
- [ ] Dependency vulnerabilities
- [ ] Injection risks

Security regressions are **blockers** (priority 1 per §47).

### §41. Human approval matrix

Require **explicit human approval** before:

| Action | Approval required |
| --- | --- |
| Deleting files | ✅ |
| Deleting large code sections | ✅ |
| Changing public APIs | ✅ |
| Changing architecture | ✅ |
| Modifying ADR-governed components | ✅ |
| Changing authentication or authorization | ✅ |
| Adding or removing dependencies | ✅ |
| Database migrations | ✅ |
| Infrastructure changes | ✅ |
| Deployment configuration | ✅ |
| Production configuration | ✅ |
| Security-related changes | ✅ |
| Licensing changes | ✅ |
| Destructive operations | ✅ |

**Never assume approval.** When in doubt, ask the founder.

Template reference: `templates/HUMAN_APPROVAL_CHECKLIST.md`

### §42. Risk classification

Every implementation should classify risk: **LOW**, **MEDIUM**, **HIGH**, or **CRITICAL**.

Each level defines required review, testing, approval, rollback, and deployment strategy.
Higher risk requires stricter validation.

Full matrix: [`RISK_CLASSIFICATION.md`](./RISK_CLASSIFICATION.md)

---

## Chapter 9: Dependencies, Observability & Performance

### §24. Dependency management

Do not introduce new dependencies unless necessary. For each new dependency, document: why needed, alternatives, maintenance status, security implications, bundle/runtime impact.

Prefer existing project dependencies. New deps on the critical path require an ADR or sprint `notes.md` entry.

See also **§53**.

### §27. Observability

Meaningful features must preserve or improve observability. Do not reduce existing observability.

See also **§54**.

### §28. Performance validation

Do not optimize on assumptions. Measure baseline → implement → measure again → record methodology.

**No benchmark → no performance claim.**

### §53. Dependency governance

Before introducing a dependency, document:

- Purpose
- Alternatives considered
- Maintenance status
- Security implications
- License compatibility (see `ARCHITECTURE_CONSTRAINTS.md` C7)
- Runtime impact
- Bundle size impact

Prefer existing project dependencies whenever feasible. Extends §24.

### §54. Observability

Do not reduce observability. New features should preserve or improve: logging, metrics, tracing, diagnostics, error reporting, monitoring.

Debugging should become easier — not harder. Reinforces §27.

---

## Chapter 10: Contracts, Rollback & Release Engineering

### §25. API and contract stability

Before changing public APIs, exported interfaces, database schema, configuration, or CLI behavior, identify: backward compatibility, migration strategy, affected consumers, rollback strategy.

Never introduce breaking changes silently. Requires human approval (§41).

### §26. Database and migration rules

For schema changes, always provide: forward migration, rollback migration (when feasible), data migration strategy, compatibility considerations.

Never perform destructive migrations without explicit founder approval (§41).

### §30. Rollback strategy

Every non-trivial change must define: rollback method, recovery procedure, affected systems, data recovery considerations.

See also **§55**.

### §55. Rollback strategy

Every non-trivial implementation must define:

- Rollback method
- Rollback verification (how to confirm rollback succeeded)
- Recovery procedure
- Affected systems
- Data recovery considerations

No deployment or migration is complete without a rollback plan. Extends §30.

### §14. Disciplined version control

- One logical change per commit.
- Every commit includes: plan summary, implementation description, verification evidence, documentation updates.
- **Forbidden:** mixed or ambiguous commits.
- Use [Conventional Commits](https://www.conventionalcommits.org/).

### §31. Reproducibility

Builds and tests must be reproducible. Avoid machine-specific assumptions, undocumented env vars, hidden local config, manual-only build steps.

Document prerequisites in `TECH_STACK.md` and `.env.example` files.

### §32. CI/CD alignment

Local verification must match CI: `pnpm verify`. See [`QUALITY_GATES.md`](./QUALITY_GATES.md).

### §52. Reproducible engineering

All builds, tests, and verification steps must be reproducible. Avoid undocumented local configuration, machine-specific assumptions, hidden environment variables, manual-only build steps.

Document prerequisites. Local verification should match CI whenever possible. Reinforces §31 and §32.

---

## Chapter 11: Root Cause, Assumptions & Evidence

### §33. Root cause over symptom

Fix root causes. Symptom-based patches allowed only when documented as **temporary**, with reason, limitations, and follow-up in `PROJECT_BACKLOG.md`.

See also **§50**.

### §35. No silent assumptions

Document assumptions that affect implementation: environment, platform, API, business rules.

Undocumented assumptions become technical debt. Record in plan, ADR, or sprint `notes.md`.

See also **§49**.

### §49. Assumption management

Never implement based on undocumented assumptions. Whenever an assumption influences implementation, **document it**:

- Platform assumptions
- Environment assumptions
- API assumptions
- Infrastructure assumptions
- Business assumptions

Undocumented assumptions become technical debt. Extends §35.

### §50. Root cause policy

Always prioritize fixing root causes. Temporary workarounds allowed only when explicitly documented with:

- Justification
- Known limitations
- Follow-up task (in `PROJECT_BACKLOG.md`)
- Removal plan

Avoid symptom-based fixes whenever practical. Extends §33.

### §34. Minimize blast radius

Every change should affect the smallest possible surface. Avoid touching unrelated files. Prefer isolated, reviewable diffs.

See also **§51**.

### §36. Evidence hierarchy

When judging completion, prefer evidence in this order:

1. Automated tests
2. CI results
3. Runtime verification
4. Logs
5. Manual testing

Manual testing alone is insufficient when automated verification is possible.

### §56. Evidence hierarchy

Evidence should be collected in the following priority:

1. Automated tests
2. CI results
3. Runtime verification
4. Logs
5. Manual testing

Manual verification alone is insufficient when automation is possible. Restates §36 for v2 emphasis.

---

## Chapter 12: Documentation & Decisions

### §9. Transparent technical decisions

For every **significant** technical decision, document alternatives, trade-offs, and recommendation.

Binding decisions → new ADR. Non-binding → sprint `notes.md` or handover.

### §13. Documentation obligation

When any architectural or structural change is made, **immediately** update all related documentation.

Minimum per work cycle: `PROJECT_BACKLOG.md`, `PROJECT_STATE.md` (if needed), `PROJECT_HANDOVER.md`, `CHANGELOG.md`, sprint evidence.

### §15. Escalation when uncertain

If confidence drops **below 90%**, **stop** and seek clarification. Never proceed on guesswork.

---

## Chapter 13: Contributor Governance

### §18. Professional AI usage

Contributors must **not** introduce automated signatures, filler comments, distinctive naming styles, invented APIs/config/files, or auto-generated commit messages.

Write to senior-engineer standard. When uncertain: read, search, ask.

### §38. contributor constraints

Contributors must **not**:

- Invent APIs, configuration, files, architecture, framework capabilities, dependencies, or conventions
- Skip the read order in **§1**
- Commit without passing quality gates
- Advance milestones while blocked

When uncertain: **read → search → ask**.

### §58. contributor constraints

Contributors must **not**:

- Invent APIs, configuration, architecture, dependencies, framework capabilities, project conventions, or undocumented behavior

When uncertain: **Read. Search. Verify. Ask.** Never hallucinate implementation details.

Extends §38 with explicit "verify" step and undocumented-behavior prohibition.

---

## Legacy rule index (§37)

### §37. Repository as source of truth (legacy)

If documentation conflicts with code:

1. Treat **code as authoritative** until verified.
2. Determine which artifact is outdated.
3. Update the incorrect artifact.
4. Record the discrepancy in `PROJECT_HANDOVER.md` or sprint `notes.md`.

Never ignore inconsistencies. **Functionally equivalent to §57** — retained for backward compatibility with ADR-0012 and session references.

---

## Cross-references

| Topic | Document |
| --- | --- |
| Product principles | `docs/00-bootstrap/PROJECT_PRINCIPLES.md` |
| Architecture limits | `docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md` |
| Tech stack & CI | `docs/03-development/TECH_STACK.md` |
| Quality gate commands | `docs/03-development/QUALITY_GATES.md` |
| Session + CI checklist | `docs/03-development/GOVERNANCE_CHECKLIST.md` |
| Risk classification matrix | `docs/03-development/RISK_CLASSIFICATION.md` |
| ADR index | `docs/05-decisions/DECISIONS.md` |
| Definition of ready | `templates/DEFINITION_OF_READY.md` |
| Implementation plan | `templates/IMPLEMENTATION_PLAN.md` |
| Definition of done | `templates/DEFINITION_OF_DONE.md` |
| Human approval checklist | `templates/HUMAN_APPROVAL_CHECKLIST.md` |
| Binding decisions | ADR-0012, ADR-0013 |
