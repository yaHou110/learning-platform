/**
 * Structured error capture with correlation ids (M5 observability).
 *
 * v1 does not ship a remote error-tracking backend (Sentry/GlitchTip) —
 * that is a deployment-time operational choice (ADR-0007), not a code one.
 * This module is the single capture point: it logs the error with the
 * request-scoped logger at `error` level, attaches the `requestId`, and
 * returns a stable public error shape that route handlers can serialize
 * without leaking internals. When a backend is wired (M6+), `captureError`
 * is the only call site to extend.
 *
 * PII: the public shape carries `code`, `requestId`, and `message`. The
 * internal log entry additionally carries the error name and a sanitized
 * stack (paths only — no query strings, no email). Raw `error.message` is
 * logged at server level but never returned to the client for 5xx; the
 * public 5xx message is generic ("Internal error") so stack-trace-flavored
 * messages do not bleed out.
 */
import type { Logger } from "pino";
import { getLogger } from "./logger.js";

function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export type PublicError = {
  error: string;
  /** Stable machine code; client switches on this, never on `message`. */
  code: string;
  /** Lets the client correlate a support report to a server log line. */
  requestId: string;
  /** HTTP status to set on the response. */
  status: number;
};

/**
 * Capture an error against the request context and return a safe public
 * shape for the client. Always log first, then derive the public shape.
 */
export function captureError(
  err: unknown,
  ctx: { requestId: string; logger?: Logger } & Record<string, unknown>
): PublicError {
  const log = ctx.logger ?? getLogger();
  const requestId = ctx.requestId;
  const name = err instanceof Error ? err.name : typeof err;
  const message = err instanceof Error ? err.message : String(err);
  const status = deriveStatus(err);
  const code = deriveCode(err, status);

  // Sanitize stack: keep only file/line/path entries, drop anything that
  // looks like a URL with a query (may carry tokens) — defense in depth.
  const rawStack = err instanceof Error ? err.stack ?? null : null;
  const safeStack = sanitizeStack(rawStack);

  log.error(
    {
      requestId,
      errName: name,
      errMessage: message,
      status,
      code,
      stack: safeStack,
      // Extra context the caller may pass (route, method, tenantId, userId).
      ...omit(ctx, ["requestId"]),
      // Never let the caller override these reserved keys by accident.
      logger: undefined,
    },
    "captured_error"
  );

  return {
    error: status >= 500 ? "Internal error" : message,
    code,
    requestId,
    status,
  };
}

function deriveStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status: unknown }).status;
    if (typeof s === "number" && s >= 400 && s < 600) return s;
  }
  return 500;
}

function deriveCode(err: unknown, status: number): string {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code: unknown }).code;
    if (typeof c === "string" && c) return c;
  }
  return status >= 500 ? "INTERNAL" : "BAD_REQUEST";
}

/** Strip query strings from stack frames — keeps paths, drops secrets. */
function sanitizeStack(stack: string | null): string | null {
  if (!stack) return null;
  return stack
    .replace(/\?.+$/gm, "") // drop ?query on any frame line
    .replace(/\s+/g, " ")
    .trim();
}
