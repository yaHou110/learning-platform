/**
 * M5 observability — metrics collector tests.
 *
 * Unit tests for the in-process Prometheus-format collector. The store is
 * module-level, so each case resets it via `__resetMetricsForTests`.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  incCounter,
  observeHistogram,
  describeCounter,
  describeHistogram,
  renderPrometheus,
  uptimeSeconds,
  __resetMetricsForTests,
} from "../src/observability/index.js";

beforeEach(() => {
  __resetMetricsForTests();
});

describe("metrics counters", () => {
  it("increments a counter with label slices", () => {
    describeCounter("http_requests_total", "Total HTTP requests");
    incCounter("http_requests_total", 1, "GET:/api/users:200");
    incCounter("http_requests_total", 1, "GET:/api/users:200");
    incCounter("http_requests_total", 1, "GET:/api/users:500");

    const out = renderPrometheus();
    expect(out).toContain("# HELP http_requests_total Total HTTP requests");
    expect(out).toContain("# TYPE http_requests_total counter");
    // Aggregate value line (no labels) is the total across all slices.
    expect(/^http_requests_total 3$/m.test(out)).toBe(true);
    expect(out).toContain('http_requests_total{label="GET:/api/users:200"} 2');
    expect(out).toContain('http_requests_total{label="GET:/api/users:500"} 1');
  });

  it("increments the aggregate value (no labels)", () => {
    incCounter("plain_counter");
    incCounter("plain_counter", 2);
    expect(renderPrometheus()).toContain("plain_counter 3");
  });
});

describe("metrics histograms", () => {
  it("buckets observations and emits _bucket/_sum/_count", () => {
    describeHistogram("http_request_duration_seconds", "latency", [
      0.01, 0.05, 0.1, 0.5, 1,
    ]);
    observeHistogram("http_request_duration_seconds", 0.005, [
      0.01, 0.05, 0.1, 0.5, 1,
    ]);
    observeHistogram("http_request_duration_seconds", 0.25, [
      0.01, 0.05, 0.1, 0.5, 1,
    ]);
    observeHistogram("http_request_duration_seconds", 2, [
      0.01, 0.05, 0.1, 0.5, 1,
    ]);

    const out = renderPrometheus();
    expect(out).toContain("# TYPE http_request_duration_seconds histogram");
    expect(out).toContain('http_request_duration_seconds_bucket{le="0.01"} 1');
    expect(out).toContain('http_request_duration_seconds_bucket{le="0.5"} 2');
    expect(out).toContain('http_request_duration_seconds_bucket{le="+Inf"} 3');
    expect(out).toContain("http_request_duration_seconds_sum 2.255");
    expect(out).toContain("http_request_duration_seconds_count 3");
  });
});

describe("metrics render", () => {
  it("includes a process uptime gauge", () => {
    expect(renderPrometheus()).toContain(
      "# TYPE process_uptime_seconds gauge"
    );
    expect(uptimeSeconds()).toBeGreaterThanOrEqual(0);
  });

  it("emits names in stable (sorted) order", () => {
    describeCounter("zeta_counter", "z");
    describeCounter("alpha_counter", "a");
    const out = renderPrometheus();
    const zIdx = out.indexOf("zeta_counter");
    const aIdx = out.indexOf("alpha_counter");
    expect(aIdx).toBeLessThan(zIdx);
  });
});
