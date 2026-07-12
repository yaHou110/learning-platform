# GOVERNANCE_CHECKLIST.md

> **Executable session checklist.** Complete for every implementation session (human or AI agent).
> CI enforces PR sections via `.github/workflows/governance.yml` + `pnpm governance:validate`.
>
> Last updated: 2026-07-12

---

## When to use

- Start of session: **Before** writing code
- End of session: **Before** opening or updating a PR
- Copy into sprint evidence as `governance-checklist.md` when applicable

---

## Phase A — Before implementation

### A1. Context loaded (§1)

- [ ] Read `DEVELOPMENT_GUIDE.md`
- [ ] Read `docs/00-bootstrap/PROJECT_STATE.md`
- [ ] Read `docs/00-bootstrap/PROJECT_BACKLOG.md`
- [ ] Read active sprint doc (if applicable)
- [ ] Read relevant ADRs in `docs/05-decisions/`

### A2. Definition of Ready (§39)

- [ ] Clear objective
- [ ] Business or technical motivation
- [ ] Acceptance criteria (§21)
- [ ] Explicit constraints
- [ ] Dependencies identified
- [ ] Known risks listed
- [ ] Expected deliverables
- [ ] Owner assigned (if applicable)
- [ ] Priority set
- [ ] Success metrics defined (§46)

Template: `templates/DEFINITION_OF_READY.md`

### A3. Specification first (§40)

- [ ] Requirements clarified (not coding from raw prompt)
- [ ] Technical plan written (`templates/IMPLEMENTATION_PLAN.md`)
- [ ] Risk classified: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- [ ] Human approval obtained if HIGH/CRITICAL or §41 triggers (`templates/HUMAN_APPROVAL_CHECKLIST.md`)

### A4. ADR compliance (§43)

- [ ] Checked Accepted ADRs for conflicts
- [ ] If conflict → STOP, new ADR required
- [ ] If architecture change → ADR reference or new ADR planned

---

## Phase B — During implementation

### B1. Governance before generation (§59)

- [ ] Repository constraints loaded
- [ ] No invented APIs, config, or dependencies (§58)
- [ ] Smallest change that works (§51, §34)

### B2. Quality discipline

- [ ] Run `pnpm verify` before each commit
- [ ] One logical change per commit (§14)

---

## Phase C — Before PR / session end

### C1. Definition of Done (§20, §60)

- [ ] Acceptance criteria verified
- [ ] `pnpm verify` passed locally
- [ ] Documentation updated (`PROJECT_BACKLOG`, `HANDOVER`, `CHANGELOG` as needed)
- [ ] Evidence recorded (commands, outputs, paths)
- [ ] Rollback plan documented (non-trivial / HIGH+)

Template: `templates/DEFINITION_OF_DONE.md`

### C2. PR governance (CI enforced)

Fill `.github/pull_request_template.md` completely:

- [ ] Risk Classification level set
- [ ] Definition of Ready checkboxes complete (or LOW waiver)
- [ ] Definition of Done checkboxes complete
- [ ] ADR References complete
- [ ] Rollback Plan complete
- [ ] Evidence section complete

Local check:

```bash
pnpm governance:validate:local
```

### C3. Automated gates

- [ ] `pnpm verify` — exit 0
- [ ] `pnpm governance:validate` — exit 0
- [ ] GitHub Actions `governance.yml` green on PR

### C4. Handover (§16)

- [ ] `docs/00-bootstrap/PROJECT_BACKLOG.md` updated
- [ ] `docs/00-bootstrap/PROJECT_STATE.md` updated (if milestone changed)
- [ ] `docs/00-bootstrap/PROJECT_HANDOVER.md` appended
- [ ] `CHANGELOG.md` updated (if product code changed)

---

## CI enforcement map

| Check | Enforced by |
| --- | --- |
| `pnpm verify` | `governance.yml` job step |
| PR Risk / DoR / DoD / Rollback / Evidence | `scripts/governance/validate.mjs` |
| CHANGELOG on code changes | `scripts/governance/validate.mjs` |
| New ADR → DECISIONS + CHANGELOG | `scripts/governance/validate.mjs` |
| ADR index integrity | `scripts/governance/validate.mjs` |
| ADR-0001 (no WordPress) | `scripts/governance/validate.mjs` |
| Architecture paths → ADR reference | `scripts/governance/validate.mjs` + PR template |

---

## Agent entry points (synchronized)

| Tool | File |
| --- | --- |
| Universal | `AGENTS.md` (source) |
| Claude Code | `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cursor | `.cursor/rules/agent-router.mdc` |

Run `pnpm sync:agents` after editing `AGENTS.md`.

---

## Cross-references

- [`ENGINEERING_PROTOCOL.md`](./ENGINEERING_PROTOCOL.md) — 60 rules
- [`QUALITY_GATES.md`](./QUALITY_GATES.md) — lint/typecheck/test/build
- [`RISK_CLASSIFICATION.md`](./RISK_CLASSIFICATION.md) — risk matrix
