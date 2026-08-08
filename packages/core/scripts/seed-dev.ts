/**
 * Idempotent dev seed.
 *
 * Creates:
 *   - one tenant (numeric `slug=1001`, name="مرکز فرهنگی تربیتی رویش")
 *   - one super_admin user (`email=admin@lp.local`, national ID `1234567891`,
 *     phone `09123456789`, password=`changeme`)
 *
 * Re-running is safe: `ON CONFLICT DO NOTHING` / `DO UPDATE` for the demo
 * user (so re-seeding keeps the demo national ID + phone in sync).
 *
 * Usage: `pnpm --filter @learning-platform/core db:seed:dev`
 *
 * Env loading: `loadEnvOnce()` reads `${repoRoot}/.env` when DATABASE_URL
 * is not already set (stdlib only, zero dependencies).
 */
import { loadEnvOnce } from "./load-env.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import pg from "pg";
import { tenants, users } from "../src/db/schema/identity.js";
import { courses, lessons } from "../src/db/schema/index.js";
import { hashPassword } from "../src/auth/credentials.js";

loadEnvOnce();

// Center identifiers are numeric (product decision).
const SEED_TENANT_SLUG = "1001";
const SEED_TENANT_NAME = "مرکز فرهنگی تربیتی رویش";
const SEED_USER_EMAIL = "admin@lp.local";
const SEED_USER_NATIONAL_ID = "1234567891"; // 10 digits, passes the national-ID check digit
const SEED_USER_PHONE = "09123456789"; // 11-digit Iranian mobile — SMS channel for password reset
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
      nationalId: SEED_USER_NATIONAL_ID,
      phone: SEED_USER_PHONE,
      displayName: SEED_USER_NAME,
      role: "super_admin",
      passwordHash,
    })
    .onConflictDoUpdate({
      target: [users.tenantId, users.email],
      set: { nationalId: SEED_USER_NATIONAL_ID, phone: SEED_USER_PHONE },
    });

  // Demo catalog: one published course with 5 lessons (M3 DoD: "یک دوره
  // واقعی با ۵ درس"). Idempotent — keyed on (tenant, title).
  const DEMO_COURSE_TITLE = "دوره مقدماتی فقه (دمو)";
  const demoLessons = [
    { title: "درس ۱ — مقدمه و تاریخچه", contentType: "text" as const },
    { title: "درس ۲ — طهارت", contentType: "text" as const },
    { title: "درس ۳ — نماز", contentType: "text" as const },
    { title: "درس ۴ — روزه", contentType: "video" as const },
    { title: "درس ۵ — خمس و زکات", contentType: "text" as const },
  ];

  const existingDemo = await db
    .select()
    .from(courses)
    .where(
      sql`${courses.tenantId} = ${tenantRow.id} and ${courses.title} = ${DEMO_COURSE_TITLE}`
    )
    .then((r) => r[0]);

  const courseRow =
    existingDemo ??
    (await db
      .insert(courses)
      .values({
        tenantId: tenantRow.id,
        title: DEMO_COURSE_TITLE,
        description:
          "دوره مقدماتی آشنایی با مباحث فقه، آماده‌شده برای اولین مرکز نمونه.",
        status: "published",
      })
      .returning()
      .then((r) => r[0]));

  if (courseRow) {
    const existing = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.courseId, courseRow.id));
    if (existing.length === 0) {
      await db.insert(lessons).values(
        demoLessons.map((l, i) => ({
          tenantId: tenantRow.id,
          courseId: courseRow.id,
          title: l.title,
          contentType: l.contentType,
          orderIndex: i,
        }))
      );
    }
  }

  console.log("Done.");
  console.log(`  tenant slug: ${SEED_TENANT_SLUG}`);
  console.log(`  user email:  ${SEED_USER_EMAIL}`);
  console.log(`  user national ID: ${SEED_USER_NATIONAL_ID}`);
  console.log(`  user phone:  ${SEED_USER_PHONE}`);
  console.log(`  password:    ${SEED_USER_PASSWORD}  ← change in production`);
  console.log(`  demo course: ${DEMO_COURSE_TITLE} (published, ${demoLessons.length} lessons)`);

  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

// keep `sql` referenced (avoids unused import warning; reserved for future
// seed that needs raw SQL, e.g. citext).
void sql;
