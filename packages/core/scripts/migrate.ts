/**
 * Apply pending Drizzle migrations to the database.
 *
 * Usage: `pnpm --filter @learning-platform/core db:migrate`
 *
 * This script is idempotent. It uses Drizzle's `migrate` helper which
 * tracks applied migrations in the `__drizzle_migrations` table.
 *
 * Env loading: `loadEnvOnce()` reads `${repoRoot}/.env` when DATABASE_URL
 * is not already set (stdlib only, zero dependencies). Explicit
 * `DATABASE_URL=…` and Node's `--env-file` both take precedence.
 */
import { loadEnvOnce } from "./load-env.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

loadEnvOnce();

function buildPoolOptions(): pg.PoolConfig {
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://learning_platform:***@localhost:5432/learning_platform";

  // Parse URL to detect sslmode and SSL requirements.
  let needsSsl = false;
  try {
    const u = new URL(connectionString);
    const sslmode = u.searchParams.get("sslmode");
    needsSsl = sslmode !== null && sslmode !== "disable";
  } catch {
    // Invalid URL — fall through to default (no SSL).
  }

  return {
    connectionString,
    connectionTimeoutMillis: 15_000,
    ssl: needsSsl ? true : undefined,
  };
}

async function main(): Promise<void> {
  const pool = new pg.Pool(buildPoolOptions());
  const db = drizzle(pool);
  console.log("Applying migrations…");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations applied.");
  await pool.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
