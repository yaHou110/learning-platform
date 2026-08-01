# Changelog

All notable changes to the **Learning Platform** repository will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Convention**: each repo-level version is the documentation version (Engineering Protocol),
> not the product version. Product versions are tracked in `docs/01-product/ROADMAP.md`.
>
> _Note: a file rename refactor was applied on 2026-07-12 (`NEXT_SESSION.md` → `PROJECT_BACKLOG.md`, `PROJECT_BOOTSTRAP.md` → `PROJECT_FOUNDATION.md`, `MASTER_HANDOFF.md` → `PROJECT_HANDOVER.md`). Historical entries below intentionally keep the old filenames — the changelog is append-only._

---

## [Unreleased]

### Fixed
- **Production env validation moved from import-time to server-boot (fixes the red CI / failed Vercel deploy on PR #9).** `apps/web/src/lib/env.ts` previously asserted `AUTH_SECRET` length and `DATABASE_URL` validity eagerly while building the `env` object at module-import. `next build` imports every route module under `NODE_ENV=production` to collect page data; in a *clean* build environment (CI checkout, the Docker builder stage, Vercel build) there is no `.env` and no runtime secret, so the env fallback (`dev-secret-change-in-production`, 31 bytes and on the denylist) tripped the assertion at import → `Failed to collect page data for /api/auth/[...nextauth]` → `next build` exit 1. The new `assertProductionEnv()` is invoked ONCE at server boot from a new `apps/web/src/instrumentation.ts` `register()` hook (runs at `next start` / serverless cold start, NOT during `next build`), guarded by a `NEXT_PHASE` build-phase backstop. So every clean environment builds again while the fail-closed guarantee holds at runtime — a misconfigured production deploy (missing/short/placeholder `AUTH_SECRET` or an unparseable `DATABASE_URL`) refuses to start instead of silently signing JWTs with a known dev secret. The import path keeps dev warnings (DX); `env.ts` no longer throws at import. Regression-locked by `apps/web/tests/env.test.ts` (7 cases: short/placeholder secret, unparseable/no-host `DATABASE_URL`, happy path, build-phase skip, dev/test skip). Preserves the operator-facing error messages and the `requireDatabaseUrl` percent-encoding hint from the M7 data-layer audit.
- **Local `pnpm verify` now matches CI on a clean checkout.** Added `**/*.d.ts` to `packages/core/.eslintrc.cjs` `ignorePatterns`. TypeScript declaration files are gitignored (`packages/**/src/**/*.d.ts`) but ESLint in legacy-config mode walks all files matching `--ext .ts` regardless of `.gitignore`, so leftover `.d.ts` build artifacts in the local working tree (from prior `tsc`/`pnpm verify` runs) caused 28 lint errors. CI never saw them because `git checkout` surfaces only tracked files. Restores local/CI parity (QUALITY_GATES.md "Local pnpm verify should match CI"; ENGINEERING_PROTOCOL.md §32 — CI/CD alignment).
- **Handoff script idempotency: commit-then-push on re-run.** `scripts/handoff/Invoke-TaskOutput.ps1` Stage 4 now detects an empty staged set after `git add -A` (via `git diff --cached --quiet`) and skips `git commit`, proceeding directly to push. Previous behavior treated commit as mandatory — if run again after the commit already existed (e.g., an interrupted handoff where commit = 4804214 was created but push never completed due to session crash), `git commit` failed with "nothing to commit" → script exit 5 → blocked Stop hook → loop. This makes the handoff chain safely re-runnable.
- **Production deployment docs made true + correct smoke expectation.** `docs/07-deployment/DEPLOYMENT_GUIDE.md` gains §1A "Cloud Target — Production (Vercel + Railway Postgres)" — the cloud-target section the [Unreleased] "Added" entry above references but that had not actually been written: architecture, the already-provisioned C1–C5 steps, the four required Vercel env vars (`DATABASE_URL` from Railway's public URL with `?sslmode=require`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXTAUTH_URL`), deploy, and the post-deploy `/api/health` + `/api/ready` smoke check. Health-check expectation corrected across `PROJECT_STATE.md`, `PROJECT_BACKLOG.md`, `SPRINT-001-production-foundation.md`, and `evidence/M7-readiness/checklist.md`: `/api/health` returns `storage:"skipped"` (object storage is not wired in production v1; ADR-0010 proposed), **not** `storage:true` — the prior text would make a healthy Vercel deploy look broken. `health.check()` in `packages/core/src/api/index.ts` (M5) already reports `"skipped"`; only the docs were wrong. ADR-0018 is left as-is (append-only). The Docker Compose + nginx + systemd path demoted in the guide to the local verification lane (ADR-0017).
- **RLS policies hardened against a future least-privilege role collapse (M7 data-layer audit).** `packages/core/src/db/migrations/0000_nosy_kang.sql`: both tenant-isolation policies now read `current_setting('app.tenant_id', true)` — the `missing_ok` second arg — so an **unset** `app.tenant_id` GUC (the v1 state: `getDb()` never sets it; the deprecated `withTenantDb` is the only setter) returns NULL instead of raising `unrecognized configuration parameter`. `NULL::uuid ≠ tenant_id` ⇒ the policy hides all rows rather than hard-erroring. Without this, the natural M7 hardening step of running the app as a non-owner (`FORCE ROW LEVEL SECURITY`) would make every `users`/`tenants` query error out instead of returning zero rows. The `CREATE POLICY` statements are now idempotent (`DO $$ … EXCEPTION WHEN duplicate_object`), matching the FK block at the top of the migration. v1's documented model (app-layer WHERE carries isolation; RLS is defense-in-depth) is unchanged — the table owner still bypasses RLS; full activation (`FORCE` + non-owner role + per-request `SET LOCAL`) is escalated as a founder decision under ADR-0008 trigger #2 (evidence: `evidence/M7-readiness/M7-data-layer-hardening.md`). Note: existing dev DBs keep the prior policies (Drizzle `__drizzle_migrations` does not re-run `0000`); fresh provisions get the hardened ones.
- **`DATABASE_URL` fail-fast validation at boot (M7 data-layer audit).** `apps/web/src/lib/env.ts` `requireDatabaseUrl()` parses the connection URI and, in production, throws an actionable error — naming the percent-encoding fix (`/`→`%2F`, `@`→`%40`, `:`→`%3A`, `%`→`%25`) — if the URL is unparseable or has an empty hostname (the exact signal of an unencoded `/` or stray `@` in the password segment that terminates the URL authority before the host). In dev/test it warns only so tests importing `auth` (→ `env` at startup) keep booting under the plain dev default. Rails-postgres passwords can contain `/ @ : %`; an unencoded one made `pg` misparse the connection string and the app 503'd during production debugging. `apps/web/.env.example` + `docs/07-deployment/DEPLOYMENT_GUIDE.md` §1A carry the operator-facing note. No false positive on a valid Railway URL (`postgresql://user:pass@host:5432/db?sslmode=require`).
- **Login timing equalization closes a user-enumeration oracle.** `packages/core/src/auth/credentials.ts` now pays a `bcrypt.compare` at the same cost factor on the `unknown_tenant` / `unknown_user` / `inactive` early-return paths (via a memoized dummy hash, `timingEqualize()`), so every login attempt costs ~`BCRYPT_COST` regardless of outcome. Without this, a missing tenant/user returned in <1 ms while a bad password paid ~250 ms — a latency oracle that enumerated valid (tenant, email) pairs despite the generic login error. The compare result is discarded; the dummy hash's plaintext is a throwaway, not a secret.
- **Rate-limit key can no longer be spoofed via `X-Forwarded-For`.** `apps/web/src/lib/rate-limit.ts` `ipKey()` now prefers `X-Real-IP` and trusts only the single-hop `X-Forwarded-For` (after the nginx fix below), never the client-supplied leftmost XFF chain entry. Previously an attacker could mint a fresh leftmost XFF entry per request and reset their own IP-keyed rate-limit bucket, defeating login brute-force / session-probing limits. `docs/07-deployment/nginx.conf` now **overwrites** `proxy_set_header X-Forwarded-For $remote_addr;` (instead of `$proxy_add_x_forwarded_for`), discarding any forged hop so `ipKey()` sees only the real client. Tests added in `apps/web/tests/rate-limit.test.ts`.
- **Credential-submit path now rate-limited (brute-force / credential-stuffing cap).** `apps/web/src/app/api/auth/[...nextauth]/route.ts` gates `POST /api/auth/[...nextauth]` (the Auth.js credentials submission, the only in-app surface running `bcrypt.compare` for a password guess) with an un-spoofable IP-keyed token-bucket (10 burst, 1 token / 5s sustained). A real user retries a wrong password a handful of times then pauses; a bot hammering guesses exhausts the bucket and gets 429 + `Retry-After`. A per-account database-backed lockout (distributed stuffing, many IPs vs one account) is surfaced as a founder decision, not auto-applied — it needs a schema migration and a policy decision (N, cool-down, self-service unlock).
- **Demo credentials no longer leaked in production.** `apps/web/src/app/login/page.tsx` gates the sample-account hint (`مرکز demo`, `admin@lp.local`, `changeme`) behind `process.env.NODE_ENV !== "production"`, so production visitors don't see the seeded admin credentials that work against the dev/local-lane DB.
- **Open redirect on the login `callbackUrl` closed (HIGH).** `apps/web/src/app/login/page.tsx` passed `searchParams.callbackUrl` straight into `signIn({ redirectTo })`; `next-auth` v5 routes that into `redirect(redirectUrl)` with no same-origin constraint (verified in `node_modules/next-auth/src/lib/actions.ts`), so `/login?callbackUrl=https://evil.com` (or the protocol-relative `//evil` / backslash `\\evil` forms browsers normalize to it) bounced a freshly-authenticated user off-site. New `apps/web/src/lib/redirect.ts` `safeCallbackUrl()` collapses any caller-supplied value whose resolved `origin` ≠ the request's own (`new URL(raw, origin).origin === origin`) to `/`, keeping only same-origin pathname+search+hash — origin derived from `x-forwarded-proto`/`x-forwarded-host`/`host` so it holds behind nginx and on Vercel. The AI's weaker `startsWith("/") && !startsWith("//")` guard was rejected: it passes the backslash bypass (`\\evil.com` → browsers → `//evil.com`). Locked by `apps/web/tests/redirect.test.ts` (external, protocol-relative, backslash, malformed, same-origin incl. query/hash, unknown-origin).
- **Metrics bearer-token compare made timing-safe (HIGH).** `apps/web/src/app/api/metrics/route.ts` compared the inbound `Bearer` token to `METRICS_TOKEN` with a plain `!==` — a short-circuiting string compare leaking the correct-token prefix byte-by-byte through response latency, a side channel on the shared scrape secret even though the endpoint is an internal target behind the reverse proxy. Now uses `crypto.timingSafeEqual` over equal-length UTF-8 buffers with a length-mismatch short-circuit that refuses (401) without comparing (`timingSafeEqual` throws on unequal lengths). Locked by `apps/web/tests/metrics-route.test.ts` (correct token 200, wrong/prefix/missing/non-Bearer 401, no-token-configured prod 503 / dev 200).
- **`/api/auth/session` error envelope + observability brought to parity (MED).** The session route returned a bare `{ error: "Unauthorized" }` (and the rate-limit 429 body carried no `requestId`) while `/api/users` uses the full request-id + Prometheus metrics + `captureError` envelope with the `x-request-id` response header. A support report on a 401/429/5xx here did not correlate to a server log line. The route now mirrors `/api/users`' exact shape — one shared envelope, `{ error, requestId }` for 401/429 (the public `code` field appears only on the `captureError` 5xx path, so no route invents an ad-hoc one); every response carries `x-request-id`; success and failure both record `http_requests_total` + the latency histogram. No invented `UNAUTHORIZED` code (the AI's proposed body would have re-introduced the inconsistency it claimed to fix).
- **`@learning-platform/contracts` promoted from decorative dep to enforced SSOT (MED).** `packages/contracts` was wired into 8 tsconfigs and as a `workspace:*` dep of apps/web + 4 plugins, yet its runtime exports (`EventNames`, the `AuthLogin*Payload` Zod schemas) had **zero source importers** — declared event names were duplicated as string literals across plugin manifests, with nothing enforcing agreement. `packages/core/src/plugins/registry.ts` now imports `EventNames` from contracts and tightens `EventRefSchema.name` from `z.string().min(1)` to `z.enum(EventNames)`, so a plugin manifest declaring an event outside the contracts enum fails `register()` at load. The same file also pins the long-claimed `migrations: []` ("plugins own no DDL") rule in the **schema** (`z.array(z.string()).max(0)`) rather than a never-materialized ESLint rule — verified the 5 plugin eslintrc files only restrict `drizzle-orm`/`pg` imports, so the schema is the real enforcer. The AI's "delete the package — zero consumers" premise was false (grep showed it wired everywhere), and a contracts→plugins test would invert the dependency; `core → contracts` is the correct foundational direction (contracts depends only on zod, no cycle). `packages/core/package.json` declares the now-real runtime dep and `packages/core/vitest.config.ts` gains the matching source alias (mirroring the plugin configs). `packages/core/tests/registry.test.ts` flipped: the case that pinned the *non-enforcing* `.not.toThrow()` behavior now asserts the corrected `.toThrow(/migrations/)`, plus enum-rejection and EventNames-acceptance cases.
- **Governance test for implemented→declared route coverage (MED).** A repo audit found 13 manifest-declared `apiRoutes` (plugin-catalog 7, plugin-learning 4, plugin-credentials 2) whose route files do not yet exist — intentional forward-declared surface. The AI's literal "fail CI if any declared route has no file" gate would red CI permanently on all 13 (self-contradictory against "do not remove the planned routes"). New `apps/web/tests/manifest-route-coverage.test.ts` enforces the useful, green-today inverse invariant: every *implemented* `apps/web/src/app/api/**/route.ts` file is either declared by some plugin manifest (its bounded context owns it) or is an explicitly-listed infra route (`/api/health`, `/api/ready`, `/api/metrics` — M5 operational surface no plugin claims). Catches a future orphan route added without a manifest, without penalizing intentional planned routes. Match logic handles App-Router dynamic segments: `[id]` ↔ manifest `:param`, catch-all `[...nextauth]` ↔ the manifest's `/api/auth/login|logout` declarations so the Auth.js catch-all is correctly covered.

### Added
- **SPRINT-002 S2 — Catalog & Learning UI (student flow + admin management + dashboard + demo seed).** The bounded-context APIs from S1 now have a full RTL Persian interface. New `apps/web/src/components/AppShell.tsx` (shared header/nav + sign-out action) and 7 auth-gated pages: `/` (role-aware home cards), `/courses` (catalog browse — published only for students, drafts+status badges for admins), `/courses/[id]` (detail + enroll server action + lesson list with ✓ state and progress bar), `/courses/[id]/lessons/[lessonId]` (lesson view with contentType placeholder since v1 has no object storage (ADR-0010 proposed) + «دیدم» server action that records progress and flips the enrollment on the last lesson), `/dashboard` (admin: tenant stats + courses table with lesson/enrollment counts; student: my enrollments with progress bars), `/admin/courses` (create-course form, publish button) and `/admin/courses/[id]/lessons` (add-lesson form with type/contentRef, ordered list, publish). Every page is middleware-auth-gated (307 → /login) and every server action re-checks the session and role inside the action. Core gained `learning.listProgress(tenantId, enrollmentId)` (progress UI) and re-exports `Course`/`Lesson` types. `seed-dev.ts` now seeds an idempotent published demo course («دوره مقدماتی فقه (دمو)») with 5 lessons so the student flow is demoable out of the box (select-then-insert — `courses` has no (tenant_id, title) unique constraint, so ON CONFLICT is not usable). Verified: `pnpm verify` green (82 web + 19 core tests unchanged, typecheck clean, `next build` succeeds with 7 new pages); integration script extended with `listProgress` checks (22/22 PASS); live smoke against `next start` + local Postgres: unauthenticated pages → 307, credentials login → session, `/courses` `/admin/courses` `/dashboard` → 200 with expected Farsi content, `/api/health` `{db:true}` (HTML snapshots in evidence). Evidence: `docs/06-sprints/SPRINT-002-feature-sprint/evidence/S2-catalog-learning-ui/`.
- **SPRINT-002 S1 — Catalog & Learning API surface (first feature slice).** On top of the PR #11 schema foundation, the Catalog and Learning bounded contexts now have a working, tested API: `packages/core/src/api/catalog.ts` (`listCourses`, `getCourse`, `createCourse`, `updateCourse`, `publishCourse`, `listLessons`, `getLesson`, `createLesson` — tenant-scoped, soft-delete aware, students see `published` only while admins get a draft/archived management view) and `packages/core/src/api/learning.ts` (`listEnrollments`, idempotent `enroll` with published-only gating for students, `recordProgress` which flips the enrollment to `completed` when the last remaining lesson is completed). Routes (all gated by `requireRole`, per-user rate-limited, and on the M5 observability envelope): `GET/POST /api/courses`, `GET/PATCH /api/courses/:id`, `POST /api/courses/:id/publish`, `GET /api/courses/:id/lessons` (newly manifest-declared), `POST /api/lessons`, `GET /api/lessons/:id`, `GET/POST /api/enrollments` (admin `?userId=` filter; student param is ignored), `POST /api/lessons/:id/progress` (404 hidden lesson / 403 not enrolled). Supporting: `apps/web/src/lib/api-route.ts` (shared request-id + metrics + logs + `captureError` envelope so bounded-context routes do not re-duplicate the M5 wiring), `parseQuery`/`parseBody` now surface Zod `issues` on the error result, and `packages/core/scripts/verify-sprint2-integration.ts` (`pnpm --filter @learning-platform/core verify:sprint2`) exercises the whole flow against a real Postgres: 20/20 PASS including cross-tenant isolation. 39 new unit tests (8 core rules + 20 catalog routes + 11 learning routes) are DB-free; route coverage governance test stays green (every implemented route is manifest-claimed). No migration, no schema change, no secrets — additive surface only. Evidence: `docs/06-sprints/SPRINT-002-feature-sprint/evidence/S1-catalog-learning/`.
- **Catalog & Learning bounded-context schemas (core_courses, core_content, core_progress):** `packages/core/src/db/schema/{catalog,learning}.ts` add the 5 tenant-scoped tables declared in `docs/02-architecture/DATA_MODEL.md` and `BOUNDED_CONTEXTS.md` — `courses`, `lessons`, `media_assets`, `enrollments`, `lesson_progress` — matching the documented column set, FKs (tenant → tenants ON DELETE restrict, course → courses ON DELETE cascade, etc.), CHECK enums (`status`/`contentType` per the DATA_MODEL enum spec), soft-delete (`deleted_at` partial-index friendly), and the (tenant_id, user_id, course_id) / (enrollment_id, lesson_id) unique constraints. The new migration `packages/core/src/db/migrations/0001_solid_victor_mancha.sql` is generated by `drizzle-kit` (so the `__drizzle_migrations` table tracks it) and matches the 0000 append-only convention. DB-layer scope only — no plugin code, route handlers, or service layer in this PR; `plugin-catalog` / `plugin-learning` manifests already declare the bounded contexts and API surface (the planned-route intentionality is preserved by `apps/web/tests/manifest-route-coverage.test.ts`). Two partial composite indexes called out in DATA_MODEL.md §"Indexes (minimum)" are included in the initial migration rather than added later: `courses_tenant_status_idx (tenant_id, status) WHERE deleted_at IS NULL` (catalog browse) and `lessons_course_order_idx (course_id, order_index) WHERE deleted_at IS NULL` (lesson navigator). The `enrollments (tenant_id, user_id)` and `lesson_progress (enrollment_id, lesson_id)` lookups documented there are already covered by the leftmost prefix of their respective unique indexes. RLS enabled on all 5 tables and 5 permissive `tenant_isolation_*` policies added using the exact same shape as 0000 (TO PUBLIC, FOR ALL, predicate `current_setting('app.tenant_id', true)::uuid` for fail-closed NULL behavior, DO $$ … EXCEPTION WHEN duplicate_object for idempotent re-execution), so when M7's data-layer audit escalates to a non-owner DB role (ADR-0008 trigger #2 / FORCE ROW LEVEL SECURITY) no per-table backfill is needed. v1's documented model (app-layer WHERE carries isolation; RLS is defense-in-depth) is unchanged — the table owner still bypasses RLS. `pnpm --filter @learning-platform/core typecheck` clean (one unused `index` import removed from `learning.ts`); `pnpm --filter @learning-platform/core lint` clean; `pnpm -r typecheck` clean across all 8 workspace projects (no consumer import was affected — only the `Role` type from `identity.ts` is imported externally). Migration is generated only — not applied locally or in any environment (PRODUCTION-level per AGENTS.md §1, requires human review of the SQL output before any `pnpm db:migrate` run).
- **Vercel + Railway Postgres cloud-target deployment (M7 redirect):** founder cancelled the VPS plan; the v1 deployment target is now **Vercel** (serverless Next.js) + **Railway Postgres** (managed DB). Adds root `vercel.json` so the pnpm monorepo builds correctly on Vercel (`buildCommand: pnpm --filter web build`, `framework: nextjs`, `outputDirectory: apps/web/.next`, `installCommand: pnpm install --frozen-lockfile`). Gates `next.config.mjs` `output: "standalone"` behind a build-time flag `NEXTJS_STANDALONE=1` so Docker builds keep the standalone layout (the Dockerfile sets the flag) while Vercel/cloud builds (which don't) get the default `.next` layout that serverless functions are generated from — this keeps both the M6 Docker path and the new Vercel path green from one config. The VPS-only `docs/07-deployment/DEPLOYMENT_GUIDE.md` path stays as the local-Docker verification lane; a cloud-target path (Vercel project + Railway Postgres service + the four required env vars) is documented alongside it.
- **ADR-0018 — Hosting & deployment model (v1 redirect: Vercel + Railway):** supersedes ADR-0007's "single self-hosted dedicated VPS" target. v1 deploys the app to Vercel serverless and Postgres 16 to a Railway managed service (founder provisioned 2026-07-23), both under the same single-region, single-tenant, founder-operated shape ADR-0007/C1/C3/C6 require. The customer-agnostic artifact property is preserved — nothing in shared code assumes the host. The Docker-compose prod stack (ADR-0017) stays as the local full-stack verification lane on the founder's Docker Desktop (Windows), reproducible end-to-end via `scripts/handoff/verify-migrate-and-stack.sh`. Closes M7's "founder VPS provisioning" blocker without weakening the dependency on real-Postgres verification.
- **ADR-0017 — Containerized DB migrations (M7 pre-provision prep):** records that database migrations run as a short-lived, idempotent, one-shot `migrate` service in `docker-compose.prod.yml`, reusing the production app image (which now ships `packages/core/src/db/migrations/`), against the production `DATABASE_URL`, before the `app` service boots (`depends_on: service_completed_successfully`). Closes a real deploy-path gap surfaced during M7 prep: the prod image excluded migrations and nothing ran them, so a fresh host booted the app into a schema-less DB → `/api/health` `degraded` (`db:false`, `auth:false`) → `deploy.yml`'s smoke grep on `"status":"ok"` would fail and roll back a good release. Containerized (not host-side `pnpm db:migrate`) so it works on Docker-only hosts (founder's Docker-on-Windows today; a minimal VPS later) with no `pnpm`/`node`/`psql` on the host PATH. Drizzle `__drizzle_migrations` table makes re-runs a no-op. Evidence/decision: `docs/05-decisions/ADR-0017-containerized-db-migrations.md`; observed gap first recorded in `docs/06-sprints/SPRINT-001-production-foundation/evidence/M7-readiness/pre-provision-checklist.md`.
- **TaskOutput auto-reset to draft after successful handoff (PR #8):** `scripts/handoff/Invoke-TaskOutput.ps1` gains a `Reset-TaskOutputStatus` helper that rewrites `.claude/state/task-output.json` from `status=completed` back to `status=draft` after the Git chain succeeds (PR opened/updated, CI green, stopped before merge). This closes the Stop-hook loop where the hook would re-fire on every subsequent Claude stop because the handoff file remained `completed`. The guard in the script (checking `stop_hook_active` on stdin) already prevented re-loops within a single hook chain, but the persisted JSON was still a footgun for the next session. Now the handoff self-clears on success.
- **M7 pre-provision prep (deploy defects fixed before VPS):** `docker-compose.prod.yml` `app` service gains `image: ghcr.io/yahou110/learning-platform/web:latest` (kept `build:` for local) so `.github/workflows/deploy.yml`'s `docker compose pull` actually fetches the CI-built image (was broken — no `image:` field meant `pull` pulled nothing). `docs/07-deployment/DEPLOYMENT_GUIDE.md` §3 env-template heredoc fixed: `AUTH_SECRET=$(openssl rand …)` was written inside a single-quoted heredoc that stored the *literal command text* as the secret; now generates secrets into shell variables first, writes via an unquoted heredoc, then `unset`s them. New keys-only `docs/07-deployment/env.template` (real secrets stay in the gitignored root `.env`, generated locally). `.gitignore` excludes local throwaway TLS + secrets.
- **TaskOutput Git handoff infrastructure:** replaces inline Claude Code Git ops with a versioned intent contract + hook-/script-owned mechanical chain. Claude writes `.claude/state/task-output.json` (intent; `status=completed` is the trigger gate); a `Stop` hook fires `scripts/handoff/Invoke-TaskOutput.ps1`, which schema-validates the JSON (`.claude/state/schema/v1.schema.json` via `scripts/handoff/validate-task-output.mjs`), self-asserts the handoff path is gitignored, derives the file list and branch **from `git status`/`git diff` (never from the JSON)**, commits, pushes, opens the PR, waits `gh pr checks --required` green, and stops before merge (manual default; `merge_policy:"auto-on-green"` opts into auto squash+delete). A `PreToolUse(Bash)` hook (`scripts/handoff/block-mutating-git.ps1`, wired in `.claude/settings.json`) physically denies `git commit/push/merge` and `gh pr create/merge/edit` from Claude, making the intent/state boundary structural rather than advisory. `.gitignore` keeps the committed contract while ignoring `settings.local.json` + `task-output.json`. Contract doc: `.claude/state/TASK_OUTPUT.md`. Verified end-to-end (no-op on incomplete handoff, schema pass, gitignore self-check refuses untracked paths, DryRun holds, block-hook read/mutate split exact, first real run opened PR #7 against live GitHub).
- **M6 — Deployment / CI-CD (SPRINT-001):** production Docker multi-stage build (`apps/web/Dockerfile`, `output: "standalone"`, non-root runner), `docker-compose.prod.yml` (app + Postgres 16 + MinIO, localhost-bound ports, healthchecks), `.dockerignore`, host-level `docs/07-deployment/nginx.conf` (TLS/HSTS, rate-limit, `/api/metrics` localhost gate), `docs/07-deployment/learning-platform.service` (systemd `oneshot` driving compose), idempotent `scripts/deployment/{backup,restore}.sh` (pg_dump + MinIO mirror + sha256 manifest, 30-day retention), `docs/07-deployment/DEPLOYMENT_GUIDE.md`, and `.github/workflows/deploy.yml` (build → push GHCR → SSH deploy → smoke → rollback). **Locally verified 2026-07-21:** image builds, all three services reach `healthy`, endpoints `/api/health` 200 / `/api/ready` 200 / `/api/metrics` 401→200(bearer) verified, and a backup→destroy→restore round-trip recovers Postgres rows + a MinIO object byte-identical. Evidence: `docs/06-sprints/SPRINT-001-production-foundation/evidence/M6-deployment/output-local-verify.txt`, `output-backup-restore.txt`.
- **ADR-0016 — PWA / offline:** founder decided **YES** on 2026-07-21 (open question Q7, previously unrecorded and repeatedly re-litigated, now captured). The decision is locked; implementation stays parked until M7 sign-off per the 2026-07-11 directive. Drives a future "Learning" bounded context + service-worker/offline infra. Recorded in `PROJECT_BACKLOG.md`, `DECISIONS.md`, and ADR memory.
- **M5 — Observability (SPRINT-001):** structured JSON logging (`pino`, singleton + request-scoped child loggers with redaction of `password`/`passwordHash`/`token`/`cookie`/`headers.authorization`/`AUTH_SECRET`/`DATABASE_URL`), in-process Prometheus-format metrics collector (`http_requests_total{label="METHOD:ROUTE:STATUS"}`, `http_request_duration_seconds`, `process_uptime_seconds`), error capture with sanitized stacks + correlation `x-request-id` headers, deep `/api/health` check (`db`+`auth`+`storage`), shallow `/api/ready` check (config + maintenance), and bearer-token-gated `/api/metrics` scrape endpoint. `/api/users` wired as the first consumer (per-request logs + metrics + error capture). New `@learning-platform/core/observability` export. 5 new unit tests in `packages/core/tests/observability-metrics.test.ts`. Metric labels deliberately low-cardinality (`METHOD:ROUTE:STATUS` only); request/user/tenant identity travels in logs, not metrics. No remote error backend in v1 (operational choice deferred per ADR-0007). Evidence: `docs/06-sprints/SPRINT-001-production-foundation/evidence/M5-observability/`.
- **ADR-0007 — Hosting & deployment model:** v1 deploys as one self-hosted dedicated deployment on a single VPS (~4 GB) under C1/C3/C6, operated by the founder. The deployment shape is kept abstract — the artifact is customer-agnostic and re-configurable rather than forked, so SaaS / licensed / managed / dedicated-per-customer delivery remains reachable without a rewrite. No multi-instance operational infrastructure is built in v1. Closes open question Q5; owned the decision ADR-0014 §4 defers.
- **ADR-0008 — Multi-tenant data isolation:** confirms shared database + shared schema + `tenant_id` on every tenant-scoped table as the v1 isolation mechanism (the "pool" model), enforced at three layers — application query-builder default in `core`, Postgres Row-Level Security, and integration tests — satisfying C2's "more than one layer" with margin. Subdomain-based tenant identification in v1, custom domain in v2; membership-shaped identity (`user_roles`) ratified. Operational tenancy (onboarding, org-admin, self-service provisioning) explicitly deferred per ADR-0014 §3; silo/bridge isolation a documented future escalation trigger, reachable without a re-model. Closes open question Q6; owns the operational layer ADR-0014 defers.
- **ADR-0014 — Reusable platform vision (first customer, not the only customer):** records the intent that the codebase evolve into a reusable, customer-agnostic platform, scoped by YAGNI. Reconciles `ARCHITECTURE_CONSTRAINTS.md` C2 (multi-tenant hard constraint) with the Product Vision's deferred operational multi-tenancy via a capability-vs-operation split: v1 stays architecturally multi-tenant-capable (`tenant_id`, no customer assumptions in shared code, configuration over hardcoding) without building the operational layer (onboarding, org admin) deferred to ADR-0008. Deployment model remains deferred to ADR-0007. Companion docs: `PRODUCT_BIBLE.md` §2.1/§7.1–§7.3 and `PROJECT_ARCHITECTURE_CONTEXT.md` reference this ADR.
- **Executable governance (CI-enforced):** `.github/workflows/governance.yml` runs `pnpm verify` + `pnpm governance:validate` on PRs and pushes to `main`.
- **`scripts/governance/validate.mjs`** — PR template validation (Risk, DoR, DoD, ADR, Rollback, Evidence), CHANGELOG requirement, ADR index integrity, ADR-0001 code scan.
- **`.github/pull_request_template.md`** — mandatory governance sections with CI markers.
- **GitHub Issue Templates:** `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`.
- **`docs/03-development/GOVERNANCE_CHECKLIST.md`** — session checklist (Phase A/B/C).
- **`DEVELOPMENT_GUIDE.md`** — single contributor entry point and router (under 100 lines).
- **`governance:validate`** — executable governance validator (`scripts/governance/validate.mjs`).
- **ADR-0013 — Engineering Protocol v2:** extends ADR-0012 with rules §39–§60; thematic chapter organization; Definition of Ready (§39); specification-first workflow (§40); human approval matrix (§41); risk classification (§42); ADR enforcement (§43); rule priority (§47); governance before generation (§59); verification before completion (§60).
- **`docs/03-development/RISK_CLASSIFICATION.md`** — LOW/MEDIUM/HIGH/CRITICAL matrix with review, approval, and rollback requirements.
- **`templates/DEFINITION_OF_READY.md`** — DoR checklist for §39.
- **`templates/HUMAN_APPROVAL_CHECKLIST.md`** — founder approval workflow for §41.
- **ADR-0012 — Mandatory Engineering Protocol:** binding process doc (`docs/03-development/ENGINEERING_PROTOCOL.md`) covering repository read order, milestone scope, quality gates, definition of done, planning-before-coding, security/rollback/evidence rules, and contributor constraints.
- **`docs/03-development/QUALITY_GATES.md`** — canonical lint/typecheck/test/build commands; CI alignment notes.
- **`pnpm verify`** root script — runs all four quality gates in sequence.
- **`scripts/quality-gates.ps1`** and **`scripts/quality-gates.sh`** — reproducible gate runners for Windows and Unix.
- **`docs/03-development/ENGINEERING_PROTOCOL.md`** — canonical always-available reference rule.
- **`templates/IMPLEMENTATION_PLAN.md`** and **`templates/DEFINITION_OF_DONE.md`** — planning and completion checklists.
- **SPRINT-001 — Production Foundation** plan with 7 milestones (M1..M7) and a hard gate: no new business features until M7 sign-off. Plan: `docs/06-sprints/SPRINT-001-production-foundation/SPRINT-001-production-foundation.md`.
- Per-milestone evidence directories under `docs/06-sprints/SPRINT-001-production-foundation/evidence/M{n}-*/`.
- **Security headers** via `next.config.mjs` `headers()`: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- **Centralized env validation** (`apps/web/src/lib/env.ts`): production throws on missing `AUTH_SECRET`/`DATABASE_URL`, development uses safe defaults with warnings.
- `poweredByHeader: false` in `next.config.mjs` to hide the Next.js version string.

### Fixed (during M6 local verification, 2026-07-21)
- **OSV dev-toolchain vulnerabilities (5 advisories, pre-existing on `main`)** — OSV Scanner CI was red on `main` (confirmed at commit `c8d2c33`). Vulnerabilities, all in dev-only tooling pulled transitively by `vitest`/`drizzle-kit`: `esbuild@0.18.20/0.19.12/0.21.5` (GHSA-67mh-4wv8-2f99, fixed ≥0.25.0), `vite@5.4.21` (GHSA-4w7w-66w2-5vf9 / -fx2h-pf6j-xcff / -v6wh-96g9-6wx3, fixed at 6.4.3 on the 5.x→6.x line), `vitest@2.1.9` (GHSA-5xrq-8626-4rwp, fixed ≥3.2.6). Fixed via `pnpm.overrides` (`esbuild`→`^0.25.0`, `vite`→`^6.4.3`, `vitest`→`^3.2.6`) plus bumping the direct `vitest` devDep in `apps/web` and `packages/core` to `^3.2.6`. `pnpm verify` green; OSV re-scan: 0 vulnerable packages. The `launch-editor` transitively-flagged advisory is resolved by the `vite` override.
- **Stale MinIO tag** — `minio/minio:RELEASE.2024-07-19T21-05-03Z` was pruned from Docker Hub (`not found`). Bumped to `RELEASE.2025-07-23T15-54-02Z` in `docker-compose.prod.yml`.
- **Broken build context** — `docker-compose.prod.yml` `app.build.context: ..` walks above repo root, expanding to `D:\code\apps` and failing the build (`GetFileAttributesEx`). Fixed to `context: .`.
- **Missing `public/` dir** — `apps/web/Dockerfile` `COPY .../public ./public` collapsed ("public: not found") because no `public/` existed. Added `apps/web/public/.gitkeep` (also the canonical home for the future PWA manifest/SW/icons per ADR-0016).
- **Monorepo standalone entrypoint mismatch** — Next.js standalone preserves the monorepo tree, so `server.js` lands at `/app/apps/web/server.js`, but the Dockerfile ran `node server.js` from WORKDIR `/app` → `Cannot find module '/app/server.js'`. Fixed runner COPY targets to `./apps/web/.next/static` + `./apps/web/public` and set `WORKDIR /app/apps/web`.
- **Healthcheck false-negative on alpine** — `wget http://localhost:3000/...` resolved `localhost` to `::1` (IPv6) while Next binds `0.0.0.0` (IPv4), so the container reported `unhealthy` while serving 200. Changed the healthcheck probe to `http://127.0.0.1:3000/...` (IPv4 explicit).

### Fixed (during M1 — Baseline Verification)
- **`next/no-page-custom-font` warning in `apps/web/src/app/layout.tsx`** — Google Font (`Vazirmatn`) was loaded via raw `<link>` tags in App Router `<head>`. Converted to `next/font/google` so the font is inlined at build time and the warning is gone.
- **Root `pnpm build` script had a broken filter** — `pnpm -r --filter='./packages/*' build` matched no projects in pnpm 9. Simplified the root `build` to `pnpm --filter web build`; per-package builds remain available for ad-hoc use. `transpilePackages` in `next.config.mjs` already makes the workspace package source consumable by Next.js.
- **`@learning-platform/core` `exports` pointed to `dist/...js` while other packages pointed to source** — the only package that needed a build step before the Next.js build. Aligned core to source-export like the rest of the workspace (`./src/...ts`).
- **Webpack did not map `.js` → `.ts` for NodeNext-style imports** — `@learning-platform/core/src/api/index.ts` uses `from '../db/client.js'` (NodeNext convention). Added `resolve.extensionAlias` to `apps/web/next.config.mjs` so webpack resolves `.js` → `.ts`/`.tsx` first.
- **Native `bcrypt` is unbundlable in the Next.js server build** — `@learning-platform/core` used native `bcrypt` (C++ bindings) for password hashing, which webpack tried to bundle and choked on `node-pre-gyp`'s HTML files. Switched to pure-JS `bcryptjs` (already a dep of `apps/web`). Trade-off: ~250ms vs ~80ms per hash at cost 12, acceptable for login. Rationale documented in the JSDoc header of `credentials.ts`.

### Fixed (during M2 — code review)
- **Stale `serverExternalPackages: ["bcrypt"]`** — removed from `next.config.mjs`; we use `bcryptjs` (pure JS) since M1.
- **Health route `db` field returned string** — changed to return boolean (`true`/`false`) for consistency with API contract. Added `try/catch` for graceful error handling.
- **Login page missing `dir="rtl"`** — added for consistency with dashboard page.
- **AUTH_SECRET silent fallback in production** — previously, if `AUTH_SECRET` was not set, the app would silently use a predictable dev secret. Now throws at startup in production.
- **`.env.example` lacked comments** — added descriptions, security notes, and `openssl rand -base64 32` generation command.

### Changed
- `docs/03-development/ENGINEERING_PROTOCOL.md` — added **§61 (Chapter 12): Documentation language — English for engineering artifacts** (ADRs, proposals, governance, specs, implementation plans). Communication-language is distinct from documentation-language; product-voice (personas, mission, UX rationale) stays native-language (Persian-first) even inside English docs. Non-binding engineering clarification under ADR-0013 §47; not an ADR.
- `package.json` — `governance:validate`, `governance:validate:local` scripts.
- `DEVELOPMENT_GUIDE.md` — rule #9 (GOVERNANCE_CHECKLIST); CI reference.
- `docs/03-development/QUALITY_GATES.md` — documents `governance.yml` pipeline.
- `docs/03-development/ENGINEERING_PROTOCOL.md` — reorganized into 13 thematic chapters; v2.0 with 60 rules (§1–§38 preserved, §39–§60 added).
- `docs/03-development/ENGINEERING_PROTOCOL.md` — v2 enforcement (DoR, spec-first, governance before generation, rule priority).
- `templates/DEFINITION_OF_DONE.md`, `templates/IMPLEMENTATION_PLAN.md` — aligned with §39, §55, §60.
- `DEVELOPMENT_GUIDE.md` — onboarding table includes `ENGINEERING_PROTOCOL.md`; hard rule #8 and `pnpm verify` in build section.
- `docs/05-decisions/DECISIONS.md` — ADR-0012 indexed.
- `apps/web/src/app/layout.tsx` — uses `next/font/google` for Vazirmatn; `<html>` and `<body>` apply the font class.
- `apps/web/next.config.mjs` — added `resolve.extensionAlias` for `.js`/`.mjs` → `.ts`/`.tsx`/`.mts`.
- `package.json` (root) — `build` script simplified to `pnpm --filter web build`.
- `packages/core/package.json` — exports now point to source (`./src/...ts`); dep `bcrypt` → `bcryptjs`, devDep `@types/bcrypt` → `@types/bcryptjs`.
- `packages/core/src/auth/credentials.ts` — uses `bcryptjs`; JSDoc explains the rationale.
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.2, Sprint 001 in progress, M1 next.
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to Session 008, M1 task.
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 008 entry.
- `docs/03-development/TECH_STACK.md` — to be updated at M3/M4 (CI, security, observability) — deferred per M1 scope.

### Verified
- `pnpm install` (with lockfile) — exit 0
- `pnpm -r lint` — exit 0, **zero warnings**
- `pnpm -r typecheck` — exit 0
- `pnpm -r test` — exit 0, 18 tests pass across 6 packages (core 3, plugin-auth 3, plugin-catalog 2, plugin-credentials 3, plugin-learning 2, plugin-localization 3, apps/web 2)
- `pnpm build` — exit 0, 7 routes compiled (1 page, 5 API routes, 1 login page), middleware 42.7 kB, first-load JS shared 99.9 kB

### Security
- Added 5 security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `poweredByHeader: false` hides the Next.js version string.
- Centralized env validation: `AUTH_SECRET` and `DATABASE_URL` are required in production; throws at startup if missing.

### Gate (binding)
🚫 No new business features are merged until M7 (Production Readiness Review) is signed off. This includes Catalog API/UI, Dashboard real UI, Learning plugin, Credentials plugin, Event Bus, PWA.

### Security audit (M4 pre-work, 2026-07-12)
- **🔴 28 known vulnerabilities** in production dependencies (see `evidence/M4-security/audit-baseline.json`): 2 critical, 8 high, 14 moderate, 4 low. All in `next@15.0.3` and `next-auth@5.0.0-beta.25`; transitive `postcss@8.4.31` (via `next`).
- **Mitigation spec drafted:** `evidence/M4-security/M4-1-dependency-upgrade.md` — bump `next` to `15.5.16+`, `next-auth` to `5.0.0-beta.30+`. **Risk: CRITICAL → HIGH after fix. Founder approval required per ADR-0013 §41.**
- **M3 evidence gap closed:** `evidence/M3-ci/{notes.md,checklist.md,commands.txt}` (governance CI workflow, validator script, PR + issue templates, contributor file sync).

### Security (M4.1 dependency upgrade, 2026-07-12)
- **Bumped `next`: `15.0.3` → `15.5.20`** (latest 15.x backport; resolves 24 advisories: 1C/7H/13M/3L).
- **Bumped `next-auth`: `5.0.0-beta.25` → `5.0.0-beta.31`** (latest beta; resolves Email misdelivery advisory).
- **Aligned `eslint-config-next` with `next` version.**
- **Audit delta: 28 → 2 advisories (93 % reduction).** 0 critical, 1 high (`drizzle-orm<0.45.2`), 1 moderate (`postcss<8.5.10` transitive via `next@15.5.20`).
- `pnpm verify` clean on the upgrade branch (`fix/m4-dependency-upgrade`): lint ✓, typecheck ✓, test ✓ (18/18), build ✓ (7 routes, Middleware 46 kB, First Load JS 102 kB).
- **Residual follow-ups** (deliberately excluded from this PR per founder directive "no mixed changes"):
  - Bump `drizzle-orm` to `>=0.45.2` — needs schema regression check.
  - Track Next.js internal `postcss` for a 15.5.21+ bump (or add `pnpm.overrides`).

### Security (M4.0 P0 — authorization gap + password-hash leak, 2026-07-13)
- **🔴 Closed `GET /api/users` password-hash leak.** The Drizzle query was a bare `select().from(users)` that returned every column, including `passwordHash`, to any caller with a session. A `student` or `teacher` could have dumped every bcrypt hash in their tenant and started offline cracking. **Now: explicit column projection in `identity.listUsers` and `identity.getUserById`; `passwordHash` is not selected and not in the `UserPublic` return type.** Defense in depth at three layers (SQL, types, JSON).
- **🔴 Added role-based authorization on `/api/users`.** New helper `requireRole(['center_admin', 'super_admin'])` in `apps/web/src/lib/authz.ts`. `student`/`teacher` → 403; no session → 401. The `requireRole` helper is the single chokepoint for all future authenticated routes; new routes get authorization by going through it.
- **ADR-0005 (auth) — Revision 1:** ADR said "DB sessions via `@auth/drizzle-adapter`"; implementation uses `session: { strategy: "jwt" }` because the Auth.js Credentials provider only supports JWT (verified against Auth.js v5 docs). The ADR is amended in-place: sessions are JWT-signed; "instant revocation" is delivered by a per-request `isActive` re-check in the Auth.js `session` callback (one indexed primary-key lookup per authenticated request, sub-ms).
- **New tests:**
  - `packages/core/tests/api-user-public-type.test.ts` — type-level guarantee that `UserPublic` cannot have a `passwordHash` field (compile-time failure if anyone adds one).
  - `apps/web/tests/authz-require-role.test.ts` — 6 cases (no session, session without user, role not in allowlist, center_admin, super_admin, teacher explicitly denied).
- **Spec + DoR + DoD + risk matrix:** `evidence/M4-security/M4-0-authz-data-leak.md`.
- **Re-run audit:** `evidence/M4-security/audit-after-2.json` — no new advisories; same 2 residual (`drizzle-orm` + transitive `postcss`) from M4.1.
- **`pnpm verify` on the M4.0 branch:** lint ✓, typecheck ✓, test ✓ (5/5 core + 8/8 web + 13/13 plugins = 26 tests), build ✓ (7 routes, Middleware 46 kB, First Load JS 102 kB).

### Changed (M4.0)
- `packages/core/src/api/index.ts` — `listUsers` rewritten with explicit column projection; new `getUserById` and `checkUserActive` methods; new `UserPublic` type.
- `apps/web/src/lib/authz.ts` — **NEW** `requireRole` helper.
- `apps/web/src/app/api/users/route.ts` — gates the route on `requireRole(['center_admin', 'super_admin'])`.
- `apps/web/src/auth.ts` — `session` callback now does a per-request `identity.checkUserActive` lookup and returns an empty user on miss/inactive.
- `apps/web/vitest.config.ts` — added aliases for `@/auth`, `@/lib/env`, `@/lib/authz`, `@/lib/plugins` (workspace packages still resolve via pnpm symlinks + their own `exports` field).
- `docs/05-decisions/ADR-0005-auth.md` — appended Revision 1 explaining the JWT constraint and the per-request `isActive` pattern.

### Security (M4.2 — hardening: CSP + rate-limits + input validation + security.txt, 2026-07-15)
- **Content-Security-Policy** added to `apps/web/next.config.mjs` `headers()`. Strict v1 static policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'`. `'unsafe-inline'` on styles is required by Next + Tailwind inline style attrs in v1; per-request nonces parked. HSTS deliberately **not** set yet (valid only over TLS; enable at M6 behind the reverse proxy).
- **Rate limiting (in-memory token-bucket):** new `apps/web/src/lib/rate-limit.ts` (`rateLimit()` + `ipKey()`). Placed in **Node route handlers**, not middleware — Next.js middleware runs on the Edge runtime (no durable per-instance state / timers), so a bucket there is unreliable; Node handlers keep it dependency-free (OSS-first, single VPS ≤ 4 GB). `/api/users` limited per admin (30 burst / 1·s⁻¹); `/api/auth/session` per IP (60 burst / 1·s⁻¹).
- **Input-validation harness:** new `apps/web/src/lib/validation.ts` (`parseQuery` / `parseBody`) returning the same `{ ok, data } | { ok, response }` discriminated-union shape as `requireRole`. `/api/users` validates its query string defensively (`UsersQuerySchema`, strict-empty for now) so future pagination params reach the DB only after validation.
- **`/.well-known/security.txt`** (RFC 9116) served via a new route handler `apps/web/src/app/.well-known/security.txt/route.ts` with `Content-Type: text/plain; charset=utf-8`. `Contact` is a placeholder pending a real address from the founder.
- **Rebrand audit scrub:** `@hawza/core` → `@learning-platform/core` in `evidence/M4-security/audit-after.json`, `audit-after-2.json`, `audit-baseline.json` (dependency paths); stripped a stale UTF-8 BOM from `audit-baseline.json`. `git grep hawza` now returns nothing across tracked files.
- **New tests:** `apps/web/tests/rate-limit.test.ts` (4 cases: capacity/429 shape, refill, per-key isolation, invalid config) and `apps/web/tests/validation.test.ts` (6 cases: query happy/reject/strict, body happy/reject/malformed-JSON).
- **Evidence:** `evidence/M4-security/M4-2-hardening.md` (DoR / spec / risk MEDIUM / rollback per ADR-0013) + updated `evidence/M4-security/checklist.md` and `commands.txt`.
- `pnpm verify` on this work: lint ✓, typecheck ✓, test ✓ (5/5 core + 18/18 web + 13/13 plugins = 36 tests), build ✓.
- **Follow-ups parked:** HSTS (at M6 behind TLS), CSP nonces (per-request infra), external rate-limit store (only if multi-process), real `security.txt` Contact address.

### Changed (M4.2)
- `apps/web/next.config.mjs` — added `Content-Security-Policy` to the `headers()` array.
- `apps/web/src/app/api/users/route.ts` — accepts `NextRequest`; adds per-admin `rateLimit` + defensive `parseQuery`.
- `apps/web/src/app/api/auth/session/route.ts` — accepts `NextRequest`; adds per-IP `rateLimit`.
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.9, M4.2 complete.
- `docs/00-bootstrap/PROJECT_BACKLOG.md` — Session 017 entry.
- `docs/00-bootstrap/PROJECT_HANDOVER.md` — Session 016 entry (M4.2 handoff).

### Added (M4.2)
- `apps/web/src/lib/rate-limit.ts` — in-memory token-bucket limiter + `ipKey()`.
- `apps/web/src/lib/validation.ts` — `parseQuery` / `parseBody` Zod guards.
- `apps/web/src/app/.well-known/security.txt/route.ts` — RFC 9116 security contact.
- `apps/web/tests/rate-limit.test.ts`, `apps/web/tests/validation.test.ts`.
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-2-hardening.md` — DoR/spec/risk/rollback.

### Security (M4.3 — residual advisories: drizzle-orm SQL-injection + postcss XSS, 2026-07-15)
- **Bumped `drizzle-orm` to `^0.45.2`** in `apps/web` and `packages/core` (resolves GHSA-1116251, HIGH: "SQL injection via improperly escaped SQL identifiers"). Lockfile regenerated. The API surface used by this repo (`select/from/where/and/eq`, `insert/values/returning`, `update/set/where`, `pgTable/check/sql/inferSelect`) is stable across 0.36 → 0.45+; **all 36 tests pass** unchanged.
- **Forced `postcss >= 8.5.10` via root `pnpm.overrides`** (resolves GHSA-1117015, MODERATE: "XSS via Unescaped `</style>` in CSS Stringify Output"). The transitive `next@15.5.20 > postcss@8.4.31` is now resolved to `8.5.16` everywhere; `pnpm why postcss --filter web` confirms 8.5.16 in all paths (next, next-auth→next, autoprefixer peer, vitest→vite, tailwind). Build is clean.
- **Bug fix found by M2 smoke test:** `/.well-known/security.txt` was being redirected to `/login` because the middleware had no public-route allowlist for it. Added `isSecurityTxt` exception alongside the existing `isApiAuthPage` and `isHealthPage` checks in `apps/web/src/middleware.ts`. After-fix: `GET /.well-known/security.txt` → `200` with `Content-Type: text/plain; charset=utf-8` and `Cache-Control: no-store`, no auth required. RFC 9116 §2 compliant.
- **Residual advisory count after M4.3:** **0 prod-tree advisories** (was 2 after M4.1; both patched). npm's `pnpm audit` endpoint returned `410 ERR_PNPM_AUDIT_BAD_RESPONSE` during this session (the endpoint is being retired by npm); the version pins above are pinned to the patched ranges and `pnpm why` confirms the resolved versions. Re-capture of the JSON audit is blocked by the endpoint retirement; documented as a tool-status note, not a finding.
- **Risk:** MEDIUM per ADR-0013 §42 (drizzle-orm touches every query path; middleware is route-critical). Founder approval: not required (MEDIUM); auto-proceeded per founder directive 2026-07-15.
- **Evidence:** `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-3-residual-advisories.md` (DoR / spec / risk / rollback).
- `pnpm verify` on this work: lint ✓, typecheck ✓, test ✓ (5/5 core + 18/18 web + 13/13 plugins = 36 tests), build ✓ (8 routes, Middleware 46.1 kB, First Load JS 102 kB).

### Changed (M4.3)
- `apps/web/package.json` — `"drizzle-orm": "^0.36.0"` → `"^0.45.2"`.
- `packages/core/package.json` — same pin bump.
- `package.json` (root) — added `pnpm.overrides."postcss": "^8.5.10"`.
- `apps/web/src/middleware.ts` — added `isSecurityTxt` exception so `/.well-known/security.txt` is publicly accessible.
- `pnpm-lock.yaml` — regenerated.
- `docs/00-bootstrap/PROJECT_STATE.md` — v1.10, M4.3 + M2 smoke test complete.
- `docs/00-bootstrap/PROJECT_BACKLOG.md` — Session 017 closed; Session 018 task.
- `docs/00-bootstrap/PROJECT_HANDOVER.md` — Session 017 entry appended.

### Added (M4.3)
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-3-residual-advisories.md` — DoR/spec/risk/rollback.

### M2 — Production smoke test (real Postgres, 2026-07-15)
- The M2 smoke test was parked since session 009 because PostgreSQL was not installed on the dev machine. This session: Docker Desktop was started; the existing `hawza-postgres:16-alpine` container was healthy; ran `pnpm --filter @learning-platform/core db:migrate` (idempotent — applied) + `db:seed:dev` (created `demo` tenant + `admin@lp.local` / `changeme` super_admin). Started `pnpm --filter web dev`; ran the full auth + authorization + security-headers + security.txt flow.
- **Verified end-to-end:** `GET /api/health` → `200 {db:true}`; `GET /api/auth/csrf` → 200 with token; `POST /api/auth/callback/credentials` with `tenantSlug=demo&email=admin@lp.local&password=changeme` → `302 → /` with `authjs.session-token` cookie; `GET /api/auth/session` → typed session; `GET /api/users` (as super_admin) → `200 [{id,email,role,isActive,…}]` **without `passwordHash`**; `GET /.well-known/security.txt` → `200 text/plain` (after middleware fix).
- **All security headers present in every response:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and the **new** `Content-Security-Policy` from M4.2.
- **Known minor issue (not a blocker):** the dev server crashed when `next build` overwrote `.next/` mid-flight. Not a code bug — re-running `pnpm --filter web dev` after a `pnpm verify` build is the expected sequence.
- **Evidence:** `docs/06-sprints/SPRINT-001-production-foundation/evidence/M2-prod-build/M2-smoke-test.md` (DoR/run/results).

---

## [1.1.0] — 2026-07-11

### Added
- **ADR-0003** — Web framework: **Next.js 15 (App Router) on Node.js 20 LTS**, TypeScript strict.
- **ADR-0004** — Database: **PostgreSQL 16 + Drizzle ORM**, no vector DB in v1, multi-tenant via `tenant_id` + RLS.
- **ADR-0005** — Auth: **Auth.js v5 Credentials provider, bcrypt (cost 12), server-side sessions in Postgres** via `@auth/drizzle-adapter`, httpOnly+secure session cookies.
- **ADR-0006** — Plugin architecture: **pnpm 9 workspaces monorepo**, internal compile-time modules with **typed Zod manifest**; plugins may not import `drizzle-orm` or `pg` (enforced by ESLint `no-restricted-imports`).
- `docs/03-development/TECH_STACK.md` — fully populated for the locked categories; open categories flagged as TBD with their proposed ADR numbers.
- `docs/05-decisions/DECISIONS.md` — ADR-0003..0006 moved from Proposed → Active; new ADRs proposed for the open categories (ADR-0007..0011).
- `pnpm` monorepo scaffold: `apps/web` (Next.js 15), `packages/core` (DB + auth + plugin registry), `packages/contracts` (shared types), `packages/plugins/{plugin-auth, plugin-catalog, plugin-learning, plugin-credentials, plugin-localization}`.
- `docker-compose.yml` — local Postgres 16 + Adminer for development.
- `package.json` (root) — pnpm workspace config, scripts (`dev`, `build`, `lint`, `typecheck`, `test`, `db:generate`, `db:migrate`).
- Base ESLint config with the plugin-DB-import restriction.
- Base TypeScript config (strict) shared by all packages.
- Vitest setup in every package.
- README files per package explaining its boundary and its "may not import" rules.

### Changed
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 004 entry.
- `docs/00-bootstrap/PROJECT_STATE.md` — Q1–Q4 marked ✅ Decided; Q5–Q7 still Pending.

---

## [1.2.0] — 2026-07-11

### Fixed
- **Migration SQL ordering** — `CREATE EXTENSION citext` moved before `CREATE TABLE users` (was crashing at runtime with `type "citext" does not exist`).
- **Connection leak** in `getTenantDb()` — replaced per-connection Drizzle wrapper with pooled `getDb()`. Previously every API call leaked a client from the pool (max 10, then exhausted).
- **Missing root layout** — created `apps/web/src/app/layout.tsx` with `<html lang="fa" dir="rtl">`. Required by Next.js 15 App Router.
- **Missing Tailwind CSS setup** — created `globals.css`, `tailwind.config.ts`, `postcss.config.mjs`. Login page uses Tailwind classes that were never configured.
- **Root `.eslintrc.json` JSON syntax error** — unquoted `argsIgnorePattern` key in rule config (caused `next lint` to crash with parser error).
- **Plugin Vitest configs** — all 5 plugins lacked resolve aliases for `@learning-platform/core` and `@learning-platform/contracts`, causing "Failed to load url" in tests.

### Changed
- `login/page.tsx` — simplified from split `LoginPage`/`LoginInner` pattern to single async component. Removed `void redirect` hack.
- `packages/core/src/db/client.ts` — removed `getTenantDb()`, added `withTenantDb()` callback wrapper (available but unused in v1). All queries go through pooled `getDb()`.
- `packages/core/src/api/index.ts` — uses `getDb()` instead of `getTenantDb()`.
- `docs/00-bootstrap/MASTER_HANDOFF.md` — appended Session 005 entry.
- `docs/00-bootstrap/NEXT_SESSION.md` — rotated to Session 006.

### Security
- Session cookies are httpOnly + secure + sameSite=lax (Auth.js default with our config).
- Passwords are bcrypt-hashed at cost 12.
- PostgreSQL Row-Level Security is the second isolation layer on top of application-level `tenant_id` filtering.

---

## [1.0.0] — 2026-07-10

### Added
- **Engineering Protocol v1.0** — documentation system is live.
- Repository skeleton: `README.md`, `DEVELOPMENT_GUIDE.md`, `LICENSE`, `CHANGELOG.md`.
- `docs/00-bootstrap/` — `PROJECT_BOOTSTRAP.md`, `MASTER_HANDOFF.md`, `PROJECT_STATE.md`, `NEXT_SESSION.md`.
- `docs/01-product/` — `PRODUCT_BIBLE.md`, `REQUIREMENTS.md`, `FEATURE_CATALOG.md`, `PERSONAS.md`, `ROADMAP.md`.
- `docs/02-architecture/` — `SYSTEM_ARCHITECTURE.md`, `DATA_MODEL.md`, `PLUGIN_MATRIX.md`, `PERMISSION_MATRIX.md`.
- `docs/03-development/` — `TECH_STACK.md` (skeleton).
- `docs/05-decisions/` — `DECISIONS.md`, `ADR-0001-no-wordpress.md`, `ADR-0002-operating-manual.md`.
- `templates/` — `HANDOFF_TEMPLATE.md`, `SESSION_NOTES.md`, `ADR_TEMPLATE.md`, `FEATURE_REQUEST.md`.

### Changed
- Decision: this project will NOT use WordPress. Rationale in `ADR-0001`.
- Decision: documentation will be portable. Rationale in `ADR-0002`.

### Not yet done (intentionally)
- No source code yet. v1.0 is documentation only.
- No deployment artifacts. See `docs/07-deployment/` (not yet created).
- No CI/CD. See `docs/03-development/GIT_STRATEGY.md` (not yet created).

---

## How to add a new entry

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Deprecated
- ...

### Removed
- ...

### Fixed
- ...

### Security
- ...
```

Append-only. Never edit historical entries.
