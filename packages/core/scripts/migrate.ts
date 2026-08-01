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
  const raw =
    process.env.DATABASE_URL ?? "postgres://learning_platform:***@localhost:5432/learning_platform";

  // Railway public proxy (nozomi.proxy.rlwy.net:18242) supports TLS with
  // self-signed / Railway-issued certs. Strip sslmode from the URL (pg v8
  // maps it to verify-full which fails on certs outside system trust store)
  // and pass ssl: { rejectUnauthorized: false } explicitly.
  let connectionString = raw;
  try {
    const u = new URL(raw);
    if (u.searchParams.get("sslmode")) {
      u.searchParams.delete("sslmode");
      connectionString = u.toString();
    }
  } catch {
    // Invalid URL — fall through.
  }

  return {
    connectionString,
    connectionTimeoutMillis: 30_000,
    ssl: { rejectUnauthorized: false },
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