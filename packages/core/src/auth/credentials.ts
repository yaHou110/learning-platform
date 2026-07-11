/**
 * Auth.js v5 helpers (Credentials provider + bcrypt) used by `apps/web`.
 *
 * This module is *config*, not an executable entry point: `apps/web` calls
 * `buildAuthConfig({ db })` to produce a NextAuthConfig.
 */
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema/index.js";

const BCRYPT_COST = 12;

export const CredentialsInputSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(200),
});
export type CredentialsInput = z.infer<typeof CredentialsInputSchema>;

export interface AuthedUser {
  id: string;
  email: string;
  displayName: string;
  tenantId: string;
  role: "super_admin" | "center_admin" | "teacher" | "student";
}

export interface VerifyPasswordOk {
  ok: true;
  user: AuthedUser;
}
export interface VerifyPasswordErr {
  ok: false;
  reason: "unknown_tenant" | "unknown_user" | "bad_password" | "inactive";
}
export type VerifyPasswordResult = VerifyPasswordOk | VerifyPasswordErr;

/**
 * Verify email+password against a system-level Drizzle client.
 * Returns a typed result; never throws on auth failure.
 *
 * Tenant is identified by slug because login happens before the session exists.
 */
export async function verifyPassword(
  db: NodePgDatabase<typeof schema>,
  input: CredentialsInput
): Promise<VerifyPasswordResult> {
  const tenantRows = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, input.tenantSlug))
    .limit(1);
  const tenant = tenantRows[0];
  if (!tenant) return { ok: false, reason: "unknown_tenant" };

  const [user] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      passwordHash: schema.users.passwordHash,
      displayName: schema.users.displayName,
      tenantId: schema.users.tenantId,
      role: schema.users.role,
      isActive: schema.users.isActive,
    })
    .from(schema.users)
    .where(
      sql`${schema.users.tenantId} = ${tenant.id} AND lower(${schema.users.email}) = lower(${input.email})`
    )
    .limit(1);
  if (!user) return { ok: false, reason: "unknown_user" };
  if (!user.isActive) return { ok: false, reason: "inactive" };

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) return { ok: false, reason: "bad_password" };

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      tenantId: user.tenantId,
      role: user.role as AuthedUser["role"],
    },
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export const BCRYPT_COST_FACTOR = BCRYPT_COST;
