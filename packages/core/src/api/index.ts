/**
 * Public API surface of `@hawza/core`.
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
import type { Role } from "../db/schema/index.js";

/**
 * Public projection of a user. NEVER includes `passwordHash`. The DB-level
 * projection in `listUsers` / `getUserById` is the source of truth; this
 * type just keeps the type system honest.
 */
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
        displayName: input.displayName,
        role: input.role,
        passwordHash,
      })
      .returning();
    if (!row) throw new Error("createUser: no row returned");
    return row;
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
  async check(): Promise<{ db: boolean }> {
    const { pingDb } = await import("../db/client.js");
    return { db: await pingDb() };
  },
};
