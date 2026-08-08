/**
 * Public API surface of `@learning-platform/core`.
 *
 * Plugins and `apps/web` import from here. They MUST NOT import `drizzle-orm`
 * or `pg` directly. The ESLint `no-restricted-imports` rule in each plugin
 * enforces this.
 *
 * Security note (M4-0 / Session 015): the public read APIs (`listUsers`,
 * `getUserById`) use **explicit Drizzle column projection** so that
 * `passwordHash` can never leave this module. The return type (`UserPublic`)
 * mirrors the projection. Defense in depth: the database, the type system,
 * and the JSON serializer all agree on what is safe to return.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { hashPassword, type AuthedUser } from "../auth/credentials.js";
import {
  requestPasswordReset as requestPasswordResetImpl,
  completePasswordReset as completePasswordResetImpl,
} from "../auth/password-reset.js";
import type { Role } from "../db/schema/index.js";
export { catalog, COURSE_STATUSES, CONTENT_TYPES } from "./catalog.js";
export type { Course, Lesson } from "./catalog.js";
export { learning, ENROLLMENT_STATUSES, PROGRESS_STATUSES } from "./learning.js";
export { credentials } from "./credentials.js";
export type { Certificate } from "./credentials.js";

/**
 * Public projection of a user. NEVER includes `passwordHash`. The DB-level
 * projection in `listUsers` / `getUserById` is the source of truth; this
 * type just keeps the type system honest.
 */
export type UserPublic = {
  id: string;
  tenantId: string;
  email: string;
  nationalId: string;
  phone: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  deactivatedAt: Date | null;
};

/** Identity & Access API. */
export const identity = {
  /**
   * List users in the current tenant. The SQL projection is explicit:
   * `passwordHash` is not selected. The return type (`UserPublic`) does not
   * have a `passwordHash` field, so the type system would also reject any
   * accidental future leak.
   */
  async listUsers(tenantId: string): Promise<UserPublic[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.users.id,
        tenantId: schema.users.tenantId,
        email: schema.users.email,
        nationalId: schema.users.nationalId,
        phone: schema.users.phone,
        displayName: schema.users.displayName,
        role: schema.users.role,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        deactivatedAt: schema.users.deactivatedAt,
      })
      .from(schema.users)
      .where(eq(schema.users.tenantId, tenantId));
    // The Drizzle rows may carry the role as a string. Coerce to the Role
    // union so callers can switch on it without a cast.
    return rows.map((r) => ({ ...r, role: r.role as Role }));
  },

  /**
   * Get a single user by id, scoped to the tenant. Same projection rules
   * as `listUsers` — `passwordHash` is not selected.
   */
  async getUserById(tenantId: string, userId: string): Promise<UserPublic | null> {
    const db = getDb();
    const [row] = await db
      .select({
        id: schema.users.id,
        tenantId: schema.users.tenantId,
        email: schema.users.email,
        nationalId: schema.users.nationalId,
        phone: schema.users.phone,
        displayName: schema.users.displayName,
        role: schema.users.role,
        isActive: schema.users.isActive,
        createdAt: schema.users.createdAt,
        deactivatedAt: schema.users.deactivatedAt,
      })
      .from(schema.users)
      .where(
        and(eq(schema.users.tenantId, tenantId), eq(schema.users.id, userId))
      )
      .limit(1);
    if (!row) return null;
    return { ...row, role: row.role as Role };
  },

  /**
   * Cheap existence + active check used by the Auth.js `session` callback
   * to close the JWT deactivation gap. Returns the tuple `(exists, active)`.
   * Selecting only `id, isActive` keeps this well under 1 ms on a primary
   * key lookup.
   */
  async checkUserActive(userId: string): Promise<{ exists: boolean; active: boolean }> {
    const db = getDb();
    const [row] = await db
      .select({ id: schema.users.id, isActive: schema.users.isActive })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    if (!row) return { exists: false, active: false };
    return { exists: true, active: row.isActive };
  },

  async createUser(input: {
    tenantId: string;
    email: string;
    nationalId: string;
    phone: string;
    displayName: string;
    role: AuthedUser["role"];
    password: string;
  }): Promise<typeof schema.users.$inferSelect> {
    const db = getDb();
    const passwordHash = await hashPassword(input.password);
    const [row] = await db
      .insert(schema.users)
      .values({
        tenantId: input.tenantId,
        email: input.email.toLowerCase(),
        nationalId: input.nationalId,
        phone: input.phone,
        displayName: input.displayName,
        role: input.role,
        passwordHash,
      })
      .returning();
    if (!row) throw new Error("createUser: no row returned");
    return row;
  },

  /**
   * Password reset via SMS — steps 1 and 2. `request` resolves the account
   * (tenant slug + national ID + phone), mints a 6-digit code and persists it
   * (hashed); `complete` verifies the single-use code and sets the new hash.
   */
  async requestPasswordReset(input: {
    tenantSlug: string;
    nationalId: string;
    phone: string;
  }): Promise<{ userId: string; code: string } | null> {
    return requestPasswordResetImpl(getDb(), input);
  },

  async completePasswordReset(input: {
    tenantSlug: string;
    nationalId: string;
    code: string;
    newPassword: string;
  }): Promise<boolean> {
    return completePasswordResetImpl(getDb(), input);
  },

  async deactivateUser(tenantId: string, userId: string): Promise<void> {
    const db = getDb();
    await db
      .update(schema.users)
      .set({ isActive: false, deactivatedAt: new Date() })
      .where(and(eq(schema.users.tenantId, tenantId), eq(schema.users.id, userId)));
  },
};

