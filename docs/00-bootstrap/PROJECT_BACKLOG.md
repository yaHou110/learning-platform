# PROJECT_BACKLOG.md

> **The single task for the current session. Read this second (after `PROJECT_STATE.md`).**
> Update this file at the end of every session, even if "no progress."
>
> _Renamed from `NEXT_SESSION.md` on 2026-07-12. Historical session entries in `PROJECT_HANDOVER.md` still reference the old name — that file is append-only._

---

## Current session

| Field | Value |
| --- | --- |
| Session # | 013 |
| Date opened | 2026-07-12 |
| Agent | mavis (orchestrator) |
| Sprint | SPRINT-001 — Production Foundation |
| Goal | **(a) Fill the M3 evidence gap from session 012; (b) capture M4 vulnerability audit baseline; (c) draft DoR + spec for the dependency upgrade; (d) re-prioritize the M2 blocker.** |
| Status | 🔴 **Critical security finding requires founder decision before continuing** |

---

## Context

Session 012 landed the executable governance CI (workflow + validator + agent sync) but the M3 evidence directory was empty. This session filled that gap. While preparing for M4, a routine `pnpm audit --prod` surfaced **28 known vulnerabilities** in `next@15.0.3` and `next-auth@5.0.0-beta.25` — including **2 critical** and **8 high** advisories. This is a higher-priority blocker than the M2 PostgreSQL smoke test.

The M2 PostgreSQL blocker (sessions 009, 010, 011, 012) is **unchanged**: PostgreSQL 16 is not installed on this dev machine; admin privileges are required for the installer. Options:

1. **Run cmd as Administrator** → `winget install PostgreSQL.PostgreSQL.16` or `choco install postgresql16 --params "/Password:hawza /UserName:hawza /dbName:hawza /port:5432"`.
2. **Install Docker Desktop** (admin needed) → `docker compose up -d` uses the existing `docker-compose.yml`.
3. **Provide a remote `DATABASE_URL`** in `apps/web/.env` and I'll point the smoke test at it.
4. **Use a portable PostgreSQL** (e.g. `embedded-postgres` npm or `pg_tmp` style binary) that doesn't need admin install. **Not currently set up** — would need a small spike.

## What this session delivered

- `evidence/M3-ci/notes.md`, `checklist.md`, `commands.txt` — M3 evidence gap closed.
- `evidence/M4-security/audit-baseline.json` — full pnpm audit output (28 advisories).
- `evidence/M4-security/notes.md` — severity breakdown + risk classification.
- `evidence/M4-security/checklist.md` — pre-work items.
- `evidence/M4-security/M4-1-dependency-upgrade.md` — DoR + spec + risk matrix for the upgrade. **Awaiting founder approval** (CRITICAL risk per ADR-0013 §42).

## Active sprint

- Plan: [`../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`](../06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md)
- Evidence: `../06-sprints/SPRINT-001-production-foundation/evidence/M{2,3,4}-*/`

## What the next agent (you) should do

**Decision needed from founder (in this order):**

1. **Critical:** Approve the dependency upgrade (`next@15.0.3 → 15.5.16+`, `next-auth@5.0.0-beta.25 → 5.0.0-beta.30+`)? Spec in `evidence/M4-security/M4-1-dependency-upgrade.md`. If yes → next session is M4.1: do the bump on a branch, run `pnpm verify` + `pnpm audit`, open PR.
2. **Important:** Pick a PostgreSQL path for the M2 smoke test. Options above. If (3) (remote URL) → provide it; if (1) or (2) (local install) → confirm you ran it and I'll resume M2.
3. **If neither (1) nor (2) can proceed this session:** I will work on the next M4 items that don't need a running database:
   - CSP header (`Content-Security-Policy`) — needs careful tuning; can be drafted as a config + tested against the dev server (no DB required for header-only changes).
   - Rate limiting middleware (in-memory token bucket) — no DB.
   - Input validation Zod schemas on `/api/users`, `/api/auth/*` — unit-testable without DB.
   - `security.txt` at `/.well-known/security.txt` — static file.

## Done-when checklist (this session)

- [x] M3 evidence gap closed (3 files written)
- [x] `pnpm audit --prod --json` captured
- [x] M4 pre-work files written (notes, checklist, DoR+spec)
- [x] `PROJECT_BACKLOG.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, `PROJECT_HANDOVER.md` updated
- [ ] **Founder decision on the upgrade** — required before merge of this session's evidence
- [ ] Commit (run `pnpm verify` first per ADR-0012)

## Out of scope (do NOT do in this session)

- Actually bumping `next`/`next-auth` — needs founder approval first.
- M2 smoke test — still blocked on PostgreSQL.
- M5+ work — too far ahead; M4 must complete first.
- New features (Catalog, Learning, etc.) — sprint hard gate still binding.

## Notes for the next agent

- The dependency upgrade is **CRITICAL** by the audit count, not by ADR-0013 risk matrix alone. Founder approval is mandatory regardless of how easy the bump looks.
- `pnpm verify` is the pre-commit gate (see `docs/03-development/QUALITY_GATES.md`).
- **Non-trivial work:** complete DoR (`templates/DEFINITION_OF_READY.md`) and spec/plan before coding (§40).
- **HIGH/CRITICAL risk or §41 triggers:** obtain founder approval (`templates/HUMAN_APPROVAL_CHECKLIST.md`).
- If a smoke test fails, STOP. Document the failure. Do not silently retry.
- The `apps/web/.env` file does not exist yet — must be created in `apps/web/` (not repo root) with at minimum: `AUTH_SECRET=<random-32-byte-base64>`, `DATABASE_URL=postgres://hawza:hawza@localhost:5432/hawza`.
- PowerShell execution policy blocks `pnpm` directly. Use `cmd /c "pnpm ..."`.
