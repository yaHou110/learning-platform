# ADR-0017: Database migrations run as a containerized compose service at deploy time

- **Status:** Accepted (decision recorded; implementation done as part of M7 pre-provision prep)
- **Date:** 2026-07-22
- **Deciders:** Founder

---

## Context

M6 shipped the production stack (`docker-compose.prod.yml` + `apps/web/Dockerfile` + `.github/workflows/deploy.yml` + `docs/07-deployment/learning-platform.service`) and verified locally (2026-07-21) that the stack builds, boots, and serves `/api/health` / `/api/ready` / `/api/metrics` correctly. The M7 pre-provision prep (2026-07-22) re-stood the stack and found a **real deploy-path gap**:

- **The production Docker image excludes the database migrations.** `apps/web/Dockerfile` is a Next.js `standalone` build: the runner stage copies only `.next/standalone` + `.next/static` + `public/`. The committed Drizzle migrations at `packages/core/src/db/migrations/*.sql` are **not** in the image.
- **Nothing in the deploy path runs migrations.** Not the Dockerfile, not `docker-compose.prod.yml`, not `.github/workflows/deploy.yml`, not the systemd unit, not `DEPLOYMENT_GUIDE.md` §3.
- **Consequence, observed:** the app boots against an empty schema and `/api/health` returns `{"status":"degraded","checks":{"db":false,"auth":false}}` (the DB ping finds no relation to query). `/api/ready` is green (it checks config only, not the DB), so the problem hides behind a shallow readiness check. On a real VPS the same thing happens: `compose up` boots the app into a schema-less DB → degraded health → the `deploy.yml` smoke test that greps `"status":"ok"` on `/api/health` **fails and rolls back**, even though the app code and image are fine.

This is the same class of gap the M7 prep surfaced for the compose `image:` field and the env-template heredoc: shipped artifacts that work on the developer's hand-warmed localhost but break on a fresh host that hasn't had a manual `pnpm db:migrate` run against it.

### Forces at play

- **C1 / C6 (ARCHITECTURE_CONSTRAINTS):** low operational complexity, one-person-operable. The deploy mechanism must not require the operator to "remember to run migrations" — it must be structural.
- **ADR-0007 §"Escalation triggers":** changing deployment manifests or `.env` handling is an explicit trigger to record the decision (this ADR), because it touches the deploy topology the hosting ADR governs.
- **ADR-0007 Decision §5 ("no premature abstraction"):** the migration mechanism is one-shot, idempotent, and standard Drizzle — not a control plane, not multi-instance. It adds a single short-lived container, not speculative infrastructure.
- **Founder constraint (2026-07-22):** the work must proceed from **Docker Desktop on Windows** (WSL/Docker subsystem), with no VPS and no host `pnpm`/`node`/`psql` assumed on PATH. This rules out any mechanism that depends on host tooling.
- **Drizzle's migrate is idempotent** and tracks applied migrations in `__drizzle_migrations`; re-running is safe. Migrations are committed to the repo (single source of truth), not generated at runtime.
- **`packages/core/scripts/migrate.ts` reads `DATABASE_URL` and falls back to a localhost dev default.** The migrate container MUST receive the *prod* `DATABASE_URL` (host `postgres`, real password) — the compose env already exposes the right value; the container must use it rather than the script default.
- **Image consistency:** the `app` service's `image:` (ghcr `web:latest`, added in this prep) is produced and named by `deploy.yml`. The migrate container must use the **same image** if possible, so there is exactly one build artifact and the migrations a release ships are the migrations that release applies — not a second, separately-maintained image that can drift.

---

## Decision

**Database migrations run as a short-lived, idempotent, one-shot `migrate` service inside `docker-compose.prod.yml`, reusing the production app image (which is augmented to include the committed Drizzle migrations), against the production `DATABASE_URL`. It runs before the `app` service (via `depends_on` with a healthy `postgres` gate) and exits 0 on success.**

1. **Containerized, not host-driven.** Migrations run inside a container that already has `node` + the app's `node_modules` (`pg`, `drizzle-orm`). No `pnpm`, no `psql`, no `node` is required on the host OS — so it works identically on the founder's Docker-Desktop-on-Windows and on a future Ubuntu VPS. This is the binding constraint that selects the containerized approach over host-side `pnpm db:migrate`.

