/**
 * Diagnostic script — run in CI to identify the REAL connection issue.
 * Plain Node.js (no TS, no tsx loader), works anywhere.
 */
const pg = require("pg");

async function attempt(label, poolOpts) {
  console.log(`\n--- ${label} ---`);
  console.log(`Config: ${JSON.stringify(poolOpts)}`);
  try {
    const pool = new pg.Pool({ connectionTimeoutMillis: 15_000, ...poolOpts });
    const r = await pool.query("SELECT current_database() AS db, current_user AS user");
    console.log(`SUCCESS — db=${r.rows[0].db}, user=${r.rows[0].user}`);
    await pool.end();
    return true;
  } catch (e) {
    console.error(`FAILED_TYPE: ${e.constructor.name}`);
    console.error(`FAILED_MSG: ${e.message}`);
    console.error(`FAILED_CODE: ${e.code || "(none)"}`);
    console.error(`FAILED_KEYS: ${JSON.stringify(Object.getOwnPropertyNames(e))}`);
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

  // 1. URL parts
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

  // Attempt A: strip sslmode, ssl:false (plain TCP)
  let urlA = raw;
  try {
    const u = new URL(raw);
    u.searchParams.delete("sslmode");
    u.searchParams.delete("uselibpqcompat");
    urlA = u.toString();
  } catch {}
  if (await attempt("A: sslmode stripped + ssl:false", {
    connectionString: urlA,
    ssl: false,
  })) return;

  // Attempt B: strip sslmode, ssl:{rejectUnauthorized:false}
  if (await attempt("B: sslmode stripped + ssl:{rejectUnauthorized:false}", {
    connectionString: urlA,
    ssl: { rejectUnauthorized: false },
  })) return;

  // Attempt C: strip sslmode, ssl:{rejectUnauthorized:false, checkServerIdentity: ()=>undefined}
  if (await attempt("C: sslmode stripped + ssl:{rejectUnauthorized:false, checkServerIdentity skip}", {
    connectionString: urlA,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
  })) return;

  // Attempt D: Keep sslmode=require, uselibpqcompat=true
  let urlD = raw;
  try {
    const u = new URL(raw);
    u.searchParams.set("uselibpqcompat", "true");
    urlD = u.toString();
  } catch {}
  if (await attempt("D: uselibpqcompat=true + sslmode=require (as-is)", {
    connectionString: urlD,
  })) return;

  // Attempt E: raw net.connect (plain TCP, no TLS) to see if Railway accepts
  console.log("\n--- E: raw net.connect (plain TCP, no TLS) ---");
  try {
    const u = new URL(raw);
    const net = require("net");
    const socket = net.connect(
      parseInt(u.port || "5432", 10),
      u.hostname
    );
    const chunks = [];
    socket.on("connect", () => {
      console.log("TCP_CONNECTED");
      // Send PostgreSQL StartupMessage (version 3, no SSL request)
      // Format: length (4) + protocol version (4) = 8 bytes
      // Then parameters: user=postgres\0 + database=railway\0 + \0
      const params = `user\u0000${u.username}\u0000database\u0000${u.pathname.slice(1)}\u0000\u0000`;
      const paramBuf = Buffer.from(params, "utf8");
      const len = 4 + 4 + paramBuf.length;
      const buf = Buffer.alloc(len);
      buf.writeInt32BE(len, 0);       // length
      buf.writeInt32BE(196608, 4);    // protocol version 3.0
      paramBuf.copy(buf, 8);
      socket.write(buf);
    });
    socket.on("data", (data) => {
      console.log(`TCP_DATA (${data.length} bytes): ${data.toString("hex").slice(0, 40)}...`);
      chunks.push(data);
      // Check for error response ('E' = error)
      if (data[0] === 0x45) {
        const msg = data.toString("utf8", 5);
        console.log(`PG_ERROR_RESPONSE: ${msg}`);
      }
      // Check for authentication request ('R')
      if (data[0] === 0x52) {
        const authType = data.readInt32BE(5);
        console.log(`PG_AUTH_REQUEST type: ${authType}`);
      }
      socket.end();
    });
    socket.on("error", (e) => {
      console.error(`TCP_ERROR: ${e.constructor?.name}: ${e.message}`);
      console.error(`TCP_ERROR_CODE: ${e.code || "(none)"}`);
    });
    socket.on("close", () => {
      console.log("TCP_CLOSED");
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (e) {
    console.error(`FAILED_TYPE: ${e.constructor.name}: ${e.message}`);
  }

  // Attempt F: raw tls.connect with checkServerIdentity skip
  console.log("\n--- F: raw tls.connect (TLS, checkServerIdentity skip) ---");
  try {
    const u = new URL(raw);
    const tls = require("tls");
    const socket = tls.connect(
      {
        host: u.hostname,
        port: parseInt(u.port || "5432", 10),
        rejectUnauthorized: false,
        servername: u.hostname,
        checkServerIdentity: () => undefined,
      },
      () => {
        console.log(`TLS_HANDSHAKE_OK`);
        console.log(`TLS_PROTOCOL: ${socket.getProtocol()}`);
        console.log(`TLS_AUTHORIZED: ${socket.authorized}`);
        console.log(`TLS_AUTHORIZATION_ERROR: ${socket.authorizationError || "(none)"}`);
        const cert = socket.getPeerCertificate();
        if (cert) {
          console.log(`TLS_CERT_SUBJECT_CN: ${cert.subject?.CN || "(none)"}`);
          console.log(`TLS_CERT_ISSUER_CN: ${cert.issuer?.CN || "(none)"}`);
        }
        socket.end();
      }
    );
    socket.on("error", (e) => {
      console.error(`TLS_ERROR: ${e.constructor?.name}: ${e.message}`);
      console.error(`TLS_ERROR_CODE: ${e.code || "(none)"}`);
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } catch (e) {
    console.error(`FAILED_TYPE: ${e.constructor.name}: ${e.message}`);
  }

  console.log("\n=== ALL ATTEMPTS FAILED ===");
  process.exit(1);
}

main().catch((e) => {
  console.error("Unexpected:", e);
  process.exit(1);
});