/**
 * In-process metrics collector (M5 observability).
 *
 * Designed for a single-process deployment (ADR-0007: one dedicated VPS,
 * ARCHITECTURE_CONSTRAINTS C1). Counters and histograms live in module-level
 * `Map`s per process, mirroring the `rate-limit.ts` store shape already in
 * the web app. v1 exports Prometheus text format so a future
 * `prometheus`/`grafana` scrape (M6 deployment) is a config change, not a
 * code change.
 *
 * Trade-offs (recorded in `evidence/M5-observability/notes.md`):
 * - State is per-process and resets on restart — fine for a one-process VPS.
 * - If we ever fan out to multiple Node processes, swap this for a shared
 *   store (Redis / a push gateway); the collector interface stays.
 * - We implement only the metric kinds we actually use: counter and
 *   histogram (with a small fixed bucket set). No registry ceremony.
 *
 * No external metric library: keeping the prod bundle minimal on the 4 GB
 * VPS is worth the ~120 lines here.
 */

export type MetricKind = "counter" | "histogram";

export type Counter = {
  kind: "counter";
  name: string;
  help: string;
  value: number;
  /** Optional label dimension for partitioned counting (e.g. method, status). */
  labels: Map<string, number>;
};

export type Histogram = {
  kind: "histogram";
  name: string;
  help: string;
  buckets: number[]; // upper bounds, including +Inf implicitly via count
  counts: number[]; // per-bucket cumulative count
  sum: number;
  count: number;
};

export type Metric = Counter | Histogram;

/** Standard SLO buckets for HTTP/db latency in v1 (p95 < 500 ms target). */
const LATENCY_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

const registry = new Map<string, Metric>();

function ensureCounter(name: string, help: string): Counter {
  const m = registry.get(name);
  if (m && isCounter(m)) return m;
  if (m) {
    throw new Error(`[metrics] metric "${name}" already registered as ${m.kind}`);
  }
  const c: Counter = { kind: "counter", name, help, value: 0, labels: new Map() };
  registry.set(name, c);
  return c;
}

function ensureHistogram(name: string, help: string, buckets: number[]): Histogram {
  const m = registry.get(name);
  if (m && isHistogram(m)) return m;
  if (m) {
    throw new Error(`[metrics] metric "${name}" already registered as ${m.kind}`);
  }
  const h: Histogram = {
    kind: "histogram",
    name,
    help,
    buckets,
    counts: new Array(buckets.length).fill(0),
    sum: 0,
    count: 0,
  };
  registry.set(name, h);
  return h;
}

/** Increment a counter by `by` (default 1), optionally on a label slice. */
export function incCounter(name: string, by = 1, label?: string): void {
  const c = ensureCounter(name, "");
  c.value += by;
  if (label) c.labels.set(label, (c.labels.get(label) ?? 0) + by);
}

/** Register metadata (help text) for a counter, idempotent. */
export function describeCounter(name: string, help: string): void {
  const c = ensureCounter(name, help);
  if (!c.help) c.help = help;
}

/** Observe a value (seconds) against a histogram. */
export function observeHistogram(name: string, valueSeconds: number, buckets = LATENCY_BUCKETS): void {
  const h = ensureHistogram(name, "", buckets);
  h.sum += valueSeconds;
  h.count += 1;
  for (let i = 0; i < h.buckets.length; i++) {
    if (valueSeconds <= h.buckets[i]!) h.counts[i]! += 1;
  }
}

export function describeHistogram(name: string, help: string, buckets?: number[]): void {
  const h = ensureHistogram(name, help, buckets ?? LATENCY_BUCKETS);
  if (!h.help) h.help = help;
}

/** Uptime in seconds since the module first loaded (process start proxy). */
const START_EPOCH_MS = Date.now();
export function uptimeSeconds(): number {
  return (Date.now() - START_EPOCH_MS) / 1000;
}

/** Render the whole registry as Prometheus text format. */
export function renderPrometheus(): string {
  const lines: string[] = [];
  // Stable ordering for reproducible snapshots.
  const names = [...registry.keys()].sort();
  for (const name of names) {
    const m = registry.get(name)!;
    if (m.kind === "counter") {
      if (m.help) lines.push(`# HELP ${m.name} ${m.help}`);
      lines.push(`# TYPE ${m.name} counter`);
      if (m.labels.size === 0) {
        lines.push(`${m.name} ${m.value}`);
      } else {
        lines.push(`${m.name} ${m.value}`);
        for (const [label, val] of m.labels) {
          lines.push(`${m.name}{label="${label}"} ${val}`);
        }
      }
    } else {
      if (m.help) lines.push(`# HELP ${m.name} ${m.help}`);
      lines.push(`# TYPE ${m.name} histogram`);
      for (let i = 0; i < m.buckets.length; i++) {
        const le = m.buckets[i];
        lines.push(`${m.name}_bucket{le="${le}"} ${m.counts[i]}`);
      }
      lines.push(`${m.name}_bucket{le="+Inf"} ${m.count}`);
      lines.push(`${m.name}_sum ${m.sum}`);
      lines.push(`${m.name}_count ${m.count}`);
    }
  }
  // Uptime gauge — useful for liveness checks reading the metrics endpoint.
  lines.push("# TYPE process_uptime_seconds gauge");
  lines.push(`process_uptime_seconds ${uptimeSeconds()}`);
  return lines.join("\n") + "\n";
}

/** Type guard for Counter. */
function isCounter(m: Metric): m is Counter {
  return m.kind === "counter";
}

/** Type guard for Histogram. */
function isHistogram(m: Metric): m is Histogram {
  return m.kind === "histogram";
}

/** Test-only: clear the registry between cases. */
export function __resetMetricsForTests(): void {
  registry.clear();
}
