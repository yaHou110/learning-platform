# M7 — Data Layer & RLS Audit — Hardening

> **Status:** ✅ Applied (LOW-risk hardening), **2026-07-26**
> **Author:** read-only audit session (post-M6 merge, M7 cloud-target branch)
> **Risk:** LOW (no schema change; no behavioral change to the running v1 app — both fixes are provably inert under v1's documented isolation model)
> **Scope:** `packages/core` (Drizzle + pg), RLS policies, `DATABASE_URL` handling
> **PR risk note:** this note covers the **data-layer subset** of the combined M7
> hardening PR; that subset is LOW-risk and provably inert under v1. The PR also
> carries a **recovered auth-hardening batch** (credential-submit rate limit, login
> timing equalization, XFF-spoofing fix) that sets the **PR's overall risk to MEDIUM** —
> see the PR body. The two streams are independent; this document records only the
> data-layer audit.
> **ADR:** this work operates **within** ADR-0008's three-layer model; one finding is escalated as a founder decision under ADR-0008's escalation-trigger list.

---

## 1. Audit

A read-only data-layer / RLS audit of `packages/core` (the sole DB owner, ADR-0006) ran
across `src/db/schema/`, `src/db/migrations/0000_nosy_kang.sql`, `src/db/client.ts`, all RLS
policies, and the app-layer tenant-isolation WHERE clauses. Four findings, ranked HIGH → LOW:

| # | Location | Severity | Defect | Disposition here |
|---|---|---|---|---|
| 1 | `migrations/0000_nosy_kang.sql:44-53` | HIGH | RLS "defense-in-depth" is not in effect: RLS enabled but never `FORCE`d (owner bypasses), `getDb()` never sets `app.tenant_id`, and `current_setting('app.tenant_id')::uuid` has no `missing_ok` → a least-privilege non-owner role would hard-error instead of seeing zero rows | **Latent-risk subset fixed** (`missing_ok` + idempotency). Full activation (`FORCE` + non-owner role + per-acquire `SET LOCAL`) **escalated as founder decision** — contradicts documented v1 model |
| 2 | `db/client.ts:21-23` / `apps/web/src/lib/env.ts` | MED | `DATABASE_URL` passed to pool with zero validation; a password with `/ @ : %` silently breaks `pg`'s parser (documented lp-app 503; Railway passwords can contain these) | **Fixed** — fail-fast guard in `env.ts` + doc note in `.env.example` + `DEPLOYMENT_GUIDE.md` |
| 3 | `migrations/0000_nosy_kang.sql:44,50` | LOW | `CREATE POLICY` not idempotent (rest of migration is) | **Fixed** — `DO $$ … EXCEPTION WHEN duplicate_object` |
| 4 | `migrations/0000_nosy_kang.sql:50` | LOW | `tenants` policy is `FOR SELECT` only; `users` is `FOR ALL` — inconsistency | **Documented** (consistency comment added; intentional for v1) |

### Non-findings (verified clean)

- **No `TO authenticated` pseudo-roles remain** — only `TO PUBLIC` (`0000_nosy_kang.sql`).
- **No SQL injection** — `credentials.ts:75` uses Drizzle's `sql` template; values bind as parameters, column refs are typed identifiers.
- **No cross-tenant leak in `checkUserActive`** (`api/index.ts:96-105`) — `userId` is the JWT `token.id` set at login, not per-request attacker-controlled; an external probe requires forging a signed token.
- **No N+1** — `listUsers`/`getUserById`/`checkUserActive` are single queries; the session-callback PK lookup is the documented sub-ms deactivation re-check.
- **No app-layer tenant-isolation gap** — every tenant-scoped read/write uses `eq(tenantId, …)` or `and(eq(tenantId,…), eq(id,…))`; `createUser` inserts with the caller's tenant.

---

## 2. Fixes applied (this PR)

### 2.1 `migrations/0000_nosy_kang.sql` — RLS policy hardening (finding #1 latent subset + #3 + #4)

- `current_setting('app.tenant_id')` → `current_setting('app.tenant_id', true)` in both
  policies. The `, true` (the `missing_ok` argument) makes an **unset GUC return NULL** instead
  of raising `unrecognized configuration parameter "app.tenant_id"`. v1's app path (`getDb()` in
  `client.ts`) never sets `app.tenant_id` today (the deprecated `withTenantDb` is the only
  setter, and has no callers). Without `missing_ok`, the natural M7 hardening step of moving the
  app to a least-privilege non-owner role would make every `users`/`tenants` query hard-error
  rather than simply hide rows (`NULL::uuid ≠ tenant_id` ⇒ zero rows — the correct behavior).
