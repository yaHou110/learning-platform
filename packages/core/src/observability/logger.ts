/**
 * Structured JSON logging (M5 observability).
 *
 * A singleton `pino` logger writes one JSON object per line to stdout. In
 * development the transport is left as the default (JSON) so log lines stay
 * machine-parseable end to end; a pretty sink is intentionally not added as
 * a runtime dependency to keep the prod bundle the same shape as dev (v1
 * ships on a single 4 GB VPS per ARCHITECTURE_CONSTRAINTS C1 — no extra
 * moving parts).
 *
 * Request-scoped context (requestId, tenantId, userId, route, method) is
 * threaded through child loggers produced by `logger.child(...)`. Route
 * handlers obtain a child via `withRequestLogger` (see `requestContext.ts`),
 * which mirrors the Auth.js token + the rate-limit ip-key patterns already
 * in the web app.
 *
 * PII policy: log fields are metadata only. Never log email, password,
 * passwordHash, or the raw session token. The redaction list below is a
 * belt-and-suspenders guard — even if a caller accidentally passes a
 * sensitive field, pino replaces the value with `[Redacted]`.
 */
import pino, { type Logger, type LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";

/** Fields pino will mask before serializing. Add as new sensitive fields appear. */
const REDACT_PATHS = [
  "password",
  "passwordHash",
  "token",
  "authjs.session-token",
  "AUTH_SECRET",
  "DATABASE_URL",
  "session",
  "accessToken",
  "cookie",
  "cookies.*",
  "headers.authorization",
  "headers.cookie",
];

const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: REDACT_PATHS,
    censor: "[Redacted]",
  },
  // Stable keys order + ISO time so logs are greppable across instances.
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: "learning-platform",
    // Node env + a deploy commit can be added later via env when M6 lands.
    env: process.env.NODE_ENV ?? "development",
  },
};

/**
 * Process-wide logger. Lazily created so importing this module never fails
 * in environments without a real stdout (e.g. some test runners).
 */
let _logger: Logger | null = null;

export function getLogger(): Logger {
  if (_logger) return _logger;
  _logger = pino(baseOptions);
  return _logger;
}

/**
 * Per-request child logger. Anything logged through it carries the request
 * context automatically, so a single log line is enough to reconstruct the
 * `who/where/what`.
 */
export type RequestContext = {
  requestId: string;
  method?: string;
  route?: string;
  tenantId?: string;
  userId?: string;
};

export function requestLogger(ctx: RequestContext): Logger {
  return getLogger().child({
    requestId: ctx.requestId,
    method: ctx.method,
    route: ctx.route,
    tenantId: ctx.tenantId,
    userId: ctx.userId,
  });
}

/** Test-only: drop the cached logger so a test can reconfigure level/output. */
export function __resetLoggerForTests(): void {
  _logger = null;
}

export type { Logger } from "pino";
