# M6 Deployment / CI-CD — Notes

> **Status:** ✅ Artifacts complete + LOCALLY VERIFIED (2026-07-21)
> Deployed prod stack builds, boots, and serves correctly on localhost — no VPS
> required for the build/compose/endpoint/backup-restore layer. Only TLS (Let's
> Encrypt) + host-level Nginx/HSTS/rate-limit + the deploy.yml SSH path remain
> VPS-only (M7). Five shipped-artifact defects were found and fixed during local
> verification (see checklist §"Defects found & fixed").
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

## Local verification results (2026-07-21)
- `docker compose -f docker-compose.prod.yml up -d --build` → image built; all
  three containers reach `healthy` (lp-app/lp-postgres/lp-minio).
- Endpoints on `127.0.0.1:3000`: `/api/health` → 200 (db:true, auth:true);
  `/api/ready` → 200; `/api/metrics` → 401 without token, 200 with token, 401
  with wrong token. `/` → 307 (redirect). Prometheus body renders.
- MinIO: S3 API :9000 → 200; console :9001 → 200; bucket `learning-platform` created.
- Postgres `pg_isready` → accepting connections.
- Backup→destroy→restore round-trip recovers 2 marker rows + a MinIO object
  byte-identical after a simulated DROP + object removal.
- **No partial-output penalty:** local verification was worth doing precisely
  because it surfaced 5 defects the "deferred to VPS" bucket was hiding.
- See `output-local-verify.txt` and `output-backup-restore.txt` for captured output.

## Open questions
- **Q7 — PWA / offline** — RESOLVED 2026-07-21: founder decided YES (ADR-0016).
  Implementation stays parked until M7 sign-off per the 2026-07-11 directive.
- **M7 — Production Readiness Review** — final checklist + founder sign-off →
  feature gate lifts. Remaining VPS-only items: Let's Encrypt TLS certs +
  HSTS, host-level Nginx rate-limit/metrics gate, the deploy.yml SSH delivery
  path, and the smoke test against the real domain.

## Rollback
- Config+docs+scripts only. `git revert <merge>` removes all M6 artifacts. `next.config.mjs` change (`output: "standalone"`) is backwards-compatible — dev server unaffected.
