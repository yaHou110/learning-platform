# NEXT_SESSION.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 008 |
| Date opened | 2026-07-11 |
| Agent | orchestrator (Mavis) |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **M1 — Baseline Verification.** Freeze the current state, take a clean commit, run `pnpm install` → `lint` → `typecheck` → `test` → `build` from a clean state and capture every output. |
| Status | 🔵 in progress |

---

## Context

Sessions 005–007 produced a working Identity & Access stack (Postgres + Drizzle + Auth.js v5 + Edge middleware + login/dashboard + 2 API routes). Dev-mode smoke test passed locally.

Session 008 *originally* planned Catalog API/UI work. **That plan is suspended.** Per founder directive (2026-07-11 chat), we run a Production Foundation Sprint first and gate feature work behind M7 sign-off.

12 files from sessions 005–007 are still uncommitted in the working tree. M1 freezes those as a baseline.

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence dir: `../06-sprints/SPRINT-001-production-foundation/evidence/M1-baseline/`

## M1 — Baseline Verification — task

### 1.1 Freeze current state
- `git status` must show only intended changes
- Commit all 12 uncommitted files as `chore: freeze session 005-007 work as sprint baseline`
- `git status` clean afterward

### 1.2 pnpm install (clean)
- `pnpm install --frozen-lockfile`
- Capture: exit code, install summary, any warnings

### 1.3 Lint
- `pnpm -r lint`
- Capture: exit code, full output (must be zero warnings)

### 1.4 Typecheck
- `pnpm -r typecheck`
- Capture: exit code, full output (must be clean)

### 1.5 Test
- `pnpm -r test`
- Capture: exit code, summary (X tests passed across Y packages)

### 1.6 Build
- `pnpm build` (root script — runs `packages/*` build then `apps/web` build)
- Capture: exit code, Next.js build summary (route table)

### 1.7 Evidence file
Write `evidence/M1-baseline/`:
- `commands.txt` — exact commands run
- `output-install.txt`, `output-lint.txt`, `output-typecheck.txt`, `output-test.txt`, `output-build.txt`
- `checklist.md` — milestone done-when with ticks
- `notes.md` — observations, deviations, decisions

### 1.8 Documentation updates
- `CHANGELOG.md` `[Unreleased]` — entry
- `MASTER_HANDOFF.md` — append Session 008 entry
- `NEXT_SESSION.md` — rotate to M2
- `PROJECT_STATE.md` — mark M1 complete, M2 in progress
- Update SPRINT-001 milestone table to ✅ for M1

### 1.9 Commit
- One commit per milestone, Conventional Commits message

## Done-when checklist (M1)

- [ ] Working tree clean, all 12 uncommitted files committed as baseline
- [ ] `pnpm install --frozen-lockfile` exit 0
- [ ] `pnpm -r lint` exit 0, zero warnings
- [ ] `pnpm -r typecheck` exit 0
- [ ] `pnpm -r test` exit 0, all tests pass
- [ ] `pnpm build` exit 0
- [ ] All 5 output files in `evidence/M1-baseline/`
- [ ] `checklist.md` and `notes.md` written
- [ ] `CHANGELOG.md` updated
- [ ] `MASTER_HANDOFF.md` Session 008 entry appended
- [ ] `NEXT_SESSION.md` rotated to M2
- [ ] `PROJECT_STATE.md` updated
- [ ] Final commit, push optional

## Out of scope (do NOT do in this session)

- Anything beyond M1. M2 (next build + next start smoke test) is next.
- New features (Catalog, Learning, etc.)
- Refactoring on a whim
- Bumping versions of Next.js / Node / TypeScript

## Notes for the next agent

- All commands run via `cmd /c "pnpm ..."` because PowerShell execution policy blocks the `pnpm.ps1` shim.
- Evidence files are plain text. Use the Write tool, not shell `>` redirects, to avoid encoding issues.
- Do NOT skip the evidence step. Founder directive is binding.
- If any command fails, STOP. Document the failure in `notes.md` with the full error. Do not silently retry or pivot to a workaround.
