/**
 * Diagnostic script — run in CI to identify the REAL connection issue.
 * No code changes, no hypothesis. Just evidence.
 */
import pg from "pg";

async function diagnose() {
  const url = process.env.DATABASE_URL;
  console.log("=== DIAGNOSTIC ===");

  // 1. URL exists?
  if (!url) {
    console.error("FATAL: DATABASE_URL is not set");
    process.exit(1);
  }

  // 2. Parse URL (show parts, mask password)
  try {
    const u = new URL(url);
    console.log(`Host: ${u.hostname}`);
    console.log(`Port: ${u.port}`);
    console.log(`Database: ${u.pathname.slice(1)}`);
    console.log(`User: ${u.username}`);
    console.log(`Password: ${u.password ? "(set, " + u.password.length + " chars)" : "(empty)"}`);
    console.log(`sslmode: ${u.searchParams.get("sslmode") ?? "(not set)"}`);
  } catch (e) {
    console.error(`URL parse error: ${e}`);
    process.exit(1);
  }

  // 3. Try to connect — print FULL error
  console.log("\n--- Attempt 1: Default pool config ---");
  try {
    const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 10_000 });
    const result = await pool.query("SELECT current_database(), current_user, version()");
    console.log("SUCCESS!");
    console.log(`Database: ${result.rows[0].current_database}`);
    console.log(`User: ${result.rows[0].current_user}`);
    console.log(`Version: ${result.rows[0].version}`);
    await pool.end();
    return;
  } catch (e: any) {
    console.error(`Error type: ${e.constructor.name}`);
    console.error(`Message: ${e.message}`);
    if (e.cause) console.error(`Cause: ${e.cause.message ?? e.cause}`);
    if (e.code) console.error(`Code: ${e.code}`);
  }

  // 4. Try with explicit SSL options
  console.log("\n--- Attempt 2: ssl: { rejectUnauthorized: false } ---");
  try {
    const pool = new pg.Pool({
      connectionString: url,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
    const result = await pool.query("SELECT current_database()");
    console.log("SUCCESS!");
    console.log(`Database: ${result.rows[0].current_database}`);
    await pool.end();
    return;
  } catch (e: any) {
    console.error(`Error type: ${e.constructor.name}`);
    console.error(`Message: ${e.message}`);
    if (e.cause) console.error(`Cause: ${e.cause.message ?? e.cause}`);
    if (e.code) console.error(`Code: ${e.code}`);
  }

  // 5. Try with sslmode=disable in URL
  console.log("\n--- Attempt 3: sslmode=disable in URL ---");
  try {
    const u = new URL(url);
    u.searchParams.set("sslmode", "disable");
    const pool = new pg.Pool({
      connectionString: u.toString(),
      connectionTimeoutMillis: 10_000,
    });
    const result = await pool.query("SELECT current_database()");
    console.log("SUCCESS!");
    console.log(`Database: ${result.rows[0].current_database}`);
    await pool.end();
    return;
  } catch (e: any) {
    console.error(`Error type: ${e.constructor.name}`);
    console.error(`Message: ${e.message}`);
    if (e.cause) console.error(`Cause: ${e.cause.message ?? e.cause}`);
    if (e.code) console.error(`Code: ${e.code}`);
  }

  console.log("\n=== ALL ATTEMPTS FAILED ===");
  process.exit(1);
}

diagnose();