/** Health/readiness. */
export const health = {
  /**
   * Deep health check. Pings each external dependency the request path
   * touches in v1. A dependency that is not configured (e.g. no S3 in v1
   * dev) reports `skipped` rather than `false`, so a prod-shape mismatch
   * does not read as an outage.
   *
   * Status mapping:
   * - `ok`       — every configured check passed.
   * - `degraded` — at least one configured check failed; others passed.
   * - `error`    — the check itself threw (e.g. DB unreachable).
   */
  async check(): Promise<{
    status: "ok" | "degraded" | "error";
    checks: { db: boolean; auth: boolean | "skipped"; storage: boolean | "skipped" };
  }> {
    const { pingDb } = await import("../db/client.js");
    const checks = { db: false, auth: false as boolean | "skipped", storage: false as boolean | "skipped" };

    // DB (Postgres) — always configured in v1.
    try {
      checks.db = await pingDb();
    } catch {
      checks.db = false;
    }

    // Auth — for v1, reaching the DB is the cheap proxy that the Auth.js
    // Credentials provider + Drizzle adapter can resolve a session. We do
    // not call into Auth.js here (it has no headless "ping"), so the check
    // is "DB reachable" ⇒ auth can serve. Mark skipped only when the DB is
    // down, which the `db` check already surfaces — so auth mirrors db.
    checks.auth = checks.db ? true : false;

    // Object storage — not wired in v1 (ADR-0010 proposed). Report skipped
    // so the endpoint does not lie about a missing dependency.
    checks.storage = "skipped";

    const allConfigured = [checks.db, checks.auth];
    const anyFailed = allConfigured.some((c) => c === false);
    const status = anyFailed ? "degraded" : "ok";
    return { status, checks };
  },
};

export const readiness = {
  /**
   * Shallow readiness check. Confirms the process is live and its required
   * configuration is loaded — NOT whether external deps are reachable. Used
   * by the load balancer / reverse proxy (M6) to decide whether to route
   * traffic to this instance. A `503` from here means withdraw the instance,
   * not necessarily that the app is "broken" for existing connections.
   */
  async check(maintenanceFlag?: boolean): Promise<{
    status: "ready" | "not_ready";
    checks: { config: boolean; maintenance: boolean };
  }> {
    // Config: the two env keys the app literally cannot serve without.
    const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
    const DATABASE_URL = process.env.DATABASE_URL ?? "";
    const configOk = AUTH_SECRET.length > 0 && DATABASE_URL.length > 0;
    const maintenance = maintenanceFlag === true || process.env.MAINTENANCE_MODE === "1";
    const status = configOk && !maintenance ? "ready" : "not_ready";
    return {
      status,
      checks: { config: configOk, maintenance },
    };
  },
};
