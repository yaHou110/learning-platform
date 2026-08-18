/**
 * S3-compatible client wrapper (MinIO in dev/prod, any S3 provider elsewhere).
 *
 * Uses AWS SDK v3. Presigning is a pure local HMAC computation — no network —
 * so `createPresignedReadUrl` / `createPresignedUploadUrl` work with any
 * credentials and are unit-testable. `ensureBucket` / `headObject` touch the
 * network and are guarded by callers (storage unavailable ⇒ 503, never 500).
 *
 * The client is created lazily per call so config changes (tests, hot reloads)
 * never require a module-level singleton reset, and so importing this module
 * has no side effects.
 */
import {
  CreateBucketCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import type { StorageConfig } from "./config.js";

function buildClient(config: StorageConfig): S3Client {
  const clientConfig: S3ClientConfig = {
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  };
  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
  }
  return new S3Client(clientConfig);
}

/** Ensure the bucket exists. No-op when it already exists (concurrent-safe). */
export async function ensureBucket(config: StorageConfig): Promise<void> {
  const client = buildClient(config);
  try {
    await client.send(
      new CreateBucketCommand({ Bucket: config.bucket })
    );
  } catch (err) {
    const code =
      (err as { name?: string; Code?: string })?.Code ??
      (err as { name?: string })?.name ??
      "";
    // Both spellings appear depending on the S3 implementation.
    if (code === "BucketAlreadyOwnedByYou" || code === "BucketAlreadyExists") return;
    throw err;
  }
}

/** Presigned PUT URL — direct-to-storage upload without streaming through us. */
export async function createPresignedUploadUrl(
  config: StorageConfig,
  opts: { key: string; contentType: string; expiresInSeconds: number }
): Promise<string> {
  const client = buildClient(config);
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
    }),
    { expiresIn: opts.expiresInSeconds }
  );
}

/** Presigned GET URL — short-lived, enrollment-gated by the caller. */
export async function createPresignedReadUrl(
  config: StorageConfig,
  opts: { key: string; expiresInSeconds: number }
): Promise<string> {
  const client = buildClient(config);
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: opts.key,
    }),
    { expiresIn: opts.expiresInSeconds }
  );
}

/**
 * Reachability probe: true when the endpoint + credentials resolve and the
 * bucket exists. Used by `/api/health` — a network call, unlike presigning.
 */
export async function pingStorage(config: StorageConfig): Promise<boolean> {
  const client = buildClient(config);
  try {
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    return true;
  } catch {
    return false;
  }
}

/** True when the object exists. Used to confirm an upload actually landed. */
export async function headObject(
  config: StorageConfig,
  key: string
): Promise<boolean> {
  const client = buildClient(config);
  try {
    await client.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
    return true;
  } catch (err) {
    const code =
      (err as { name?: string; Code?: string })?.Code ??
      (err as { name?: string })?.name ??
      "";
    if (code === "NotFound" || code === "NoSuchKey" || code === "404") return false;
    throw err;
  }
}
