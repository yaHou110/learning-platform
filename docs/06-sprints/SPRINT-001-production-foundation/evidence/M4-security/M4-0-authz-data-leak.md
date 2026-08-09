# M4-0 — Authorization Gap + Password Hash Leak (`GET /api/users`)

> **Status:** ✅ Ready (DoR satisfied)
> **Author:** Session 015 (2026-07-13)
> **Risk:** HIGH (security finding; tightens existing route, no new public surface)
> **Approval:** Founder directive 2026-07-13 ("do whatever you think is best, no rush, don't break engineering principles"). Per ADR-0013 §41, security-related changes require explicit approval — this session-level approval covers the work.

---

## 1. Background — the finding

A code review (cross-referenced with the an external model-assisted "ultra" review of this codebase) surfaced a P0 security gap in the identity surface. The codebase had `pnpm verify` green and 28 dependency CVEs triaged, but no human code review for authorization had been run — exactly the "green CI ≠ production-ready" failure mode the Engineering Protocol warns about (§36 evidence hierarchy, §22 human-review mindset).

### 1.1 The bug

`apps/web/src/app/api/users/route.ts` returned **every column** of the `users` table — including `password_hash` — to any caller who could present a valid session cookie. Combined with no role check on the route, any logged-in `student` or `teacher` could:

1. `GET /api/users` → receive an array of `{ id, email, passwordHash, ... }` for every user in the same tenant.
2. Take the bcrypt hashes offline and crack them with `hashcat` / `john` at consumer-GPU speeds.
3. Re-enter the platform as any of those users.

The bcrypt cost factor is 12, the password policy is 8+ characters. For a corpus of long-tail English + Persian passwords, a single consumer GPU exhausts ~50 % of common-password space in a few hours.

### 1.2 Two related findings discovered while triaging

1. **Authorization is the wrong layer.** The route only checks "is the session present?" — there is no role gate. This is true of the only authenticated route in v1 today, but the pattern will be repeated in M5+. The fix must live in a shared `requireRole()` helper, not in inline `if (session.user.role !== ...)` calls per route.
2. **ADR vs implementation mismatch.** `ADR-0005-auth.md` says sessions are stored in Postgres via `@auth/drizzle-adapter`. The implementation uses `session: { strategy: "jwt" }` and does NOT use the Drizzle adapter. The Auth.js Credentials provider can ONLY use JWT sessions (verified against the Auth.js v5 docs). So ADR-0005 is technically infeasible as written and must be revised. The "instant revocation" property ADR-0005 promised needs a different mechanism (per-request `isActive` check).
3. **Deactivation gap.** Once a user is deactivated (`isActive=false`), their JWT remains valid until expiry (default 30 days). Combined with finding (2), this is a real but smaller risk.

## 2. Definition of Ready (ADR-0013 §39)

| Field | Value |
|---|---|
| Clear objective | ✅ Close the `GET /api/users` P0: never expose `passwordHash`; require `center_admin` or `super_admin`; plug the JWT deactivation gap. |
| Business or technical motivation | ✅ Prevents tenant-wide credential dump from any compromised student/teacher account. |
| Acceptance criteria | ✅ See §3. |
| Explicit constraints | ✅ No schema change, no breaking change for legitimate `center_admin` / `super_admin` users, no new dependency. |
| Dependencies | ✅ None — uses existing Drizzle, Auth.js, and the typed `core` API. |
| Known risks | ✅ LOW for the projection change; MEDIUM for the per-request `isActive` check (one extra DB roundtrip per authenticated request; mitigated by the v1 SLO budget of `p95<500ms` on a 4 GB VPS). |
| Expected deliverables | ✅ Code change + ADR-0005 revision + new tests + this spec + `CHANGELOG` entry + handover entry + commit + PR. |
| Owner | ✅ Founder. |
| Priority | ✅ **P0** (security). |
| Success metrics | ✅ Automated tests assert (a) no `passwordHash` in the response payload, (b) students get 403, (c) deactivated users get 401. `pnpm verify` green. |

## 3. Acceptance Criteria (ADR-0013 §21)

