# M7 — Pre-Provision Checklist: what to prepare *before* the VPS arrives

> **Status:** Prep-only plan. Created 2026-07-21 after the founder decided to buy a VPS.
> **Purpose:** Make the moment the VPS is in hand a box-ticking exercise, not a
> research project. Split by **Claude can do now (no VPS, no GitHub)** vs
> **founder does (needs the VPS / GitHub / DNS)**, sequenced so every founder step
> has its Claude-prep counterpart already done.
> **Companion to:** `checklist.md` (the post-VPS live readiness review → sign-off → gate lift).
> **GitHub status:** currently parked. Several "founder" steps below (repo secrets,
> `deploy.yml` CI run) are blocked until GitHub is un-parked — those are flagged 🚫GH.

---

## Defects in M6 deploy artifacts found during this prep (Claude to fix now)

Both are real and only surface at real-deploy time. Fixing them now means the day
you get a VPS you deploy from *correctly committed* artifacts, not a branch full of
late fixes.

1. **`docker-compose.prod.yml` has no `image:` field** — the `app` service only has a
   `build:` block. But `.github/workflows/deploy.yml` pushes to GHCR and then runs
   `docker compose ... pull` on the host. With no `image:` directive, `pull` pulls
   nothing and the host builds locally instead. The deploy.yml comment even says
   "we assume the compose file uses `image: ghcr.io/.../web:latest`" — it doesn't.
   → Add `image: ghcr.io/yahou110/learning-platform/web:latest` to the `app` service,
   keep `build:` for local/Docker-Desktop use, so the same file works both ways.

2. **`DEPLOYMENT_GUIDE.md` §3 step 5 writes a literal `$(openssl rand -base64 32)`**
   inside a heredoc — the `$(...)` is never evaluated, so it stores the literal
   command text as the `AUTH_SECRET`. Subscriber would ship with a guessable "secret"
   that is a known command string.
   → Replace the heredoc's `AUTH_SECRET=` line with an instruction to run the
   openssl command first, or generate the secrets *before* writing the file (Claude
   can pre-generate all secrets locally and hand you real values + a ready env file).

3. **Nothing in the deploy path runs database migrations.** The prod Docker image
   (`apps/web/Dockerfile`, Next.js `standalone`) excludes `packages/core/src/db/migrations/`,
   and `deploy.yml` / `docker-compose.prod.yml` / the systemd unit / the guide all
   just `compose up` the app. Result, observed live 2026-07-22: a fresh stack boots
   the app into a schema-less DB → `/api/health` returns `degraded (db:false, auth:false)`
   while `/api/ready` stays 200 (it checks config only) — so the fault hides behind a
   shallow readiness check. On a real VPS this would make `deploy.yml`'s smoke grep on
   `"status":"ok"` fail and **roll back a perfectly good release**.
   → Fixed via **ADR-0017**: a one-shot, idempotent `migrate` service in
   `docker-compose.prod.yml` reusing the app image's builder stage (which has tsx +
   drizzle-orm + pg + the source) to run the real Drizzle `migrate()` against the prod
   `DATABASE_URL`, before `app` boots (`depends_on: service_completed_successfully`).
   Containerized (not host `pnpm db:migrate`) so it works on Docker-only hosts with no
   host Node toolchain — i.e. on the founder's Docker Desktop on Windows today, and on a
   minimal VPS later. See `docs/05-decisions/ADR-0017-containerized-db-migrations.md`.

---

## Phase 0 — Claude prep (do now, no VPS / no GitHub needed)

Everything here is pure-local code + artifact work. Vault these so the VPS day is
just "run the guide."

- [ ] **CP0.1** Fix defect #1: add `image:` to `app` in `docker-compose.prod.yml`
      (keep `build:` for local). Verify `docker compose -f docker-compose.prod.yml
      config` is still valid.
- [ ] **CP0.2** Fix defect #2: rewrite the env-template heredoc in
      `DEPLOYMENT_GUIDE.md` §3 step 5 so secrets are real generated values, not
      unevaluated `$(...)` strings. Add a "generate secrets first" sub-step.
