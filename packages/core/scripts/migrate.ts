/**
 * Apply pending Drizzle migrations to the database.
 *
 * Usage: `pnpm --filter @hawza/core db:migrate`
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

async function main(): Promise<void> {
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://hawza:hawza@localhost:5432/hawza";
  const pool = new pg.Pool({ connectionString });
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
