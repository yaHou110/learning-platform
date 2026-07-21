/**
 * Pooled Postgres client + Drizzle wrapper.
 *
 * Uses a singleton connection pool (max 10). All queries go through the pool.
 * Tenant isolation is enforced at the application layer via WHERE clauses
 * rather than per-connection RLS in v1. The RLS policies in the migration
 * remain as defense-in-depth for future use with a transaction wrapper.
 *
 * See ADR-0004 for the multi-tenant design.
 */
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function pool(): pg.Pool {
  if (_pool) return _pool;
  const connectionString =
    process.env.DATABASE_URL ?? "postgres://learning_platform:learning_platform@localhost:5432/learning_platform";
  _pool = new Pool({ connectionString, max: 10 });
  // Close the pool once on process exit so connections are not leaked on
  // graceful shutdown (SIGTERM from PM2/systemd in production) or during the
  // Next.js dev server's hot self-restart. Idempotent: a no-op if already
  // closed. Imported lazily so this module stays import-side-effect-free in
  // test contexts that never start the server.
  const close = async () => {
    if (!_pool) return;
    await _pool.end();
    _pool = null;
  };
  process.once("SIGTERM", () => void close().finally(() => process.exit(0)));
  process.once("SIGINT", () => void close().finally(() => process.exit(0)));
  return _pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  return drizzle(pool(), { schema });
}

/**
 * Run a callback with a tenant-scoped connection (sets app.tenant_id for RLS).
 * The connection is released back to the pool after the callback resolves.
 *
 * @deprecated v1 does not use per-connection RLS. Use `getDb()` + WHERE clauses instead.
 *   This helper is kept for future use when a proper transaction wrapper is needed.
 */
export async function withTenantDb<T>(
  tenantId: string,
  fn: (db: NodePgDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    const db = drizzle(client, { schema });
    return await fn(db);
  } finally {
    client.release();
  }
}

/** Run a `select 1` health check. Returns true if reachable. */
export async function pingDb(): Promise<boolean> {
  const res = await pool().query("select 1 as ok");
  return res.rows[0]?.ok === 1;
}

/** Used by migrate/seed scripts. */
export { pool };
