# M6 — Deployment / CI-CD — Checklist

## Docker
- [x] `apps/web/Dockerfile` — multi-stage: builder (install deps + build) → runner (copy .next + standalone + node_modules)
- [x] `.dockerignore` — exclude .git, node_modules, .next, evidence, docs, tests
- [x] `docker-compose.prod.yml` — app + Postgres + MinIO services; volumes for pg_data + minio_data; healthchecks

## Reverse Proxy (Nginx)
- [x] `docs/07-deployment/nginx.conf` — TLS termination (HSTS), rate limit proxy, upstream app, internal-only /api/metrics, static asset caching, CSP headers offload

## systemd
- [x] `docs/07-deployment/learning-platform.service` — Type=oneshot (drives compose), RemainAfterExit=yes, EnvironmentFile, Restart=on-failure, StandardOutput=journal

## Backup & Restore
- [x] `scripts/deployment/backup.sh` — pg_dump (daily, 30-day retention), MinIO mirror, manifest
- [x] `scripts/deployment/restore.sh` — idempotent restore from manifest, DB + MinIO

## Deployment Guide
- [x] `docs/07-deployment/DEPLOYMENT_GUIDE.md` — provisioning, env, TLS certs (Let's Encrypt), compose up, systemd enable, smoke test, rollback

## CI/CD
- [x] `.github/workflows/deploy.yml` — on push to main: build image → push GHCR → ssh to host → compose pull/up → smoke test health/ready/metrics → rollback on failure

## Evidence
- [x] `commands.txt` — exact commands run
- [x] `output-local-verify.txt` — docker build + compose-up + endpoint/MinIO smoke (local, 2026-07-21)
- [x] `output-backup-restore.txt` — backup→destroy→restore round-trip (local, 2026-07-21)
- [x] `notes.md` — observations, deviations (below)

## Verification
- [x] `pnpm verify` passes (lint, typecheck, test, build) — confirmed on main
- [x] Docker build succeeds locally — `learning-platform-app:latest` built; next build compiled in 35.3s (2026-07-21, `output-local-verify.txt`)
- [x] Compose up brings all services healthy — lp-app/lp-postgres/lp-minio all `healthy` on localhost (2026-07-21)
- [x] Nginx proxies /api/health (200), /api/ready (200), /api/metrics (401 without token, 200 with) — endpoints verified directly on :3000 (200/200/401-no-token/200-token); nginx host proxy itself remains VPS-only → M7
- [ ] HSTS header present on HTTPS — genuinely VPS-only (Let's Encrypt TLS); deferred to M7
- [x] Backup script runs without error — pg_dump + minio mirror + manifest proven in-container (2026-07-21, `output-backup-restore.txt`)
- [x] Restore script recovers DB to a known state — full round-trip recovers 2 marker rows + MinIO object after destroy (2026-07-21, `output-backup-restore.txt`)

---

## Defects found & fixed during local verification (2026-07-21)

Local verification (no VPS — see `output-local-verify.txt`) surfaced five real
defects in the shipped M6 prod artifacts that would have broken any fresh
VPS/CI run. All fixed on this branch:

1. **Stale MinIO tag** — `minio/minio:RELEASE.2024-07-19T21-05-03Z` was pruned
   from Docker Hub (`not found`, 404). Bumped to `RELEASE.2025-07-23T15-54-02Z`
   in `docker-compose.prod.yml`.
2. **Broken build context** — `docker-compose.prod.yml` had `context: ..` which
   walks above repo root, expanding to `D:\code\apps` and failing the build.
   Fixed to `context: .`.
3. **Missing `public/` dir** — `apps/web/Dockerfile` does `COPY .../public ./public`
   but no `public/` existed, collapsing the build ("public: not found"). Added
   `apps/web/public/.gitkeep` (also the canonical home for the future PWA
   manifest/SW/icons per ADR-0016).
4. **Monorepo standalone entrypoint mismatch** — Next.js standalone preserves the
   monorepo tree, so `server.js` lands at `/app/apps/web/server.js`, but the
   Dockerfile ran `node server.js` from WORKDIR `/app` → `MODULE_NOT_FOUND`.
   Fixed the runner COPY targets (`./apps/web/.next/static`, `./apps/web/public`)
   and `WORKDIR /app/apps/web` so server.js + its relative static/public paths
   resolve.
5. **Healthcheck false-negative on alpine** — `wget ... http://localhost:3000/...`
   resolved `localhost` to `::1` (IPv6) while Next binds `0.0.0.0` (IPv4), so
   the container read "unhealthy" while the app served 200. Changed the
   healthcheck probe to `http://127.0.0.1:3000/...` (IPv4 explicit).

---

## Notes / Deviations

1. **Type=oneshot not notify** — The systemd unit uses `Type=oneshot; RemainAfterExit=yes` (not `notify`) because `docker compose up -d` exits immediately; Docker itself manages container health. This is the documented pattern for Compose-driven services.

2. **No live verification** — All artifacts are configuration+scripts only. The actual VPS provisioning, TLS certs, and smoke tests require a real VPS with DNS + Let's Encrypt, which is a founder operational step outside the repo. The CI pipeline (`deploy.yml`) is designed to run those tests on the real host.

3. **MinIO healthcheck** — Uses `mc ready local` which requires the `mc` client inside the container. The `minio/minio` image includes it.

3. **HSTS** — Set in both Nginx (`add_header Strict-Transport-Security`) and certbot auto-configures it; defense in depth.

4. **Rate-limit layering** — Nginx `limit_req_zone lp_api` (10 r/s) + in-app `rate-limit.ts` (per-user/IP token bucket). Two-layer defense per C2/C5.

5. **Metrics gating** — Nginx `allow 127.0.0.1/::1` on `/api/metrics` + in-app bearer token (`METRICS_TOKEN`). Double gate so token leak alone doesn't expose the endpoint.

6. **Backup/Restore** — Idempotent; manifest with sha256 verification. 30-day retention per SYSTEM_ARCHITECTURE.md §9.

7. **CI/CD secrets** — All secrets in GitHub repository secrets; none in the repo. The env file on the host (`/etc/learning-platform/env`) is the single source of truth for runtime secrets.

8. **Rollback** — `docker compose up -d --force-recreate --remove-orphans` restarts the previously-stopped containers (Compose keeps them). No image tag manipulation needed.

---

## Next Steps (M7 — Production Readiness Review)

1. Founder provisions VPS + DNS + runs provisioning steps (§3 of DEPLOYMENT_GUIDE.md).
2. CI/CD pipeline runs on first push to `main` after secrets are added.
3. Smoke tests pass on real host.
4. M7 checklist → founder sign-off → feature gate lifts (SPRINT-001 hard gate removed).