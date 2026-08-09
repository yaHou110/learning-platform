# M3 — CI/CD — Notes

## What we did

Implemented **executable governance CI** for the Learning Platform. The GitHub Actions workflow is the canonical source of truth for "is this PR mergeable" — it runs the four quality gates (`pnpm verify`: install → lint → typecheck → test → build) **and** validates governance rules (PR body sections, ADR index integrity, ADR-0001 WordPress ban, CHANGELOG requirement).

## What was added

### 1. `.github/workflows/governance.yml`
- Triggers on `pull_request` and `push` to `main`.
- `concurrency` group cancels in-progress runs on the same ref.
- Permissions locked down: `contents: read`, `pull-requests: read`.
- Steps: checkout → pnpm/setup-node@v4 → install (frozen lockfile) → `pnpm verify` → `pnpm governance:validate`.
- Passes the env (`PR_BODY`, `BASE_SHA`, `HEAD_SHA`, `GITHUB_EVENT_NAME`) to the validator so it can check the actual diff.

### 2. `.github/pull_request_template.md`
Mandatory governance sections with CI markers:
- **Context** — what & why
- **Risk** — LOW / MEDIUM / HIGH / CRITICAL (per ADR-0013 §42)
- **DoR** — Definition of Ready checks (ADR-0013 §39)
- **DoD** — Definition of Done checks (ADR-0012 §60)
- **ADR** — referenced ADRs (or "none")
- **Rollback** — how to revert
- **Evidence** — links to logs/test output/CI status

### 3. `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`, `config.yml`
Standardized intake form so every issue carries risk / acceptance / evidence fields from day one.

### 4. `scripts/governance/validate.mjs` + lib
Node script that enforces:
- **ADR index integrity** — every ADR file referenced in `DECISIONS.md` exists; every ADR file is referenced.
- **ADR-0001 WordPress ban** — fails the PR if any changed file imports/contains `wp-`, `wordpress`, `WP_` patterns.
- **New ADR completeness** — any new `ADR-XXXX-*.md` must have a Context, Decision, Consequences section.
- **CHANGELOG requirement** — any change to architecture-sensitive paths requires a CHANGELOG entry in `[Unreleased]`.
- **PR template** — required sections must be present and non-empty on `pull_request` events.

### 5. `docs/03-development/GOVERNANCE_CHECKLIST.md`
Session-level Phase A / B / C checklist that every contributor must walk through. Mirrors `templates/IMPLEMENTATION_PLAN.md` and `templates/DEFINITION_OF_DONE.md`.

### 6. Entry-point sync
- `DEVELOPMENT_GUIDE.md` — single entry point.
- `DEVELOPMENT_GUIDE.md` is the single entry point.
- `DEVELOPMENT_GUIDE.md` is the single source of truth and entry point.

### 7. Root scripts
- `pnpm governance:validate` — full validation (needs PR env).
- `pnpm governance:validate:local` — local dry-run (sets `SKIP_PR_BODY=1`).
- No multi-file sync; `DEVELOPMENT_GUIDE.md` is the only entry point.

## Why executable (not just docs)?

The Engineering Protocol (ADR-0012) and Engineering Protocol v2 (ADR-0013) were powerful on paper but **not enforceable** until M3. With M3 landed:
- A PR cannot be merged if any quality gate fails.
- A PR cannot be merged if it lacks a Risk / DoD / ADR / Rollback / Evidence section.
- A PR cannot introduce a WordPress dependency (per ADR-0001) or a new ADR without the required sections.
- A PR that touches architecture paths without a CHANGELOG entry is blocked.

This is what "governance before generation" (§59) means in practice.

## Tooling observations

- **No live CI run yet.** The workflow is defined and the script works locally (`pnpm governance:validate:local`); the first real CI run will happen on the first PR after this merge.
- **No branch protection configured yet.** That is a GitHub-repo-setting step that the founder performs on `github.com`. Documented in `docs/07-deployment/` (to be created in M6).
- **The governance workflow depends on `ubuntu-latest`.** M6 will add a second job on `windows-latest` only if we discover a Windows-specific failure (none known at the moment).

## What is **not** in M3 (deferred to later milestones)

- Branch protection rules (GitHub repo setting — founder's hand).
- Required status checks (depends on branch protection).
- Dependabot / Renovate config (M4 or M5, not blocking).
- Secret scanning (M4).

## Status

🟢 **M3 PASSED.** Governance CI is in place and locally validated. First real CI run will gate the first post-M3 PR.
