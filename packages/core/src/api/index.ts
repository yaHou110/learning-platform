/**
 * Public API surface of `@hawza/core`.
 *
 * Plugins and `apps/web` import from here. They MUST NOT import `drizzle-orm`
 * or `pg` directly. The ESLint `no-restricted-imports` rule in each plugin
 * enforces this.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import { hashPassword, type AuthedUser } from "../auth/credentials.js";

/** Identity & Access API. */
export const identity = {
  /** List users in the current tenant. */
  async listUsers(tenantId: string): Promise<Array<typeof schema.users.$inferSelect>> {
    const db = getDb();
    return db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId));
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
