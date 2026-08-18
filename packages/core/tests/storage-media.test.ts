/**
 * ADR-0010 — object storage primitives.
 *
 * Key safety and TTL clamping are pure functions; presigning is a local HMAC
 * computation (no network), so both are fully unit-testable with dummy
 * credentials. Network-touching calls (`ensureBucket`, `headObject`) are
 * deliberately not exercised here.
 */
import { describe, expect, it } from "vitest";
import {
  buildMediaKey,
  clampTtl,
  extFromMime,
  isSafeStorageKey,
  keyBelongsToTenant,
  MEDIA_KEY_PREFIX,
  DEFAULT_MEDIA_URL_TTL_SECONDS,
  MAX_MEDIA_URL_TTL_SECONDS,
} from "../src/storage/index.js";
import {
  createPresignedReadUrl,
  createPresignedUploadUrl,
} from "../src/storage/client.js";
import type { StorageConfig } from "../src/storage/config.js";

const TEST_CONFIG: StorageConfig = {
  endpoint: "http://127.0.0.1:9000",
  accessKey: "test-access-key",
  secretKey: "test-secret-key",
  bucket: "learning-platform",
  region: "auto",
  forcePathStyle: true,
};

const TENANT = "11111111-1111-4111-8111-111111111111";

describe("storage.extFromMime", () => {
  it("maps common lesson MIME types", () => {
    expect(extFromMime("video/mp4")).toBe("mp4");
    expect(extFromMime("application/pdf")).toBe("pdf");
    expect(extFromMime("audio/mpeg")).toBe("mp3");
    expect(extFromMime("text/plain")).toBe("txt");
  });

  it("falls back to bin for unknown types", () => {
    expect(extFromMime("application/x-unknown")).toBe("bin");
  });

  it("is case-insensitive", () => {
    expect(extFromMime("VIDEO/MP4")).toBe("mp4");
  });
});

describe("storage.buildMediaKey", () => {
  it("produces tenant-scoped keys with an extension", () => {
    const key = buildMediaKey(TENANT, "mp4");
    expect(key.startsWith(`${MEDIA_KEY_PREFIX}${TENANT}/`)).toBe(true);
    expect(key.endsWith(".mp4")).toBe(true);
    expect(keyBelongsToTenant(key, TENANT)).toBe(true);
  });

  it("sanitizes the extension", () => {
    const key = buildMediaKey(TENANT, "../evil.sh");
    expect(key.endsWith(".evilsh")).toBe(true);
    expect(key.includes("..")).toBe(false);
    expect(isSafeStorageKey(key)).toBe(true);
  });

  it("generates unique keys", () => {
    expect(buildMediaKey(TENANT, "mp4")).not.toBe(buildMediaKey(TENANT, "mp4"));
  });
});

describe("storage.isSafeStorageKey", () => {
  it("accepts a normal tenant-scoped key", () => {
    expect(isSafeStorageKey(`${MEDIA_KEY_PREFIX}${TENANT}/abc123.mp4`)).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isSafeStorageKey("../secret.txt")).toBe(false);
    expect(isSafeStorageKey("media/../x.mp4")).toBe(false);
    expect(isSafeStorageKey("a/../../b")).toBe(false);
    expect(isSafeStorageKey("/etc/passwd")).toBe(false);
  });

  it("rejects empty, whitespace, and control characters", () => {
    expect(isSafeStorageKey("")).toBe(false);
    expect(isSafeStorageKey("   ")).toBe(false);
    expect(isSafeStorageKey("a b.mp4")).toBe(false);
    expect(isSafeStorageKey("a\nb")).toBe(false);
    expect(isSafeStorageKey("a\tb")).toBe(false);
  });

  it("rejects backslashes and oversized keys", () => {
    expect(isSafeStorageKey("a\\b")).toBe(false);
    expect(isSafeStorageKey("x".repeat(501))).toBe(false);
  });
});

describe("storage.keyBelongsToTenant", () => {
  it("only allows the owning tenant's prefix", () => {
    expect(keyBelongsToTenant(`${MEDIA_KEY_PREFIX}${TENANT}/a.mp4`, TENANT)).toBe(true);
    const other = "22222222-2222-4222-8222-222222222222";
    expect(keyBelongsToTenant(`${MEDIA_KEY_PREFIX}${other}/a.mp4`, TENANT)).toBe(false);
    expect(keyBelongsToTenant("lessons/a.mp4", TENANT)).toBe(false);
    // Prefix trick: a tenant id that merely starts with ours must not match.
    expect(keyBelongsToTenant(`${MEDIA_KEY_PREFIX}${TENANT}evil/a.mp4`, TENANT)).toBe(false);
  });
});

describe("storage.clampTtl", () => {
  it("defaults when absent or non-finite", () => {
    expect(clampTtl(undefined)).toBe(DEFAULT_MEDIA_URL_TTL_SECONDS);
    expect(clampTtl(Number.NaN)).toBe(DEFAULT_MEDIA_URL_TTL_SECONDS);
    expect(clampTtl(Number.POSITIVE_INFINITY)).toBe(DEFAULT_MEDIA_URL_TTL_SECONDS);
  });

  it("clamps into the allowed window", () => {
    expect(clampTtl(1)).toBe(60);
    expect(clampTtl(999999)).toBe(MAX_MEDIA_URL_TTL_SECONDS);
    expect(clampTtl(120)).toBe(120);
  });
});

describe("storage presign (local HMAC, no network)", () => {
  it("presigned read URLs carry the bucket, key, and an expiry", async () => {
    const url = await createPresignedReadUrl(TEST_CONFIG, {
      key: `${MEDIA_KEY_PREFIX}${TENANT}/lesson.mp4`,
      expiresInSeconds: 900,
    });
    expect(url).toContain("learning-platform");
    expect(url).toContain("lesson.mp4");
    expect(url).toContain("X-Amz-Expires=900");
    expect(url).toContain("X-Amz-Signature=");
    expect(url).not.toContain(TEST_CONFIG.secretKey);
  });

  it("presigned upload URLs target a PUT with an expiry", async () => {
    const url = await createPresignedUploadUrl(TEST_CONFIG, {
      key: `${MEDIA_KEY_PREFIX}${TENANT}/upload.mp4`,
      contentType: "video/mp4",
      expiresInSeconds: 600,
    });
    expect(url).toContain("upload.mp4");
    expect(url).toContain("X-Amz-Expires=600");
    // x-id=PutObject is the SDK's command marker — confirms a PUT, not GET.
    expect(url).toContain("x-id=PutObject");
    // Credentials never leak into the signed URL.
    expect(url).not.toContain(TEST_CONFIG.secretKey);
  });
});