2. **Reuse the app image; ship migrations inside it.** The production runner image (`ghcr.io/yahou110/learning-platform/web:latest`) is extended to **also** contain `packages/core/src/db/migrations/`. The `migrate` service uses that same image and overrides the command to run the Drizzle `migrate` helper. Rationale: exactly one build artifact for a release; the migrations a release ships are by construction the migrations that release applies; no second image to keep in sync. (The added copy is small — SQL files under `packages/core/src/db/migrations/`.)

3. **Idempotent and ordered.** `migrate` `depends_on` `postgres` being `healthy`, then exits. The `app` service `depends_on` `migrate` completing successfully (`condition: service_completed_successfully`), so the app never boots into a schema-less DB — structural, not advisory. Drizzle's `__drizzle_migrations` table makes re-runs a no-op for already-applied migrations, so `migrate` can be re-invoked by `compose up` on every deploy safely.

4. **Uses the prod `DATABASE_URL`.** The `migrate` service inherits `DATABASE_URL` from the compose env block (the same value the `app` service uses: `postgres://…@postgres:5432/learning_platform`), NOT the script's localhost dev default. This is the load-bearing detail: a migrate run with no `DATABASE_URL` would target the unreachable dev default.

5. **No control plane, no migration "service" in the running sense.** `restart: "no"`, no healthcheck serving traffic, exits on completion. It is a build-time/run-time step, not a resident component of the production topology. ADR-0007's single-VPS, single-artifact, one-process shape is unchanged — the `migrate` container is ephemeral.

---

## Rationale

### Why a containerized one-shot over host-side `pnpm db:migrate` (the alternative `deploy.yml` edits implicitly assumed)

