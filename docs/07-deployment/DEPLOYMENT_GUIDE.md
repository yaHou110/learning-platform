# Learning Platform — Production Deployment Guide (M7)

> **Scope:** v1 — **Vercel (serverless Next.js) + Railway Postgres** is the production cloud target (ADR-0018, supersedes ADR-0007's VPS path).
> **Local verification lane:** Docker Compose prod stack (`docker-compose.prod.yml`) with ADR-0017 containerized migrations runs on the founder's Docker Desktop (Windows) to verify the full stack (app + Postgres + MinIO) end-to-end before pushing to Vercel.
> One artifact, customer-agnostic, re-configurable (C8).
> No SaaS control plane, no multi-instance routing, no automated provisioning.

---

## 1A. Cloud Target — Production (Vercel + Railway Postgres)

> **This §1A is the v1 production deployment path** (ADR-0018). The Docker Compose + Nginx + systemd path in §1–§11 below is the **local full-stack verification lane** (ADR-0017) — run it on the founder's Docker Desktop before pushing to Vercel, but it is not how v1 serves traffic.

### Architecture

```
            ┌──────────────┐         ┌──────────────────────┐
            │   Internet   │         │  Railway             │
            └──────┬───────┘         │  Postgres 16         │
                   │                  │  (managed, PITR)    │
            ┌──────▼─────────────┐    │                      │
            │  Vercel            │────│  DATABASE_URL        │
            │  Next.js serverless│    │  (sslmode=require)  │
            │  TLS / HSTS /      │    └──────────────────────┘
            │  rate-limit (edge) │
            └────────────────────┘
```

- **Vercel** runs the Next.js app as serverless functions and terminates TLS, applies HSTS, and rate-limits at the edge. There is no host nginx, certbot, or systemd in the production path — the platform owns that.
- **Railway** runs managed PostgreSQL 16 with point-in-time recovery (replaces the local `backup.sh`/`restore.sh` for prod data).
- **MinIO / object storage** carries course media (ADR-0010 — signed, short-lived URLs). `/api/health` reports `storage: true` when the S3 env vars are set and the bucket is reachable, and `storage: "skipped"` when storage is unconfigured (e.g. the Vercel serverless lane) — skipped is correct there, not a failure.

### Already provisioned (founder, 2026-07-23)

| Step | Status |
| --- | --- |
| Vercel project created, wired to this GitHub repo | ✅ |
| Railway Postgres provisioned (`DATABASE_URL` / `DATABASE_PUBLIC_URL` available) | ✅ |
| `vercel.json` at repo root — monorepo build config | ✅ |
| `apps/web/next.config.mjs` — `output:"standalone"` gated behind `NEXTJS_STANDALONE=1` | ✅ |
| `apps/web/Dockerfile` — sets `NEXTJS_STANDALONE=1` so Docker keeps standalone | ✅ |

### Set the four required environment variables on Vercel

In the Vercel project: **Settings → Environment Variables** (Production). These four are required for the app to boot and serve:

| Variable | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://<user>:<pass>@<host>:5432/<db>?sslmode=require` | Copy from Railway's **Connect** tab (the **Public URL**). The `?sslmode=require` query is required — Railway's public connection enforces TLS. **If the Railway password contains `/`, `@`, `:`, or `%`, it must be percent-encoded in this URL** (`/`→`%2F`, `@`→`%40`, `:`→`%3A`, `%`→`%25`), or `pg` will misparse the connection string and the app will fail to boot (`apps/web/src/lib/env.ts` fails fast with this hint in prod; warns in dev). |
| `AUTH_SECRET` | 32+ byte base64 random | Generate once: `openssl rand -base64 32`. Never reuse the local-dev value. |
| `AUTH_TRUST_HOST` | `true` | Required by Auth.js v5 on Vercel serverless (X-Forwarded-Proto trust). |
| `NEXTAUTH_URL` | `https://<your-vercel-domain>` | The production Vercel URL, e.g. `https://learning-platform.vercel.app`. Set after the first deploy gives you the real domain. |

Optional:

| Variable | Value | Notes |
| --- | --- | --- |
| `METRICS_TOKEN` | 32 hex chars (`openssl rand -hex 16`) | If you want to scrape `/api/metrics`. If unset, `/api/metrics` returns 503 in prod — non-blocking. |

> The four keys above are the only secrets that must live on Vercel. Do **not** set `POSTGRES_PASSWORD`, `MINIO_*`, `S3_*`, or `BACKUP_DEST` — those are local-lane-only variables from `env.template` and have no meaning on Vercel.

### Deploy

```bash
# Vercel auto-deploys on push to main. Either:
git push origin main                            # triggers a production deploy
# or trigger "Redeploy" from the Vercel dashboard.
```

### Smoke check (post-deploy)

```bash
# Deep health — 200 + status "ok" means DB + auth reachable.
curl -fsS https://<your-vercel-domain>/api/health

# Readiness — 200 + status "ready" means the process is live and configured.
curl -fsS https://<your-vercel-domain>/api/ready
```

**Expected `/api/health` response (note `storage`):**

```json
{ "status":"ok", "checks":{ "db":true, "auth":true, "storage":"skipped" }, "timestamp":"…" }
```

On the **Vercel lane** (no S3 env vars), `storage: "skipped"` is the correct healthy response — course media is only delivered from the Docker lane where MinIO runs. On the **Docker lane**, `storage` should be `true`; a `false` there means MinIO is down or the `MINIO_ROOT_PASSWORD` in `/etc/learning-platform/env` drifted from `S3_SECRET_KEY`. If `/api/health` returns `"status":"degraded"` or HTTP 503, check the failing check — most commonly `DATABASE_URL` (Railway public URL with `?sslmode=require`) or MinIO reachability.

CI's smoke step (`.github/workflows/deploy.yml`) greps only for `'"status":"ok"'`, so a green Vercel deploy + this response passes the gate.

### What Vercel owns (so you don't)

TLS/HSTS headers, HTTPS redirect, edge rate-limiting, and platform-level backups of the *function* runtime are handled by Vercel. Railway owns Postgres backups (PITR). The nginx/certbot/systemd/backup-script machinery in §1–§11 below is for the **local verification lane only** — it is not run in production.

### Rollback (production)

From the Vercel dashboard: **Deployments → previous deployment → Promote to Production**. Vercel keeps instant rollback to any prior deployment; this replaces the Compose SHA-rollback in §6.

---

## 1. Architecture Overview (Local Verification Lane — Docker Compose)

```
                           ┌─────────────────────┐
                           │      Internet       │
                           └──────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  Nginx (host)       │
                           │  TLS termination    │
                           │  HSTS + rate-limit  │
                           │  /api/metrics gated │
                           └──────────┬──────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
    ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
    │   App (3000)  │         │  Postgres     │         │   MinIO       │
    │  Next.js      │         │  16 (5432)    │         │  S3-compat    │
    │  standalone   │         │  pg_data      │         │  9000/9001    │
    └───────────────┘         └───────────────┘         └───────────────┘
```

- **Nginx** runs on the host (systemd), terminates TLS, applies HSTS, rate-limits `/api/`, and gates `/api/metrics` to localhost.
- **App** runs in Docker Compose (`docker-compose.prod.yml`) as a Next.js `standalone` image.
- **Postgres** and **MinIO** ride in the same Compose stack.
- **systemd** unit `learning-platform.service` drives Compose as a service (restart-on-boot, structured logs to journal).

---

## 2. Prerequisites

| Item | Spec |
|------|------|
| VPS | 1× vCPU, 4 GB RAM, 50 GB SSD, Ubuntu 22.04/24.04 LTS |
| DNS | `learning.example.com` → VPS public IP (A/AAAA) |
| TLS | Let's Encrypt (certbot) — auto-renewed |
| Domain | Owner controls DNS; no wildcard unless multiple subdomains |
| User | `deploy` (non-root, in `docker` group) with SSH key access |
| Ports | 22 (SSH), 80 (HTTP→HTTPS redirect), 443 (HTTPS) |

> **C1/C6**: Keep it simple. One VPS, one deploy user, one compose file, one systemd unit.

---

## 3. Host Provisioning (run once)

```bash
# 1. Update + install Docker, compose plugin, certbot, minio client
sudo apt update && sudo apt install -y \
  docker.io docker-compose-plugin certbot minio-client nginx

# 2. Add deploy user to docker group
sudo usermod -aG docker deploy
# → log out / back in as deploy

# 3. Create project directory
sudo mkdir -p /opt/learning-platform
sudo chown deploy:deploy /opt/learning-platform

# 4. Clone repo (or copy from CI artifact)
cd /opt/learning-platform
git clone https://github.com/yaHou110/learning-platform.git .
# or: scp -r .../learning-platform deploy@vps:/opt/learning-platform/

# 5. Create environment file
#
# IMPORTANT: generate the secrets FIRST as shell variables (below), then write the
# env file with an UNQUOTED heredoc (<<EOF, NOT <<'EOF') so the variables expand.
# A single-quoted heredoc (<<'EOF') stores the *literal* command text — e.g.
# AUTH_SECRET=$(openssl rand -base64 32) — as the secret, which is a known string,
# not a random value. That was a defect in an earlier version of this guide.
sudo mkdir -p /etc/learning-platform

# 5a. Generate secrets ONCE into shell variables (256-bit / 64-byte random):
POSTGRES_PASSWORD="$(openssl rand -base64 48 | tr -d '\n' | head -c 64)"
AUTH_SECRET="$(openssl rand -base64 32)"
MINIO_ROOT_PASSWORD="$(openssl rand -base64 48 | tr -d '\n' | head -c 64)"
METRICS_TOKEN="$(openssl rand -hex 16)"   # 32 hex chars (128-bit)

# 5b. Write the env file. UNQUOTED heredoc (<<EOF) so $VARs expand. Do NOT log
#     these; clear the variables after (5c). Keep this terminal private.
sudo cat > /etc/learning-platform/env <<EOF
# Database
POSTGRES_USER=learning_platform
POSTGRES_DB=learning_platform
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Auth
AUTH_SECRET=$AUTH_SECRET
NEXTAUTH_URL=https://learning.example.com

# Object storage (MinIO)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD
S3_BUCKET=learning-platform

# Metrics (optional; if unset, /api/metrics returns 503 in prod)
METRICS_TOKEN=$METRICS_TOKEN

# Backup
BACKUP_DEST=/var/backups/learning-platform
EOF
sudo chmod 600 /etc/learning-platform/env

# 5c. Clear the secret variables from this shell so they don't persist:
unset POSTGRES_PASSWORD AUTH_SECRET MINIO_ROOT_PASSWORD METRICS_TOKEN


# 6. Install Nginx config
sudo cp docs/07-deployment/nginx.conf /etc/nginx/sites-available/learning-platform
sudo ln -sf /etc/nginx/sites-available/learning-platform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 7. Obtain TLS cert (Let's Encrypt)
sudo certbot --nginx -d learning.example.com --non-interactive --agree-tos -m admin@example.com
# → certbot auto-configures HSTS; our nginx.conf also sets it for defense in depth

# 8. Install systemd unit
sudo cp docs/07-deployment/learning-platform.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now learning-platform

# 9. Verify stack comes up
docker compose -f /opt/learning-platform/docker-compose.prod.yml pull
docker compose -f /opt/learning-platform/docker-compose.prod.yml up -d
# Wait 30s, then:
curl -fsS https://learning.example.com/api/health   # → {"status":"ok",...}
curl -fsS https://learning.example.com/api/ready    # → {"status":"ready",...}
```

---

## 4. Daily Operations

### Smoke Test (manual or cron)
```bash
curl -fsS https://learning.example.com/api/health
curl -fsS https://learning.example.com/api/ready
curl -fsS -H "Authorization: Bearer $METRICS_TOKEN" https://learning.example.com/api/metrics | head -5
```

### View Logs
```bash
# App logs (stdout → journal)
journalctl -u learning-platform -f

# Or container logs
docker compose -f /opt/learning-platform/docker-compose.prod.yml logs -f app
docker compose -f /opt/learning-platform/docker-compose.prod.yml logs -f postgres
docker compose -f /opt/learning-platform/docker-compose.prod.yml logs -f minio
```

### Restart Stack
```bash
systemctl restart learning-platform
# or
docker compose -f /opt/learning-platform/docker-compose.prod.yml restart
```

### Update Image (manual, not via CI)
```bash
cd /opt/learning-platform
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

---

## 5. Backup & Restore

### Backup (daily cron, e.g., 03:00)
```bash
# /etc/cron.d/learning-platform-backup
0 3 * * * deploy /opt/learning-platform/scripts/deployment/backup.sh
```

Outputs to `/var/backups/learning-platform/YYYYMMDDTHHMMSSZ/` with:
- `postgres.sql.gz` — full DB dump
- `minio/` — object bucket mirror
- `MANIFEST` — sha256 + metadata

Retention: 30 days (pruned by script).

### Restore
```bash
# Latest backup
sudo /opt/learning-platform/scripts/deployment/restore.sh --latest

# Specific backup
sudo /opt/learning-platform/scripts/deployment/restore.sh \
  /var/backups/learning-platform/20260720T030000Z
```

---

## 6. Rollback

The CI `deploy.yml` auto-rolls back on smoke-test failure (restarts previous Compose containers).

**Manual rollback:**
```bash
# Compose keeps the old containers stopped; just force-recreate them
docker compose -f /opt/learning-platform/docker-compose.prod.yml up -d --force-recreate --remove-orphans
```

---

## 7. Security Hardening Checklist

- [ ] `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `AUTH_SECRET`, `METRICS_TOKEN` are high-entropy (64+ chars).
- [ ] `/etc/learning-platform/env` is `chmod 600`, owned by `root:deploy`.
- [ ] UFW: allow 22, 80, 443; deny all else (`sudo ufw enable`).
- [ ] Fail2ban on SSH (`sudo apt install fail2ban`).
- [ ] SSH key-only auth (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
- [ ] Nginx rate-limit zone `lp_api` active (10 req/s burst 20).
- [ ] `/api/metrics` gated by Nginx `allow 127.0.0.1/::1` + bearer token in-app.
- [ ] HSTS header present (`curl -I https://learning.example.com | grep -i strict-transport-security`).
- [ ] CSP header present (`curl -I https://learning.example.com | grep -i content-security-policy`).

---

## 8. CI/CD Pipeline (deploy.yml)

| Stage | What it does |
|-------|--------------|
| `build-and-push` | Builds `apps/web/Dockerfile` → pushes `ghcr.io/<repo>/web:<sha>,latest` |
| `deploy` | SSH to host → `docker compose pull` → `up -d` → smoke tests `/api/health`, `/api/ready`, `/api/metrics` |
| `rollback` | On failure, restarts previous containers via `docker compose up -d --force-recreate` |

**Required GitHub secrets:**
| Secret | Description |
|--------|-------------|
| `PROD_HOST` | VPS IP or hostname |
| `PROD_USER` | SSH user (`deploy`) |
| `PROD_SSH_KEY` | Base64-encoded private key |
| `PROD_ENV` | Path on host (`/etc/learning-platform/env`) |
| `GHCR_TOKEN` | PAT with `write:packages` (or use `GITHUB_TOKEN`) |

---

## 9. Troubleshooting

| Symptom | Check |
|---------|-------|
| `502 Bad Gateway` | `docker compose ps` → is `app` healthy? `journalctl -u learning-platform -f` |
| `certbot` renewal fails | `nginx -t` → cert paths correct? `/.well-known/acme-challenge/` allowed in Nginx? |
| `pg_dump` fails | `POSTGRES_PASSWORD` in env matches DB? port 5432 published on 127.0.0.1? |
| `mc mirror` fails | MinIO healthcheck passed? `MINIO_ROOT_USER/PASSWORD` correct? |
| CI deploy fails | SSH key in `PROD_SSH_KEY`? `PROD_HOST` reachable? `GHCR_TOKEN` has `write:packages`? |

---

## 10. Scaling Notes (future)

| Trigger | Action |
|---------|--------|
| CPU/RAM > 80% sustained | Upgrade VPS (C1 allows up to 4 GB; next tier is 8 GB) |
| >1 customer signed | Add per-tenant `docker compose` stacks + Nginx upstream per tenant; ADR-0007 §When-to-revisit |
| Object storage > 100 GB | Migrate MinIO to dedicated host / managed S3 (ADR-0010) |
| Need zero-downtime deploys | Add second app container + blue/green in Nginx (not v1) |

---

## 11. Appendix: File Locations

| File | Purpose |
|------|---------|
| `apps/web/Dockerfile` | Multi-stage Next.js standalone builder |
| `docker-compose.prod.yml` | App + Postgres + MinIO |
| `.dockerignore` | Build context pruning |
| `docs/07-deployment/nginx.conf` | TLS + HSTS + rate-limit + metrics gate |
| `docs/07-deployment/learning-platform.service` | systemd unit driving Compose |
| `scripts/deployment/backup.sh` | Daily pg_dump + MinIO mirror + manifest |
| `scripts/deployment/restore.sh` | Idempotent restore from backup dir |
| `.github/workflows/deploy.yml` | CI: build → push → SSH deploy → smoke test → rollback |
| `/etc/learning-platform/env` | All production secrets (host only, not in repo) |
| `/var/backups/learning-platform/` | Backup retention (30 days) |

---

*Generated as part of SPRINT-001 M6. Evidence in `docs/06-sprints/SPRINT-001-production-foundation/evidence/M6-deployment/`.*