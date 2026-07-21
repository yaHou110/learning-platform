# M6 Deployment / CI-CD — Notes

> **Status:** ✅ Artifacts complete (2026-07-20)
> **Risk:** LOW per ADR-0013 §42 (config+docs+scripts only; no live VPS touched)
> **Branch:** `feat/m6-deployment`

## What M6 delivers
- `apps/web/Dockerfile` — multi-stage builder (next build standalone) → runner (~200MB, non-root)
- `docker-compose.prod.yml` — app + Postgres 16 + MinIO; healthchecks; localhost-only ports
- `.dockerignore` — excludes docs/tests/evidence/.env
- `docs/07-deployment/nginx.conf` — TLS + HSTS (M4.2 follow-up closed) + rate-limit + /api/metrics localhost-gate
- `docs/07-deployment/learning-platform.service` — systemd Type=oneshot driving compose
- `scripts/deployment/backup.sh` — pg_dump + MinIO mirror + sha256 manifest; 30-day retention
- `scripts/deployment/restore.sh` — idempotent restore with manifest verification
- `docs/07-deployment/DEPLOYMENT_GUIDE.md` — full provisioning + ops + rollback guide
- `.github/workflows/deploy.yml` — build → push GHCR → SSH deploy → smoke test → rollback
- `apps/web/next.config.mjs` — added `output: "standalone"` for Docker
- `/api/metrics` route — dropped unused `env` import (lint warning → clean)

## Fixes applied during M6
- **`next build` exit 1** — root cause: `eslint-config-next` needs `eslint-plugin-import` which wasn't installed. Installed `eslint-plugin-import@2.31.0` + `eslint-import-resolver-typescript` as web devDeps. `pnpm verify` now green (previously the web `next lint` step failed the build).
- **`/api/metrics` unused expression** — the `env;` no-op statement tripped `@typescript-eslint/no-unused-expressions`. Since `env` wasn't actually used, removed the import.

## Design decisions
- **systemd Type=oneshot not notify** — `docker compose up -d` exits immediately; Docker manages container health. `RemainAfterExit=yes` keeps the unit "active".
- **Nginx on host not in compose** — so certbot/letsencrypt can manage TLS certs with webroot, and HSTS applies before traffic reaches Node.
- **No live verification** — requires real VPS + DNS + Let's Encrypt (founder operational step). CI `deploy.yml` is designed to run those tests on the real host.

## Verification
- `pnpm verify` → ✅ exit 0 (lint + typecheck + test + build all green; build produces `.next/standalone/server.js`)
- 10 routes compiled; Middleware 46.1 kB; First Load JS 102 kB

## Open questions
- **Q7 — PWA / offline** still pending founder decision.
- **M7 — Production Readiness Review** — final checklist + founder sign-off → feature gate lifts.

## Rollback
- Config+docs+scripts only. `git revert <merge>` removes all M6 artifacts. `next.config.mjs` change (`output: "standalone"`) is backwards-compatible — dev server unaffected.
