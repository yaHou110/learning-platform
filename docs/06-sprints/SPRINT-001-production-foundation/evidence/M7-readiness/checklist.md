# M7 — Production Readiness Review — Checklist

> **Status:** ⏳ Pre-flight checklist (drafted 2026-07-21 after M6 merged).
> **Purpose:** The final gate of SPRINT-001 (Production Foundation). When every
> item below is ✓ and the founder signs off, the SPRINT-001 feature gate lifts
> and new business features (Catalog, Learning, Credentials, Localization,
> Dashboard, Event Bus, **PWA** per ADR-0016) become in-scope.
>
> Unlike M1–M6 (which mostly ran on localhost), M7 items are **founder-operational**:
> they require a real VPS, DNS, TLS, and repo secrets — i.e. human/infra action,
> not code. This checklist exists so that the moment infra is provisioned, M7 is
> a matter of ticking boxes, not a research project.

---

## Pre-requisite: M6 on `main` (✅ done 2026-07-21)
- [x] PR #6 merged → `main` (merge `26d9433`).
- [x] `main` Governance CI green.
- [x] `main` Security Audit (OSV) CI green — 0 vulnerabilities.
- [x] M6 deployment artifacts verified locally (build + compose-up + endpoints
      + backup/restore round-trip; see `M6-deployment/output-*.txt`).

---

## 1. Infrastructure provisioning (founder action)
- [ ] Provision a single VPS ≤ 4 GB RAM (ADR-0007) — Ubuntu LTS recommended.
- [ ] Point a real DNS A/AAAA record at the VPS public IP.
- [ ] Open UFW: allow 22, 80, 443; deny all else (per DEPLOYMENT_GUIDE §7).
- [ ] Enable fail2ban on SSH; switch SSH to key-only auth.
- [ ] Create the `deploy` user + `/opt/learning-platform` checkout.

## 2. Runtime env + secrets (founder action)
- [ ] Generate high-entropy secrets (64+ chars): `POSTGRES_PASSWORD`,
      `MINIO_ROOT_PASSWORD`, `AUTH_SECRET`, `METRICS_TOKEN`.
- [ ] Write `/etc/learning-platform/env` on the host; `chmod 600`, owner `root:deploy`.
- [ ] Add GitHub **repo secrets** (Settings → Secrets and variables → Actions):
      `GHCR_TOKEN`, `PROD_HOST`, `PROD_SSH_KEY`, `PROD_ENV`.
- [ ] (Optional) Enable GitHub Code Scanning so the OSV SARIF upload succeeds
      instead of being a best-effort no-op (the upload step has
      `continue-on-error: true`, so CI is green regardless).

## 3. TLS + host-level reverse proxy (founder runs the guide)
- [ ] Run the `DEPLOYMENT_GUIDE.md` §3 provisioning + certbot (Let's Encrypt).
- [ ] Confirm HSTS header on the public URL:
      `curl -I https://<domain> | grep -i strict-transport-security`.
- [ ] Confirm Nginx `/api/metrics` is localhost-gated + in-app bearer token (double gate).

## 4. First real deployment (CI/CD)
- [ ] The next push to `main` triggers `deploy.yml`: build → push GHCR → SSH deploy.
- [ ] Real-domain smoke:
  - [ ] `https://<domain>/api/health` → 200 (`db:true, auth:true`).
  - [ ] `https://<domain>/api/ready`  → 200.
  - [ ] `https://<domain>/api/metrics` → 401 without token, 200 with token.
  - [ ] Home page loads; `/login` reachable.
  - [ ] Prometheus scrape from `127.0.0.1:3000/api/metrics` (token) returns metrics.
- [ ] `deploy.yml` auto-rollback path verified (or a deliberate manual rollback drill).

## 5. Operational readiness
- [ ] Backup cron installed (`/etc/cron.d/learning-platform-backup`, daily 03:00).
- [ ] One real backup taken; restore drill recovers to a known state on a *second* volume.
- [ ] Log view working: `docker compose logs -f` + journald for the systemd unit.
- [ ] Healthcheck alerts wired (external uptime check hitting `/api/ready`).

## 6. Founder sign-off (the gate lift)
- [ ] No red on `main` (governance + security + deploy).
- [ ] All §§1–5 ticked; evidence noted below.
- [ ] Founder records sign-off date below → SPRINT-001 feature gate lifts.

---

## Sign-off

- **Founder sign-off:** _<to be filled on VPS live + green deploy>_
- **Date:** _<YYYY-MM-DD>_
- **`main` HEAD at sign-off:** _<commit>_
- **Evidence:** links/screenshots of real-domain smoke + restore drill appended here.

---

## What unblocks on sign-off
SPRINT-001 feature gate lifts. Newly in-scope:
- **PWA / offline** (ADR-0016 — founder YES) — service worker + web manifest +
  offline content; the new "Learning" bounded context.
- Catalog API + UI (CourseCard, LessonList).
- Learning plugin (enrollment, progress, offline-aware).
- Credentials plugin (issuance, verification).
- Localization plugin (Shamsi dates, real i18n).
- Dashboard.
- Event bus infra (ADR-0011).

> These were parked per the founder directive of 2026-07-11; per `stop-only-at-exit-conditions`
> governance memory, they stay parked until this M7 sign-off is recorded.
