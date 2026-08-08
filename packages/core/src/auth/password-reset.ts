/**
 * Password reset (SMS) helpers — used by apps/web `/api/auth/forgot-password`
 * and `/api/auth/reset-password`.
 *
 * Security model:
 * - The code is 6 numeric digits from a CSPRNG (`node:crypto.randomInt`).
 * - Only the SHA-256 hex of the code is persisted, so a DB leak cannot be
 *   replayed to reset a password.
 * - Tokens are single-use (consumed on verify) and expire after
 *   `RESET_TOKEN_TTL_MS`. Requesting a new code invalidates the previous one.
 */
import { createHash, randomInt } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../db/schema/index.js";
import { hashPassword } from "./credentials.js";

/** Token validity window — 10 minutes. */
export const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

/** 6-digit numeric code (zero-padded) from a CSPRNG. */
export function generateResetCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** SHA-256 hex of the code — what we persist, so a DB leak can't be replayed. */
export function hashResetToken(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Normalize a phone input: Persian (۰-۹) and Arabic (٠-٩) digits → Latin,
 * and strip spaces/dashes. Returns the 11-digit form (e.g. 09123456789).
 */
export function normalizePhone(phone: string): string {
  const latin = phone
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  return latin.replace(/[\s-]/g, "");
}

/**
 * Resolve a user by (tenant slug, national ID, phone). Returns null when any
 * of the three does not match — the API layer answers generically either way
 * so an attacker cannot enumerate which accounts exist.
 */
export async function findUserForReset(
  db: NodePgDatabase<typeof schema>,
  input: { tenantSlug: string; nationalId: string; phone: string }
): Promise<{ id: string; tenantId: string } | null> {
  const [tenant] = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, input.tenantSlug))
    .limit(1);
  if (!tenant) return null;

  const [user] = await db
    .select({ id: schema.users.id, tenantId: schema.users.tenantId })
    .from(schema.users)
    .where(
      sql`${schema.users.tenantId} = ${tenant.id} AND ${schema.users.nationalId} = ${input.nationalId} AND ${schema.users.phone} = ${input.phone}`
    )
    .limit(1);
  return user ?? null;
}

/**
 * Store a reset code for a user. Any previous code for that user is deleted
 * first, so a fresh request always invalidates the older one.
 */
export async function createResetToken(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  code: string,
  ttlMs: number = RESET_TOKEN_TTL_MS
): Promise<void> {
  await db
    .delete(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.userId, userId));

  await db.insert(schema.passwordResetTokens).values({
    userId,
    token: hashResetToken(code),
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

/**
 * High-level "forgot password" step 1: resolve the account, mint a code and
 * persist it. Returns `{ userId, code }` when the account matches, else null
 * (the API layer answers generically either way to avoid enumeration).
 */
export async function requestPasswordReset(
  db: NodePgDatabase<typeof schema>,
  input: { tenantSlug: string; nationalId: string; phone: string }
): Promise<{ userId: string; code: string } | null> {
  const user = await findUserForReset(db, input);
  if (!user) return null;
  const code = generateResetCode();
  await createResetToken(db, user.id, code);
  return { userId: user.id, code };
}

/**
 * High-level "forgot password" step 2: verify the code (single-use), then set
 * the new password hash. Returns false for any mismatch — the caller answers
 * with a generic error.
 */
export async function completePasswordReset(
  db: NodePgDatabase<typeof schema>,
  input: {
    tenantSlug: string;
    nationalId: string;
    code: string;
    newPassword: string;
  }
): Promise<boolean> {
  const [tenant] = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, input.tenantSlug))
    .limit(1);
  if (!tenant) return false;

  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.tenantId, tenant.id),
        eq(schema.users.nationalId, input.nationalId)
      )
    )
    .limit(1);
  if (!user) return false;

  const ok = await verifyAndConsumeResetToken(db, user.id, input.code);
  if (!ok) return false;

  const passwordHash = await hashPassword(input.newPassword);
  await db
    .update(schema.users)
    .set({ passwordHash })
    .where(eq(schema.users.id, user.id));
  return true;
}

/**
 * Verify a submitted code and consume it (single-use). Also sweeps the user's
 * expired tokens so they can never be used. Returns false for wrong code,
 * expired code, or no code — the caller answers generically.
 */
export async function verifyAndConsumeResetToken(
  db: NodePgDatabase<typeof schema>,
  userId: string,
  code: string
): Promise<boolean> {
  await db
    .delete(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.userId, userId),
        sql`${schema.passwordResetTokens.expiresAt} < now()`
      )
    );

  const tokenHash = hashResetToken(code);
  const [row] = await db
    .select({ id: schema.passwordResetTokens.id })
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.userId, userId),
        eq(schema.passwordResetTokens.token, tokenHash)
      )
    )
    .limit(1);
  if (!row) return false;

  // Single-use: consume immediately.
  await db
    .delete(schema.passwordResetTokens)
    .where(eq(schema.passwordResetTokens.id, row.id));
  return true;
}
