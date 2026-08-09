# ADR-0012: Mandatory engineering protocol

- **Status:** Accepted
- **Date:** 2026-07-12
- **Deciders:** Founder

---

## Context

The repository already enforces discipline through:

- ADR-0002 (portable documentation)
- SPRINT-001 operating cycle (plan → implement → verify → document → commit)
- Per-milestone evidence requirements
- Hard rules in `DEVELOPMENT_GUIDE.md`

However, these rules were scattered across sprint docs, bootstrap files, and implicit contributor behavior. Contributors and Contributors lacked a **single binding reference** covering:

- Repository read order before decisions
- Mandatory quality gates before commit
- Definition of done
- Planning-before-coding for multi-file work
- Security, rollback, and evidence requirements
- AI-specific constraints (no invented APIs, no guesswork)

The founder requested a comprehensive, mandatory protocol (38 rules + planning / DoD extensions) to improve execution discipline, maintainability, and context integrity across all engineering work.

---

## Decision

**We adopt a formal Engineering Protocol as binding process documentation:**

1. **Canonical document:** `docs/03-development/ENGINEERING_PROTOCOL.md` — all 38 rules plus §19–§38 extensions.
2. **Quality gates reference:** `docs/03-development/QUALITY_GATES.md` — exact commands and CI alignment.
3. **Automation:** Root `pnpm verify` script and `scripts/quality-gates.{ps1,sh}` run lint → typecheck → test → build.
4. **Templates:** `templates/IMPLEMENTATION_PLAN.md`, `templates/DEFINITION_OF_DONE.md`.
5. **canonical reference:** `docs/03-development/ENGINEERING_PROTOCOL.md` (`always available`) — condensed rules pointing at the canonical doc.
6. **Router update:** `DEVELOPMENT_GUIDE.md` references the protocol without exceeding the 100-line router limit.

This ADR does **not** change product architecture, plugin boundaries, or technology choices. It codifies **how** work is performed.

---

## Rationale

### 1. Single source of truth for process

Scattered rules rot and are skipped under time pressure. One indexed document with cross-links to bootstrap files, sprints, and ADRs reduces ambiguity.

### 2. Aligns with ADR-0002 without context bloat

ADR-0002 rejects oversized router files. The full protocol lives in `docs/03-development/` (~500 lines). `DEVELOPMENT_GUIDE.md` and protocol rules stay small and point downward on demand.

### 3. Evidence and quality gates are enforceable

SPRINT-001 already required evidence; this ADR makes `pnpm verify` the standard pre-commit gate and documents CI alignment for M3.

### 4. contributor constraints are explicit

Rules §38 and §18 prevent hallucinated APIs, configs, and silent architectural drift — a known failure mode for agentic development.

---

## Consequences

### Positive

- ✅ One checklist for all contributors
- ✅ Reproducible local verification via `pnpm verify`
- ✅ Clear escalation rule (confidence < 90% → stop)
- ✅ Templates reduce ad-hoc planning quality variance

### Negative

- ❌ Slightly more documentation overhead per session
- ❌ Contributors must read an additional doc for code tasks

### Neutral

- 🔁 Existing sprint evidence structure unchanged; protocol references it
- 🔁 `PROJECT_BACKLOG.md` remains the session task file (formerly `NEXT_SESSION.md`)

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Embed all rules in `DEVELOPMENT_GUIDE.md`** | Rejected | Violates ADR-0002 router size limit; causes context bloat |
| **protocol rules only, no repo doc** | Rejected | Not tool-portable; violates portable docs principle |
| **Sprint-only rules in SPRINT-001** | Rejected | Does not apply post-sprint or to non-sprint work |
| **Full protocol doc + thin router + protocol rule (chosen)** | Accepted | Portable, enforceable, ADR-0002 compliant |

---

## When to revisit

- CI pipeline changes materially (new gates, different test runner)
- Team grows beyond single-founder model and needs PR review workflow ADR
- A standard supersedes the current quality gate sequence

A new ADR is required to overturn this one.

---

## References

- [`docs/03-development/ENGINEERING_PROTOCOL.md`](../03-development/ENGINEERING_PROTOCOL.md)
- [`docs/03-development/QUALITY_GATES.md`](../03-development/QUALITY_GATES.md)
- [`ADR-0002`](./ADR-0002-operating-manual.md)
- [`docs/06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
