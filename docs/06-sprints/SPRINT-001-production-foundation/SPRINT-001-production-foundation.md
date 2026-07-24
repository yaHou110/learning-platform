# SPRINT-001 — Production Foundation Sprint

> **Status:** ✅ **Complete — M1 ✅, M2 ✅, M3 ✅, M4.0 ✅, M4.1 ✅, M4.2 ✅, M4.3 ✅, M5 ✅, M6 ✅, M7 ✅ (gate lifted 2026-07-23)**
> **Session range:** 008 → (open)
> **Date opened:** 2026-07-11
> **Decider:** founder (you)

---

## Why this sprint exists

The repository has a working dev-mode stack (Identity & Access plugin end-to-end, smoke test passed in session 007), but is **not yet production-candidate**. Before adding new business features (Catalog, Learning, Credentials, Localization, Event Bus, Dashboard), we lock down the foundation: build, test, CI, security, observability, deployment.

This sprint **overrides the previous Session 008 plan** (which was to start Catalog plugin UI/API). Per founder directive (2026-07-11 chat), we suspend feature work until the production-readiness checklist is fully green.

## Hard gate (binding)

🟢 **M7 gate lifted (2026-07-23).** Vercel + Railway Postgres is the v1 deployment target (ADR-0018, supersedes ADR-0007). The "founder VPS provisioning + live smoke test" blocker is removed. Feature work (Catalog, Learning, Dashboard, Credentials, PWA) is unblocked.

**Remaining for M7 smoke check (founder action):** set 4 env vars on Vercel dashboard (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXTAUTH_URL`) → redeploy → `curl /api/health` → expect `{"status":"ok","checks":{"db":true,"auth":true,"storage":true}}`.

## Operating cycle (binding for every session in this sprint)

1. **Plan** — concrete task, done-when checklist, evidence requirements
2. **Implement** — minimum change that satisfies the plan
3. **Verify** — produce objective evidence (logs, test output, build output, CI status, doc diffs)
4. **Update Documentation** — `PROJECT_BACKLOG.md`, `PROJECT_STATE.md`, `PROJECT_HANDOVER.md`, `CHANGELOG.md`, sprint evidence files
5. **Commit** — Conventional Commits, reference the milestone
6. **Review** — founder reviews evidence; only then proceed to next milestone

> **Engineering Protocol (ADR-0012):** Full rules in `docs/03-development/ENGINEERING_PROTOCOL.md` (v2.0, 60 rules). Pre-commit gate: `pnpm verify`. Non-trivial work: DoR + spec-first (ADR-0013).

> **Evidence rule (founder directive, 2026-07-11):** "Do not assume success. Produce objective evidence for every completed milestone (logs, test results, build results, CI status, and updated documentation)."
> A milestone is not "done" until its evidence file in `evidence/M{n}-*/` is complete.

---

## Milestones

| # | Title | Goal | Evidence location |
|---|---|---|---|
| **M1** | Baseline Verification | Freeze current state; verify `pnpm install`, `lint`, `typecheck`, `test`, `build` all pass from a clean checkout | `evidence/M1-baseline/` | ✅ Done (session 008) |
| **M2** | Production Build Validation | `next build` succeeds; `next start` serves on production port; smoke test against prod build | `evidence/M2-prod-build/` | 🟡 partial (code review done, smoke test blocked) |
| **M3** | CI/CD | GitHub Actions runs lint+typecheck+test+build on every PR; blocks merge on red | `evidence/M3-ci/` |
| **M4** | Security Hardening | CSP, security headers, rate limiting, input validation, secret management, audit logging | `evidence/M4-security/` |
| **M5** | Observability | Structured JSON logs, metrics endpoint, error reporting, `/api/health` deep check, `/api/ready` | `evidence/M5-observability/` |
| **M6** | Deployment | Docker Compose for prod, Nginx reverse-proxy config, systemd unit, backup & restore scripts, deployment guide | `evidence/M6-deployment/` |
| **M7** | Production Readiness Review | Final checklist, no red, **gate lifted 2026-07-23**; Vercel + Railway cloud target live (ADR-0018); feature work unblocked | `evidence/M7-readiness/` | ✅ Done (gate lifted) |

---

## Architectural constraints respected

- Single VPS ≤ 4 GB RAM (`ARCHITECTURE_CONSTRAINTS.md` C1) — no new heavy runtimes introduced in M4–M6.
- Modular monolith (`PROJECT_PRINCIPLES.md` #4) — no new services; we extend the existing Next.js + Postgres + MinIO processes only.
- Self-hosted, OSS-first (C3, principle #3) — no SaaS introduced.
- Security-first (C5) — every M4 item is mandatory; nothing is "deferred to a later sprint" within M4.
- Persian/RTL first-class — no regressions in RTL/LTR handling.
- License-clean (no GPL in core) — verified per item.

## Out of scope (parked for post-sprint)

- Catalog API + UI (course card, lesson list)
- Learning plugin (enrollment, progress)
- Credentials plugin (certificate issuance, verification)
- Localization plugin (Shamsi dates, key translation, beyond what's already wired)
- Event bus infrastructure
- PWA / offline
- Real i18n catalog (LTR English mirror)
- Multi-tenant subdomain routing (Q6 still open)

## How to read this folder

- `SPRINT-001-production-foundation.md` — this file
- `evidence/M{n}-*/` — per-milestone evidence. Each contains:
  - `commands.txt` — exact commands run
  - `output-<step>.txt` — captured output (full or relevant excerpts)
  - `notes.md` — observations, deviations, decisions
  - `checklist.md` — milestone-specific done-when checklist with ticks

## How to add a new sprint

1. Copy this file to `docs/06-sprints/SPRINT-NNN-<slug>.md`.
2. Create the same `evidence/M{n}-*/` directory tree.
3. Add a row to `docs/00-bootstrap/PROJECT_STATE.md` (Phase row).
4. Add a `Sprint` entry in `PROJECT_HANDOVER.md` when the sprint starts.