- `CREATE POLICY` wrapped in `DO $$ … EXCEPTION WHEN duplicate_object … END $$` for idempotent
  re-execution (manual DB reset / restore), mirroring the FK block at the top of the file.
- Consistency comment added to the `tenants` `FOR SELECT` policy: v1 has no tenant-creation write
  path that a least-privilege role would exercise (tenants are seeded by the founder/migrate
  path, which runs as owner and bypasses RLS); a future write path will add a matching
  `FOR INSERT/UPDATE` policy.

**Migration path:** the file is edited in place, consistent with how `0000_nosy_kang.sql` was
already evolved in place (the `2026-07-22` note switching `TO authenticated` → `TO PUBLIC`).
Drizzle's `migrate()` tracks applied migrations in `__drizzle_migrations`; it does not re-run
`0000` on a DB that already has it. **Existing dev DBs keep the old (inert under owner-bypass)
policies; fresh provisions get the hardened ones.** Avoids hand-authoring a second migration
journal entry, which would be fragile for a zero-behavioral-change fix.

**Scope deliberately kept to the non-activating subset.** The full RLS fix (finding #1 active
part) is **not applied here** because it contradicts the documented v1 isolation model and would
break the running app:

- `ALTER TABLE … FORCE ROW LEVEL SECURITY` would make the table owner subject to RLS — but the
  app connects as the same role that owns the tables (no `CREATE ROLE`/`GRANT`/`BYPASSRLS`
  appears anywhere in the repo or migrations), so the app would suddenly be filtered by the
  `app.tenant_id` GUC it never sets ⇒ every `users`/`tenants` query returns zero rows ⇒ total
  auth + data outage.
