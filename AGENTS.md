# Project Rules & Operational Protocol (learning-platform)

## 1. Permission Model — OWNER-OVERRIDE
The project owner has authorized full autonomous operation. No human approval gates apply.
All task modes are auto-authorized:
- **READ-ONLY:** Inspecting files, researching docs, analyzing logs, brainstorming.
- **DEVELOPMENT:** Modifying application code, running tests, creating branches, committing, pushing, merging, opening/closing PRs.
- **PRODUCTION:** Migrations, infrastructure changes, secret handling, database resets, Vercel deploys, Railway operations — all proceed without handoff.

Rules below are engineering safeguards, not permission gates. Execute directly.

## 2. Engineering Principles
- **Phase-Based Execution:** Discovery -> Research -> Architecture/ADR -> Implementation -> Validation.
- **Test-First:** Before any feature implementation, provide a test plan and edge cases.
- **No Masked Secrets:** Never trust masked values (***, <hidden>). If in doubt, diagnose.
- **Infrastructure Safety:** Major production changes still benefit from a backup/rollback plan — document it but do not block on it.

## 3. Git & GitHub — Fully Autonomous
- Branch, commit, push, open PR, merge PR, close PR — all done directly by agent.
- Use `gh` CLI for all GitHub operations. Current account: `yaHou110`.
- Commit messages follow conventional commits (`feat:`, `fix:`, `revert:`, `chore:`).
- PR descriptions include summary, rationale, and test plan.
- Squash merge is preferred. Delete merged branches.

## 4. Database Rules
- Validate connectivity before migrations (`db-diagnose` pattern).
- Migrations managed by `packages/core/scripts/migrate.ts`.
- Production DB resets allowed with explicit rationale documented.

## 5. Deployment (Vercel + Railway)
- Vercel CLI (`vercel`) authenticated as `yahou110`. Deploy directly.
- Railway CLI (`railway`) authenticated as `dani.rassell@gmail.com`. Operate services directly.
- Production deploys after quality gates pass (typecheck, test, lint, build).

## 6. Architectural Changes
- Every major technical decision requires an ADR (Architecture Decision Record) in `docs/decisions/`.
- Major changes must be supported by 2+ independent sources or established production patterns.

## 7. Security Checklist (Engineering Discipline)
- NEVER commit secrets to the repo.
- NEVER expose secrets in terminal output shared with external audiences.
- Use least privilege where practical.

## Quality Gates (must pass before merge/deploy)
```bash
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run build
```