- [ ] **CP0.3** Generate real high-entropy secrets locally and write them to a
      **gitignored** file you'll paste into the VPS env: `POSTGRES_PASSWORD` (64),
      `AUTH_SECRET` (base64 32), `MINIO_ROOT_PASSWORD` (64), `METRICS_TOKEN` (32).
      Use `openssl rand -base64` / `openssl rand -hex`. Do NOT commit. (Replaces the
      throwaway `.env` dummy values.)
- [ ] **CP0.4** Pre-generate a ready-to-paste `/etc/learning-platform/env` template
      with the real secrets from CP0.3 + the right `NEXTAUTH_URL=https://<your-domain>`
      placeholder. Leave only `<your-domain>` blank for you to fill once you choose
      the domain. Commit only the *template* (no secrets); the real one stays local.
- [ ] **CP0.5** De-risk `nginx.conf` — it is the one committed artifact never run
      anywhere. Stand it up locally behind a self-signed cert on `localhost` (nginx
      in a container, fronting the standing compose stack), run `nginx -t`, and curl
      `https://localhost` to confirm: HSTS header present, the other security headers
      present, `/api/metrics` gated (403 from the proxy without the allow rule
      passing), `/api/health` + `/api/ready` proxy cleanly. This is the local-TLS
      harness from the earlier M7-local plan; it proves the file is correct before a
      paid host exists. Fix any syntax/logic bug found here.
- [ ] **CP0.6** Add a `deploy.yml` dry-run path that works *without* committing to
      prod: print the exact SSH commands it would run, so you can eyeball them at VPS
      time. (Optional; nice-to-have.)
- [ ] **CP0.7** Extend this repo's handoff + the M7 `checklist.md` so the live
      sign-off checklist (§§1–5) already references the Claude-prep done above and
      the GitHub-unblock decision (see F-GH below).
- [ ] **CP0.8** Run `pnpm verify && pnpm governance:validate:local` after CP0.1–0.6
      so the prep changes themselves are green before they sit.

---

## Phase F — Founder steps (in order, up to "VPS in hand")

These need the VPS, GitHub, or DNS — you do them. Each has the Claude-prep it
depends on noted. Sequenced so you never hit a step whose prep isn't done.

### F0 — Decisions you make *before* buying (no VPS yet)
- [ ] **F0.1 Domain name.** Decide the real domain (e.g. `hawza.example.ir`). This
      is needed for Let's Encrypt (CP0.4 placeholder → fill here) and is the public
      URL the M7 smoke tests target. (You control DNS, per guide §2.)
- [ ] **F0.2 GitHub decision 🚫GH.** We parked GitHub. Two real options:
   - (a) **Un-park GitHub** and use `deploy.yml` CI/CD as designed (build → GHCR →
     SSH deploy). Requires adding GitHub repo secrets (F2.1). **Recommended** — it's
     the architecture ADR-0007 + the guide §8 describe.
   - (b) **Stay parked** and deploy manually: build the image on the VPS (or `scp`
     it) + `docker compose up -d`. No GitHub, no repo secrets, but you lose the
     auto-rollback + on-push delivery. The guide §3 step "or: scp -r" already lists
     the manual fallback.
   Decide one. If (b), tell Claude to add a manual-deploy runbook section and skip F2.1.

### F1 — Buy + provision the host (the VPS-in-hand phase)
- [ ] **F1.1 Purchase** a VPS ≤ 4 GB RAM, 50 GB SSD, Ubuntu 22.04 or 24.04 LTS
      (ADR-0007 C1; guide §2). Any provider. Record IP.
- [ ] **F1.2 DNS** — point an A/AAAA record for your domain (F0.1) at the VPS IP.
- [ ] **F1.3 First login + harden SSH** — create the `deploy` user, switch SSH to
      key-only auth, generate the SSH keypair (this becomes `PROD_SSH_KEY`), enable
      `fail2ban`, set UFW: allow 22/80/443, deny else (guide §3 + §7).
- [ ] **F1.4 Install stack deps** — `apt install docker.io docker-compose-plugin
      certbot minio-client nginx` (guide §3 step 1); `usermod -aG docker deploy`.