- The per-request `SET LOCAL app.tenant_id` session hook (the third piece) requires wiring a
  connection-acquire callback into the pool + resolving the tenant context pre-query, which is
  the subdomain-resolution middleware work ADR-0008 §3 explicitly defers to the schema-freeze /
  M5 implementation ("detailed resolution mechanics … are implementation detail owned by the
  schema-freeze / M5 work, not by this ADR").

Per ADR-0008's **Agent escalation triggers** (trigger #2: "Omit or bypass the RLS session
setting … a path that reads/writes tenant-scoped rows without the session set collapses three
layers to one"), fully activating RLS is **a founder decision**, not a safe inline fix. It is
recorded below as the one escalated item.

### 2.2 `apps/web/src/lib/env.ts` — `DATABASE_URL` fail-fast guard (finding #2)

- New `requireDatabaseUrl()` (same prod-throw / dev-warn shape as `requireSecret`). Acts only on
  the URI form (`postgres://` / `postgresql://`); the libpq `key=value` form is left alone (no
  authority segment; `new URL` would false-positive). Parses with `new URL`; in **production**
  throws if the URL is unparseable **or** has an empty hostname — the exact signal of an
  unencoded `/` or stray `@` in the password segment that terminates the authority early and
  makes `pg` see no host. The error names the percent-encoding fix (`/`→`%2F`, `@`→`%40`,
  `:`→`%3A`, `%`→`%25`). In **dev/test** it warns only, so tests that import `auth` (which
  imports `env` at startup) keep booting under the plain dev default. `isProd` is false under
  `NODE_ENV=test`, so existing tests are unaffected (22/22 still pass).
- `apps/web/.env.example` + `docs/07-deployment/DEPLOYMENT_GUIDE.md` §1A — percent-encoding note
  for the production operator next to `DATABASE_URL`.

**Why this is provably safe:** a valid Railway URL
(`postgresql://user:pass@host:5432/db?sslmode=require`) parses cleanly with a non-empty hostname
— no false positive. The only triggers are structurally broken URLs, which would have failed
downstream anyway; we just fail *early and actionably*.

---

## 3. Escalated to founder (NOT applied — ADR-0008 escalation)

**Finding #1 (active part) — fully activate RLS.** Requires:

1. Run the app as a **non-owner** role (`CREATE ROLE app_user … ; GRANT … ; REVOKE … `) so the
   owner-bypass stops masking the policies.
2. `ALTER TABLE users / tenants FORCE ROW LEVEL SECURITY`.
3. Wire a **per-request `SET LOCAL app.tenant_id`** session hook on connection acquire, fed by
   the resolved tenant context (ADR-0008 §3: subdomain-resolved in v1).

This is the change that makes the database layer of ADR-0008's three-layer model actually
enforce — today it is documented but inert (owner-bypassed, GUC never set, app-layer WHERE
clauses carry isolation alone, which ADR-0008's "rejected alternatives" table explicitly warns
"leaves a single-bug path to cross-tenant leakage"). It is also the change that, done
carelessly, would break the running app.

**Recommendation:** defer to the ADR-0008 §3 tenant-resolution implementation work
(schema-freeze / M5), where the `SET LOCAL` hook is the natural home, rather than bolt it onto
the M7 deploy milestone. Record the decision in a new ADR or an ADR-0008 amendment before
implementing. The `missing_ok` fix landed here ensures that when that day comes, the policies no
longer hard-error on a cold connection — they already hide rows cleanly.

---

## 4. Definition of Ready

| Field | Value |
|---|---|
| Objective | Apply safe, provably-inert RLS hardening + a `DATABASE_URL` fail-fast guard surfaced by a read-only data-layer audit; escalate the architecture-altering RLS-activation finding. |
| Acceptance criteria | (a) `current_setting('app.tenant_id', true)` in both policies; (b) `CREATE POLICY` idempotent; (c) `env.ts` throws in prod on an unencoded-special-char `DATABASE_URL` and warns in dev; (d) `pnpm verify` green; (e) ADR-0008 referenced. |
| Constraints | No schema change; no behavioral change to the running app; no new dependency; do not relitigate the `TO PUBLIC` / `TO authenticated` decision. |
| Risks | LOW — migration edit is inert on existing DBs (not re-run); env guard has no false positives on valid URLs. |
| Owner | Founder. |

## 5. Verification (local)

```text
pnpm --filter web typecheck                 → exit 0
pnpm --filter @learning-platform/core typecheck → exit 0
pnpm lint                                   → exit 0 (all 8 workspaces Done)
pnpm --filter @learning-platform/core test  → 10/10 passed
pnpm verify                                 → 22/22 web tests + 10/10 core tests + build ✓
```

CI will re-run `pnpm verify` + `pnpm governance:validate` on the PR (governance.yml).

## 6. Rollback

`git revert <commit>`. No data migration, no schema change. The `0000_nosy_kang.sql` edit
affects only future fresh provisions (existing DBs keep the prior policies); reverting the file
restores the prior policy text for the next provision. The `env.ts` guard revert restores
length-only `DATABASE_URL` validation. No user-facing behavior in v1 depends on either change.

## 7. ADR compliance

- **ADR-0008** (multi-tenant isolation, three-layer enforcement): this work *operates within*
  the model — it does not weaken it. The `missing_ok` fix *enables* the database layer to
  enforce cleanly once activated; it does not activate it. Full activation is escalated per
  ADR-0008 trigger #2 (OMIT/BYPASS RLS session setting), a founder decision, not a silent
  generalization. This PR does **not** add a tenant-scoped table without `tenant_id`, does **not**
  weaken `tenant_id` enforcement, and does **not** build operational tenancy prematurely.
- **ADR-0006** (`core` sole DB owner): the env guard lives in `apps/web` only because it is the
  app's boot-time config gate; the `DATABASE_URL` it validates is the same `pg` connection string
  `core/client.ts` consumes. No package outside `core` now touches Drizzle/`pg`.
- **ADR-0004** (database): citext / RLS posture unchanged in shape; only the policy
  `missing_ok` and idempotency improved.
