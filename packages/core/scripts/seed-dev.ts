/**
 * Idempotent dev seed.
 *
 * Creates:
 *   - one tenant (`slug=demo`, name="Learning Platform Demo")
 *   - one super_admin user (`email=admin@lp.local`, password=`changeme`)
 *
 * Re-running is safe: `ON CONFLICT DO NOTHING`.
 *
 * Usage: `pnpm --filter @learning-platform/core db:seed:dev`
 *
 * Env loading: `loadEnvOnce()` reads `${repoRoot}/.env` when DATABASE_URL
 * is not already set (stdlib only, zero dependencies).
 */
import { loadEnvOnce } from "./load-env.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import { sql } from "drizzle-orm";
import { tenants, users } from "../src/db/schema/identity.js";
import { hashPassword } from "../src/auth/credentials.js";

loadEnvOnce();

const SEED_TENANT_SLUG = "demo";
const SEED_TENANT_NAME = "Learning Platform Demo";
const SEED_USER_EMAIL = "admin@lp.local";
const SEED_USER_PASSWORD = "changeme";
const SEED_USER_NAME = "Super Admin";

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://learning_platform:learning_platform@localhost:5432/learning_platform";
  const pool = new pg.Pool({ connectionString });
  const db = drizzle(pool, { schema: { tenants, users } });

  console.log("Seeding dev tenant…");
  const [tenant] = await db
    .insert(tenants)
    .values({ slug: SEED_TENANT_SLUG, name: SEED_TENANT_NAME })
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  const tenantRow =
    tenant ??
    (await db.select().from(tenants).where(eq(tenants.slug, SEED_TENANT_SLUG)).then((r) => r[0]));

  if (!tenantRow) throw new Error("seed: could not obtain tenant row");

  const passwordHash = await hashPassword(SEED_USER_PASSWORD);
  await db
    .insert(users)
    .values({
      tenantId: tenantRow.id,
      email: SEED_USER_EMAIL,
      displayName: SEED_USER_NAME,
      role: "super_admin",
      passwordHash,
    })
    .onConflictDoNothing({ target: [users.tenantId, users.email] });

  console.log("Done.");
  console.log(`  tenant slug: ${SEED_TENANT_SLUG}`);
  console.log(`  user email:  ${SEED_USER_EMAIL}`);
  console.log(`  password:    ${SEED_USER_PASSWORD}  ← change in production`);

  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

// keep `sql` referenced (avoids unused import warning; reserved for future
// seed that needs raw SQL, e.g. citext).
void sql;
