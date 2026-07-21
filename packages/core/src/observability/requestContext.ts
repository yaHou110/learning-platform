/**
 * Request-context wiring for observability (M5).
 *
 * Helpers that the web layer (route handlers + middleware) use to attach a
 * `requestId` and the resolved `tenantId`/`userId` to every log line and to
 * surface the correlation id back to the caller via response headers.
 *
 * `generateRequestId` uses `crypto.randomUUID()` (Node 20 global) — no extra
 * dependency, no `Math.random` (which would collide under load and ruin
 * log correlation). It is safe to call per-request.
 */
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";
export const RESPONSE_REQUEST_ID_HEADER = "x-request-id";

/** Minimum length we trust for an inbound request id; otherwise mint our own. */
const MIN_REQUEST_ID_LEN = 8;

/**
 * Resolve the request id for a request: honor a propagated inbound id if it
 * looks plausible (so traces follow a request across the reverse proxy and
 * the app), otherwise mint a fresh UUID v4.
 */
export function generateRequestId(inbound?: string | null): string {
  if (inbound && inbound.length >= MIN_REQUEST_ID_LEN && /^[A-Za-z0-9._-]+$/.test(inbound)) {
    return inbound;
  }
  return randomUUID();
}
