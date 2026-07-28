/**
 * Diagnostic script — run in CI to identify the REAL connection issue.
 * Plain Node.js (no TS, no tsx loader), works anywhere.
 */
const pg = require("pg");

async function attempt(label, poolOpts) {
  console.log(`\n--- ${label} ---`);
  console.log(`Config: ${JSON.stringify(poolOpts)}`);
  try {
    const pool = new pg.Pool({ connectionTimeoutMillis: 10_000, ...poolOpts });
    const r = await pool.query("SELECT current_database() AS db, current_user AS user");
    console.log(`SUCCESS — db=${r.rows[0].db}, user=${r.rows[0].user}`);
    await pool.end();
    return true;
  } catch (e) {
    console.error(`FAILED_TYPE: ${e.constructor.name}`);
    console.error(`FAILED_MSG: ${e.message}`);
    console.error(`FAILED_CODE: ${e.code || "(none)"}`);
    console.error(`FAILED_KEYS: ${JSON.stringify(Object.getOwnPropertyNames(e))}`);
    // Print first 8 stack lines individually (avoids GitHub truncation)
    const stackLines = (e.stack || "").split("\n").slice(0, 8);
    stackLines.forEach((line, i) => console.error(`STACK_${i}: ${line.trim()}`));
    if (e.cause) {
      console.error(`CAUSE_TYPE: ${e.cause.constructor?.name}`);
      console.error(`CAUSE_MSG: ${e.cause.message || String(e.cause)}`);
      console.error(`CAUSE_CODE: ${e.cause.code || "(none)"}`);
      const causeStackLines = (e.cause.stack || "").split("\n").slice(0, 12);
      causeStackLines.forEach((line, i) => console.error(`CAUSE_STACK_${i}: ${line.trim()}`));
    }
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

  // Attempt 4: uselibpqcompat=true + sslmode=require (libpq semantics)
  let url4 = raw;
  try {
    const u = new URL(raw);
    u.searchParams.set("uselibpqcompat", "true");
    if (!u.searchParams.get("sslmode")) u.searchParams.set("sslmode", "require");
    url4 = u.toString();
  } catch {}
  if (await attempt("Attempt 4: uselibpqcompat=true + sslmode=require", {
    connectionString: url4,
  })) return;

  // Attempt 5: sslmode=prefer (no cert check)
  let url5 = raw;
  try {
    const u = new URL(raw);
    u.searchParams.set("sslmode", "prefer");
    url5 = u.toString();
  } catch {}
  if (await attempt("Attempt 5: sslmode=prefer", {
    connectionString: url5,
  })) return;

  // Attempt 6: sslmode=no-verify (pg v9 will support, but try anyway)
  let url6 = raw;
  try {
    const u = new URL(raw);
    u.searchParams.set("sslmode", "no-verify");
    url6 = u.toString();
  } catch {}
  if (await attempt("Attempt 6: sslmode=no-verify", {
    connectionString: url6,
    ssl: { rejectUnauthorized: false },
  })) return;

  // Attempt 7: ssl:true (raw TLS, no cert verification by node-postgres)
  if (await attempt("Attempt 7: ssl:true (raw TLS, no verification)", {
    connectionString: raw,
    ssl: true,
  })) return;

  console.log("\n=== ALL ATTEMPTS FAILED ===");
  process.exit(1);
}

main().catch((e) => {
  console.error("Unexpected:", e);
  process.exit(1);
});
