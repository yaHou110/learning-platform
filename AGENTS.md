# AGENTS.md

> **Agent entry point (ecosystem convention).** Canonical router: [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md)
>
> Keep this file in sync: run `pnpm sync:agents` after edits. Copies: `CLAUDE.md`, `.github/copilot-instructions.md`.

---

## Read first

1. [`DEVELOPMENT_GUIDE.md`](./DEVELOPMENT_GUIDE.md) — onboarding router
2. [`docs/00-bootstrap/PROJECT_STATE.md`](./docs/00-bootstrap/PROJECT_STATE.md)
3. [`docs/00-bootstrap/PROJECT_BACKLOG.md`](./docs/00-bootstrap/PROJECT_BACKLOG.md)
4. [`docs/03-development/ENGINEERING_PROTOCOL.md`](./docs/03-development/ENGINEERING_PROTOCOL.md) — Engineering OS (60 rules)
5. [`docs/03-development/GOVERNANCE_CHECKLIST.md`](./docs/03-development/GOVERNANCE_CHECKLIST.md) — **complete every session**

---

## Executable governance (CI-enforced)

| Artifact | Purpose |
| --- | --- |
| [`.github/pull_request_template.md`](./.github/pull_request_template.md) | Mandatory PR sections |
| [`.github/workflows/governance.yml`](./.github/workflows/governance.yml) | `pnpm verify` + governance validate |
| [`scripts/governance/validate.mjs`](./scripts/governance/validate.mjs) | PR/ADR/CHANGELOG checks |
| [`docs/03-development/QUALITY_GATES.md`](./docs/03-development/QUALITY_GATES.md) | Pre-commit gates |

```bash
pnpm verify              # lint → typecheck → test → build
pnpm governance:validate # ADR + CHANGELOG + PR body rules
```

---

## Hard rules

- **No WordPress** (ADR-0001)
- **No invented APIs, config, or architecture** (§58)
- **Governance before generation** (§59): DoR → spec → risk → approval → implement
- **Rule priority:** Security → Human approval → ADRs → Protocol → Docs → Sprint
- **Before commit:** `pnpm verify`
- **Before PR:** complete [`GOVERNANCE_CHECKLIST.md`](./docs/03-development/GOVERNANCE_CHECKLIST.md)
- **Append-only:** CHANGELOG history, past ADRs, past handovers

---

## Session end

Update `PROJECT_BACKLOG.md`, append `PROJECT_HANDOVER.md`, update `CHANGELOG.md` when needed.

---

## Deep docs (on demand only)

- Product: `docs/01-product/`
- Architecture: `docs/02-architecture/`
- ADRs: `docs/05-decisions/DECISIONS.md`

Do not preload the entire repository.
