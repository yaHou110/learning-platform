/**
 * M4.2 — the in-memory token-bucket rate limiter. Pins:
 *   - first call succeeds and starts the bucket at capacity-1
 *   - calls beyond capacity (within the refill window) return 429 + Retry-After
 *   - the bucket refills at the configured rate over time
 *   - distinct keys have independent buckets
 *
 * Pure + deterministic: buckets live in a module-level map which we reset
 * between cases; time is advanced with fake timers for the refill assertions.
 *
 * Note on asserting the 429 body: NextResponse.json stores the JSON as a
 * ReadableStream body (Web Fetch API), so we assert on status + headers
 * rather than JSON.stringify(response.body).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { rateLimit, __resetRateLimitStoreForTests } = await import(
  "../src/lib/rate-limit.js"
);

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

beforeEach(() => {
  __resetRateLimitStoreForTests();
  vi.setSystemTime(0);
});

describe("rateLimit (M4.2)", () => {
  it("allows up to capacity and then denies with 429 + Retry-After", () => {
    const capacity = 3;
    const results: boolean[] = [];
    for (let i = 0; i < capacity; i++) {
      results.push(
        rateLimit({ key: "k", capacity, refillPerSec: 1 }).ok
      );
    }
    expect(results).toEqual([true, true, true]);

    const denied = rateLimit({ key: "k", capacity, refillPerSec: 1 });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.response.status).toBe(429);
      expect(denied.response.headers.get("Retry-After")).toBeTruthy();
      // content-type confirms it is a JSON error response
      expect(denied.response.headers.get("content-type")).toContain(
        "application/json"
      );
    }
  });

  it("refills at the configured rate", () => {
    // capacity 2: spend both, advance time, spend again without 429.
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(true);
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(true);
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(false);

    // 1 second at 1 token/sec restores exactly 1 token.
    vi.advanceTimersByTime(1000);
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(true);

    // Advance enough to fully refill (cap at capacity) + 1 more sustained.
    vi.advanceTimersByTime(4000);
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(true);
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(true);
    expect(
      rateLimit({ key: "refill", capacity: 2, refillPerSec: 1 }).ok
    ).toBe(false);
  });

  it("keeps buckets independent per key", () => {
    expect(
      rateLimit({ key: "a", capacity: 1, refillPerSec: 1 }).ok
    ).toBe(true);
    // key "a" is now empty; key "b" is untouched.
    expect(
      rateLimit({ key: "a", capacity: 1, refillPerSec: 1 }).ok
    ).toBe(false);
    expect(
      rateLimit({ key: "b", capacity: 1, refillPerSec: 1 }).ok
    ).toBe(true);
  });

  it("rejects a non-positive refill rate", () => {
    expect(() =>
      rateLimit({ key: "x", capacity: 1, refillPerSec: 0 })
    ).toThrow();
  });
});
