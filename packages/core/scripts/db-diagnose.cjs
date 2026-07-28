/**
 * Diagnostic script — run in CI to identify the REAL connection issue.
 * Plain Node.js (no TS, no tsx loader), works anywhere.
 */
const pg = require("pg");

async function attempt(label, poolOpts) {
  console.log(`\n--- ${label} ---`);
  try {
    const pool = new pg.Pool({ connectionTimeoutMillis: 10_000, ...poolOpts });
    const r = await pool.query("SELECT current_database() AS db, current_user AS user");
    console.log(`SUCCESS — db=${r.rows[0].db}, user=${r.rows[0].user}`);
    await pool.end();
    return true;
  } catch (e) {
    console.error(`FAILED — ${e.constructor.name}: ${e.message}`);
    if (e.cause) console.error(`  cause: ${e.cause.message || e.cause}`);
    if (e.code) console.error(`  code: ${e.code}`);
    return false;
  }
}

async function main() {
  const raw = process.env.DATABASE_URL;
  console.log("=== DB DIAGNOSTIC ===");
  if (!raw) {
    console.error("FATAL: DATABASE_URL not set");
    process.exit(1);
  }

  // 1. URL parts (mask password)
  try {
    const u = new URL(raw);
    console.log(`Host:     ${u.hostname}`);
    console.log(`Port:     ${u.port || "(default 5432)"}`);
    console.log(`DB:       ${u.pathname.slice(1)}`);
    console.log(`User:     ${u.username}`);
    console.log(`Pwd len:  ${u.password ? u.password.length : 0}`);
    console.log(`sslmode:  ${u.searchParams.get("sslmode") || "(unset)"}`);
  } catch (e) {
    console.error(`URL parse error: ${e.message}`);
    process.exit(1);
  }

  // 2. Try three configs
  if (await attempt("Attempt 1: as-is (let pg negotiate)", { connectionString: raw })) return;
  if (await attempt("Attempt 2: ssl={rejectUnauthorized:false}", {
    connectionString: raw,
    ssl: { rejectUnauthorized: false },
  })) return;

  // Attempt 3: strip sslmode from URL
  let url3 = raw;
  try {
    const u = new URL(raw);
    if (u.searchParams.get("sslmode")) {
      u.searchParams.delete("sslmode");
      url3 = u.toString();
    }
  } catch {}
  if (await attempt("Attempt 3: sslmode stripped + rejectUnauthorized:false", {
    connectionString: url3,
    ssl: { rejectUnauthorized: false },
  })) return;

  console.log("\n=== ALL ATTEMPTS FAILED ===");
  process.exit(1);
}

main().catch((e) => {
  console.error("Unexpected:", e);
  process.exit(1);
});