`pnpm --filter @learning-platform/core db:migrate` is the obvious mechanism and is exactly what the developer runs locally with a warm Node toolchain. But the deploy target has no such toolchain by constraint (founder's Docker-on-Windows today; a minimal VPS later where the guide's §3 step 1 installs Docker but not necessarily the `pnpm` workspace + the repo checkout's node_modules). Requiring the operator to `git clone` the whole repo onto the prod host *and* install `pnpm` + `node` + `tsx` + `drizzle-kit` just to run migrations reintroduces the "remember to run it" / "right toolchain on the host" fragility C6 forbids. Containerizing means the deploy is one `compose up` on any host that has Docker — nothing else.

### Why reuse the app image rather than a dedicated `migrate` image

A separate `packages/core/Dockerfile.migrate` (slim, `node:20-alpine` + the migrate script) would be the textbook microservice move, but it creates a **second build artifact** that can drift from the app's notion of schema and from `deploy.yml`'s single-image push path. The migrations are already produced by `pnpm --filter web build`'s monorepo context (`COPY . .` brings `packages/core/`); including them in the runner image costs one extra `COPY` line and guarantees the shipped migrations are the applied migrations. One artifact, one deploy, one source of truth — consistent with ADR-0006's "one deployable" and ADR-0007's C8.

### Why `service_completed_successfully` rather than letting the app self-migrate at boot

The app could run migrations on startup (a common Next.js pattern). Rejected: it mixes a write-side state mutation into the read-serve process, races across replicas if v1 ever scales horizontally, and makes the healthcheck's `db:true` ambiguous (did the ping succeed because the table exists, or because migration just created it mid-request?). A discrete, ordered, idempotent step keeps "make the schema correct" and "serve traffic" separate — and idempotency means reordering concerns are moot, so the extra cost of a separate container is purely the `depends_on` wiring.

---

## Consequences

### Positive
- ✅ A fresh host with only Docker installed reaches a green `/api/health` via `compose up` alone — no host `pnpm`/`node`/`psql`, no manual migrate step. This directly closes the gap the prep surfaced and satisfies the founder's Docker-on-Windows constraint.
- ✅ The `deploy.yml` smoke test (`grep '"status":"ok"'` on `/api/health`) now passes on a fresh VPS instead of rolling back a perfectly good release.
- ✅ One build artifact carries its own migrations; no drift between "what shipped" and "what migrates."
- ✅ Re-runs are safe (Drizzle idempotency), so `compose up` on every deploy is the correct, repeatable operation.

### Negative
- ❌ The production runner image grows slightly (the migrations SQL + `meta/` JSON; currently ~10 lines of SQL, negligible).
- ❌ A new operator must understand that `compose up` now performs a write (schema) before serving — a small conceptual change from "compose up just runs the app." Mitigated by ordering + idempotency + this ADR.
- ❌ If a future migration is destructive and slow, it blocks app boot for that duration. Acceptable for v1 (single-VPS, one customer, short migrations); revisit only if migrations grow large (see "When to revisit").

### Neutral
- 🔁 The `migrate` container appears in `docker compose ps` as a completed (Exited 0) container after every deploy. Documented in `DEPLOYMENT_GUIDE.md` so it isn't mistaken for a crashed service.
- 🔁 Local `pnpm db:migrate` (the developer's normal flow) is unchanged — it targets `localhost:5432` with dev creds. The containerized path is the *deploy* path; they don't conflict (different `DATABASE_URL`).

---

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Containerized one-shot `migrate` service, reusing the app image (chosen)** | Accepted | Works on Docker-only hosts (founder constraint); idempotent + ordered; one artifact; matches ADR-0007 C6 (no host toolchain) and ADR-0006 (one deployable). |
| **Host-side `pnpm db:migrate` step in `deploy.yml` SSH / guide §3** | Rejected for v1 | Requires `pnpm` + `node` + the repo checkout on the prod host; "remember to run it" fragility C6 forbids; doesn't work from Docker-on-Windows without a host Node install. Correct pattern for a dev workstation, wrong pattern for a deploy host. |
| **App self-migrates on boot** (Next.js startup hook) | Rejected | Conflates schema-write with request-serve; races across replicas; muddies the `db:true` healthcheck meaning. Separate ordered step is cleaner and idempotency makes the ordering robust. |
| **Dedicated `Dockerfile.migrate` slim image** | Rejected | Creates a second build artifact that can drift from the app's schema and from `deploy.yml`'s single-image path. Reusing the app image (one `COPY . ./packages/core/src/db/migrations`) gives one artifact at near-zero cost. |
| **Defer — manual SSH migrate for now (YAGNI)** | Rejected | The gap is already observable (degraded health on a clean stack); "do it manually first, automate later" leaves the VPS deploy path broken by default — the cost of a deploy-time rollback on a paid host is higher than the cost of this ADR + one service. ADR-0007 §5 (no premature abstraction) doesn't apply: this is the minimal structural mechanism, not speculative infrastructure. |

---

## When to revisit

- **Migrations grow large or slow** (minutes of locking): split into a pre-deploy "expand" and post-deploy "contract" phase (expand/contract migration pattern); this ADR's one-shot ordering would need a two-phase analogue.
- **v1 scales beyond one instance**: the app self-migrate race becomes real only then; the chosen `migrate`-then-`app` ordering already sidesteps it, so no change needed, but a revisit would confirm.
- **A migration is destructive and irreversible in a way that idempotent re-run doesn't handle** (e.g., data-destructive): introduce a migration-review gate before `compose up` rather than running it unattended. v1 has none; revisit when such a migration is proposed.
- **A DB platform change** (e.g. off Postgres, or to a managed DB the app can't `migrate` against) overturns the "app image ships its migrations" model. A new ADR is required to overturn this one.

A new ADR is required to overturn this one.

---

## Escalation triggers

This ADR touches deployment manifests (`docker-compose.prod.yml`) and the app image (`apps/web/Dockerfile`) — the surface ADR-0007 §"Escalation triggers" flags. The change here is non-triggering under that ADR's four tests (it bakes no customer identity, locks no deployment model, introduces no multi-instance control plane, forks no artifact — it *reuses* the one artifact). It is recorded here precisely because the surface is flagged. Future changes to migration handling that would re-introduce any of those four patterns must stop and propose under ADR-0007's convention.

---

## References

- [`ADR-0007-hosting-deployment-model.md`](./ADR-0007-hosting-deployment-model.md) — §"Escalation triggers" (deployment-manifest changes warrant recording the decision); C1/C6 (low-ops, no host toolchain assumed); Decision §5 (no premature abstraction — the chosen mechanism is the minimal one, not speculative).
- [`ADR-0006-plugin-architecture.md`](./ADR-0006-plugin-architecture.md) — "one deployable" produced by `pnpm --filter web build`; the chosen mechanism reuses that one image rather than adding a second.
- [`ADB-0004`/ADR-0004-database.md](./ADR-0004-database.md) — Postgres 16 + Drizzle ORM; the migrate mechanism is Drizzle's standard `migrate()` helper, tracked in `__drizzle_migrations`.
- `packages/core/scripts/migrate.ts` — the idempotent migrate entrypoint reused by the container.
- `packages/core/src/db/migrations/` — the committed, single-source-of-truth migrations now shipped inside the app image.
- `docs/06-sprints/SPRINT-001-production-foundation/evidence/M7-readiness/pre-provision-checklist.md` — where this deploy-path gap was first observed and recorded.
