import pg from "pg";
const pool = new pg.Pool({
  connectionString: "postgresql://postgres:mcdBboluXVXAcvhYdnARNMgMx1niInjs@tokaido.proxy.rlwy.net:53305/railway",
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false },
});
console.log("Connecting...");
const r = await pool.query("SELECT version()");
console.log("Connected! Version:", r.rows[0].version);
const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2");
console.log("Existing tables:", tables.rows.length);
tables.rows.forEach(t => console.log(" -", t.table_schema + "." + t.table_name));
await pool.end();