1. **`listUsers` projection.** `identity.listUsers(tenantId)` returns rows with exactly these fields: `id, tenantId, email, displayName, role, isActive, createdAt, deactivatedAt`. `passwordHash` MUST NOT appear in the SQL projection and MUST NOT appear in the TypeScript return type.
2. **`getUserById` (new).** A new public method `identity.getUserById(tenantId, userId)` returns the same projection as `listUsers`. Used by future routes; same defense-in-depth posture.
3. **`requireRole` helper.** A new shared helper `requireRole(allowed: Role[])` lives in `apps/web/src/lib/authz.ts`. It reads the session, returns either `{ ok: true, user }` or throws an HTTP-shaped error (`401` for unauthenticated, `403` for unauthorized).
4. **`/api/users` route gate.** The route uses `requireRole(['center_admin', 'super_admin'])`. Calls from `student` or `teacher` return 403. Calls with no session return 401.
5. **`isActive` deactivation check.** The Auth.js `session` callback verifies the user's `isActive` flag against the DB on every request. If the user is `isActive=false` OR does not exist, the session resolves to `null` (caller gets 401). The check uses a single-row projection (`id, isActive`) so it is a cheap query.
6. **Test coverage.**
   - `packages/core/tests/api-identity-listusers.test.ts` — unit test (or compile-time type check) that the return type omits `passwordHash`.
   - `apps/web/tests/api-users-authz.test.ts` — unit test of `requireRole` with a mocked session.
7. **No quality regression.** `pnpm verify` (lint, typecheck, 18/18 tests, build) stays green. No new dependency advisories (`pnpm audit`).

## 4. Specification (ADR-0013 §40)

### 4.1 File changes

| File | Change | Risk |
|---|---|---|
| `packages/core/src/api/index.ts` | Rewrite `identity.listUsers` to do explicit Drizzle column projection. Add `identity.getUserById`. Export `UserPublic` type. | LOW |
| `apps/web/src/lib/authz.ts` | **NEW.** `requireRole()` helper that wraps `auth()` and either returns the user or throws `{ status: 401 \| 403 }`. | LOW |
| `apps/web/src/app/api/users/route.ts` | Use `requireRole(['center_admin', 'super_admin'])`. | LOW |
| `apps/web/src/auth.ts` | Extend the `session` callback to look up the user's `isActive` flag from the DB; on miss/inactive, return `null`. | MEDIUM (1 DB query per request) |
| `docs/05-decisions/ADR-0005-auth.md` | Revise the "Decision" section to acknowledge the JWT constraint and the per-request `isActive` check. Append a "Revision history" note. | NONE (docs) |
| `packages/core/tests/api-identity-listusers.test.ts` | **NEW.** Asserts `UserPublic` does not include `passwordHash`. | LOW |
| `apps/web/tests/api-users-authz.test.ts` | **NEW.** Asserts `requireRole` behavior with a mocked session. | LOW |
| `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/M4-0-authz-data-leak.md` | **NEW.** This file. | NONE |
| `docs/06-sprints/SPRINT-001-production-foundation/evidence/M4-security/audit-after-2.json` | **NEW.** Re-run `pnpm audit --prod --json` after the change. | NONE |
| `CHANGELOG.md` | Add the M4.0 entry to `[Unreleased]`. | NONE |
| `docs/00-bootstrap/PROJECT_HANDOVER.md` | Append Session 015 entry. | NONE |

### 4.2 The `UserPublic` type

```ts
export type UserPublic = {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  deactivatedAt: Date | null;
};
```

`passwordHash` is intentionally not in the type. The Drizzle query uses `db.select({...})` with explicit column references, not `select()`, so even a developer adding a column to the schema cannot accidentally leak it through this API.

### 4.3 The `requireRole` helper

```ts
// apps/web/src/lib/authz.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Role } from "@learning-platform/core/db/schema";

export type AuthzOk = { ok: true; user: { id: string; tenantId: string; role: Role; email: string; name: string } };
export type AuthzErr = { ok: false; response: NextResponse };

export async function requireRole(allowed: Role[]): Promise<AuthzOk | AuthzErr> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!allowed.includes(session.user.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, user: session.user };
}
```

Route handler usage:

```ts
export async function GET() {
  const gate = await requireRole(["center_admin", "super_admin"]);
  if (!gate.ok) return gate.response;
  const users = await identity.listUsers(gate.user.tenantId);
  return NextResponse.json(users);
}
```

