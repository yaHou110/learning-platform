/**
 * Idempotent dev seed.
 *
 * Creates:
 *   - one tenant (`slug=hawza-demo`, name="Hawza Demo Center")
 *   - one super_admin user (`email=admin@hawza.local`, password=`changeme`)
 *
 * Re-running is safe: `ON CONFLICT DO NOTHING`.
 *
 * Usage: `pnpm --filter @hawza/core db:seed:dev`
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import pg from "pg";
import { sql } from "drizzle-orm";
import { tenants, users } from "../src/db/schema/identity.js";
import { hashPassword } from "../src/auth/credentials.js";

config({ path: ".env" });

const SEED_TENANT_SLUG = "hawza-demo";
const SEED_TENANT_NAME = "Hawza Demo Center";
const SEED_USER_EMAIL = "admin@hawza.local";
const SEED_USER_PASSWORD = "changeme";
const SEED_USER_NAME = "Super Admin";

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://hawza:hawza@localhost:5432/hawza";
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