- [ ] **F1.5 Get the code onto the host** — `git clone
      https://github.com/yaHou110/learning-platform.git .` into `/opt/learning-platform`
      (GitHub must be un-parked for this — choice F0.2a) **OR** `scp -r` the repo
      (choice F0.2b). *(Guide §3 step 4.)*

### F2 — Secrets + CI wiring
- [ ] **F2.1 GitHub repo secrets 🚫GH** (only if F0.2a): Settings → Secrets and
      variables → Actions: `GHCR_TOKEN`, `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`
      (base64 of the private key), `PROD_ENV` (`/etc/learning-platform/env`).
- [ ] **F2.2 Host env file** — write `/etc/learning-platform/env` from the
      Claude-prepped template (CP0.4) with your domain (F0.1) filled in and the real
      secrets (CP0.3). `chmod 600`, owner `root:deploy`.

### F3 — TLS + proxy live
- [ ] **F3.1 certbot** — `certbot --nginx -d <your-domain>` (guide §3 step 7). Let's
      Encrypt issues the real cert that `nginx.conf` (already validated in CP0.5)
      mounts.
- [ ] **F3.2 Install nginx.conf** — `cp` guide §3 step 6; `nginx -t`; `systemctl
      reload nginx`. The config itself was already proven correct in CP0.5.

### F4 — Bring the stack up (the "VPS in hand → serving" step)
- [ ] **F4.1 systemd** — install `learning-platform.service`, enable (guide §3 step 8).
- [ ] **F4.2 Up** — `docker compose -f docker-compose.prod.yml up -d` (or, with
      F0.2a: the next push to `main` runs `deploy.yml` and does this + the smoke test
      automatically).
- [ ] **F4.3 Live smoke** — `curl https://<your-domain>/api/health` (200), `…/ready`
      (200), `…/api/metrics` (401 no-token / 200 token). Home loads, `/login` reached,
      HSTS + CSP headers present (guide §7). This is M7 §4.
- [ ] **F4.4 Backup + restore drill** — run `scripts/deployment/backup.sh` then
      `restore.sh --latest` against a second volume (M7 §5). (Logic already proven
      locally in M6; here it runs against real data.)

### F5 — Founder sign-off (gate lift)
- [ ] **F5.1** No red on `main` (governance + security + deploy). All prep (Phase 0)
      + F1–F4 ticked. Record date + `main` HEAD in M7 `checklist.md` §Sign-off.
- [ ] **F5.2** Feature gate lifts → PWA/offline (ADR-0016), Catalog, Learning,
      Credentials, Localization, Dashboard, Event Bus become in-scope.

---

## Dependency order (what can't start until what)

```
CP0.1/0.2/0.3/0.4/0.5 (Claude, parallel, now)
        │
        ▼
F0.1 domain + F0.2 GitHub decision  (founder, no VPS)
        │
        ▼
F1.1 buy VPS  →  F1.2 DNS  →  F1.3 SSH harden  →  F1.4 install deps  →  F1.5 get code
        │
        ▼
F2.2 host env (uses CP0.3+0.4)  +  F2.1 repo secrets (if F0.2a) 🚫GH
        │
        ▼
F3.1 certbot  →  F3.2 install nginx (already validated CP0.5)
        │
        ▼
F4.1 systemd  →  F4.2 up  →  F4.3 live smoke (M7 §4)  →  F4.4 restore drill (M7 §5)
        │
        ▼
F5.1 sign-off  →  F5.2 gate lifts (PWA etc. unblocked)
```

**The single earliest thing you can do without me having finished any prep:**
F0.1 (pick a domain) and F0.2 (GitHub decision). Everything else chains off prep
that is fast and free for me to complete first.

---

## What's NOT on this list (intentionally)

- New business features (PWA, Catalog, Learning, etc.) — gated behind F5.2.
- Re architecting the topology (laptop-as-host / Cloudflare Tunnel) — ADR-0007 says
  VPS; a topology change needs a new ADR, out of scope here.
- The parked TaskOutput handoff PR #7 — unrelated tooling side-track; its `deploy.yml`
  interactions are orthogonal to prod deploy.