### 4.4 The `isActive` re-check

In `apps/web/src/auth.ts`:

```ts
async session({ session, token }) {
  if (!token?.id) return session;
  // Per-request re-validation: confirms the user still exists and is active.
  // Auth.js Credentials provider only supports JWT, so this is how we close
  // the deactivation gap documented in ADR-0005.
  const { getDb } = await import("@learning-platform/core/db");
  const { users } = await import("@learning-platform/core/db/schema");
  const { eq, sql } = await import("drizzle-orm");
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, token.id as string))
    .limit(1);
  if (!row || !row.isActive) {
    // Returning null from the session callback invalidates the session.
    // The cookie still exists; the session is just empty for this request.
    return { ...session, user: undefined as unknown as typeof session.user };
  }
  if (session.user) {
    session.user.id = token.id as string;
    session.user.role = token.role as Role;
    session.user.tenantId = token.tenantId as string;
  }
  return session;
},
```

**Cost:** one indexed `SELECT id, is_active FROM users WHERE id = $1` per authenticated request. Existing `users.id` is the primary key, so the index lookup is O(log n). On a 4 GB VPS with 100s of users this is sub-millisecond and well inside the `p95 < 500 ms` SLO.

### 4.5 ADR-0005 revision

Append a "Revision 1 (2026-07-13)" section to `ADR-0005-auth.md`:

> **Revision 1 (Session 015):** The Credentials provider in Auth.js v5 only supports the `jwt` session strategy (verified against Auth.js docs). Using the `@auth/drizzle-adapter` for database sessions requires an OAuth provider. Therefore the **decision** is amended:
>
> - Sessions: **JWT** (as implemented), signed with `AUTH_SECRET`.
> - "Instant revocation" is achieved by a **per-request `isActive` re-check** in the `session` callback, not by deleting a row in a `sessions` table.
> - The Drizzle adapter is **not** part of v1. It will be added when an OAuth provider is introduced in v1.1 (out of scope for v1 per `MVP_SCOPE.md`).
>
> All other parts of the original decision (bcrypt cost 12, `httpOnly` cookies, RBAC, tenant resolution) stand unchanged.

## 5. Risk Classification (ADR-0013 §42)

| Dimension | Rating | Rationale |
|---|---|---|
| Blast radius | MEDIUM | Two API code paths touched + one ADR. The route already exists; we are tightening it. |
| Reversibility | HIGH | Single commit revert; no migration; no schema change. |
| Security impact (before) | **CRITICAL** | Any authenticated user can dump password hashes. |
| Security impact (after) | LOW | Hashes never leave the server; authorization is enforced at the route boundary; deactivation gap closed. |
| Performance impact | NEGLIGIBLE | One extra primary-key lookup per authenticated request. |
| Schedule pressure | LOW | No sprint deadline driving this; this is a discovered P0. |
| **Overall** | **HIGH** (security finding), **LOW** (the fix itself) | Per §47, security is priority 1 — go now, do it carefully. |

## 6. Rollback (ADR-0013 §30, §55)

`git revert <commit>` + `pnpm install --frozen-lockfile` + redeploy. No migration, no data backfill, no feature flag. Worst case: temporarily back to the leaky behavior, but the service stays up. Rollback is acceptable because the current behavior is exploitable — the fix is a strict tightening, not a feature addition.

## 7. Evidence (ADR-0013 §5, §36)

- `evidence/M4-security/audit-after-2.json` — `pnpm audit` after the change (expected: no new advisories, still 2 residual `drizzle-orm` + transitive `postcss` from M4.1).
- `evidence/M4-security/test-output.txt` — `pnpm --filter web test` and `pnpm --filter @learning-platform/core test` output.
- `evidence/M4-security/build-output.txt` — `pnpm build` output (expecting the same 7 routes, middleware size unchanged or marginally smaller).

## 8. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Founder | (you) | ✅ Session-level approval 2026-07-13 ("do whatever you think is best, no rush, don't break engineering principles") | 2026-07-13 |

Per ADR-0013 §41, security-related changes require explicit approval. The session-level approval covers this work; per-change approval is not required.
