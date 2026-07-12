# M3 — CI/CD — Checklist

## Workflow
- [x] `.github/workflows/governance.yml` created
- [x] Triggers: `pull_request` + `push` to `main`
- [x] `concurrency` group prevents redundant runs
- [x] Permissions locked down (`contents: read`, `pull-requests: read`)
- [x] Steps: checkout → pnpm → Node 20 → install (frozen) → verify → governance validate

## PR template
- [x] `.github/pull_request_template.md` created
- [x] Required sections: Context, Risk, DoR, DoD, ADR, Rollback, Evidence

## Issue templates
- [x] `.github/ISSUE_TEMPLATE/feature.yml`
- [x] `.github/ISSUE_TEMPLATE/bug.yml`
- [x] `.github/ISSUE_TEMPLATE/config.yml`

## Validator script
- [x] `scripts/governance/validate.mjs` runs locally and in CI
- [x] ADR index integrity check
- [x] ADR-0001 WordPress ban on changed files
- [x] New ADR completeness check
- [x] CHANGELOG requirement for architecture changes
- [x] PR template section validation

## Supporting docs
- [x] `docs/03-development/GOVERNANCE_CHECKLIST.md`
- [x] `AGENTS.md` ↔ `CLAUDE.md` ↔ `.github/copilot-instructions.md` synced

## Root scripts
- [x] `pnpm governance:validate`
- [x] `pnpm governance:validate:local`
- [x] `pnpm sync:agents`

## Local validation
- [x] `pnpm governance:validate:local` runs without error
- [x] `pnpm verify` clean before merge (lint + typecheck + test + build)

## Status

🟢 **M3 PASSED.**
