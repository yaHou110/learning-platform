/**
 * Observability public entry point for `@learning-platform/core`.
 *
 * Exported at `@learning-platform/core/observability`. Plugins and `apps/web`
 * import the logger, metrics, and error-capture helpers from here. They
 * MUST NOT reach into `pino` directly — funneling through this barrel keeps
 * redaction policy and timestamp format in one place (per logger.ts).
 */
export {
  getLogger,
  requestLogger,
  __resetLoggerForTests,
  type Logger,
  type RequestContext,
} from "./logger.js";

export {
  generateRequestId,
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
} from "./requestContext.js";

export {
  incCounter,
  describeCounter,
  observeHistogram,
  describeHistogram,
  renderPrometheus,
  uptimeSeconds,
  __resetMetricsForTests,
  type Counter,
  type Histogram,
  type Metric,
  type MetricKind,
} from "./metrics.js";

export { captureError, type PublicError } from "./errors.js";
