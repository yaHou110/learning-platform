/**
 * Media & Content — bounded context API (ADR-0010).
 *
 * Bridges the `media_assets` registry table and object storage (MinIO/S3):
 * - `requestUpload`  — admin reserves a tenant-scoped key + row, gets a
 *   presigned PUT URL, uploads straight to storage (no bytes through us).
 * - `confirmUpload`  — verifies the object actually landed (headObject).
 * - `signedReadUrl`  — short-lived presigned GET URL. THE content-protection
 *   primitive: the caller (route/page) has already proven the user may access
 *   the content (enrolled in the course / admin), and the returned URL expires
 *   in minutes, so it cannot be saved or re-shared.
 *
 * Security model (v1): a key is only signable when it lives under this
 * tenant's `media/<tenantId>/` prefix (see `storage/keys.ts`). Storage being
 * unreachable or unconfigured surfaces as `MediaStorageUnavailableError` so
 * routes can answer 503 instead of 500.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client.js";
import * as schema from "../db/schema/index.js";
import {
  readStorageConfig,
  isStorageConfigured,
  DEFAULT_MEDIA_URL_TTL_SECONDS,
  DEFAULT_UPLOAD_URL_TTL_SECONDS,
} from "../storage/config.js";
import {
  buildMediaKey,
  extFromMime,
  isSafeStorageKey,
  keyBelongsToTenant,
  clampTtl,
} from "../storage/keys.js";
import {
  ensureBucket,
  createPresignedUploadUrl,
  createPresignedReadUrl,
  headObject,
} from "../storage/client.js";

/** Thrown when object storage is unconfigured or unreachable. → 503. */
export class MediaStorageUnavailableError extends Error {
  constructor(message = "Object storage is not configured or unreachable") {
    super(message);
    this.name = "MediaStorageUnavailableError";
  }
}

export type MediaAsset = schema.MediaAsset;

export const media = {
  /** True when S3 env vars are present (fast path for UI affordances). */
  isConfigured(): boolean {
    return isStorageConfigured();
  },

  /**
   * Reserve a media_assets row and return a presigned PUT URL. The caller
   * uploads the bytes directly to storage; nothing passes through the server.
   * Throws `MediaStorageUnavailableError` when storage is not configured.
   */
  async requestUpload(
    tenantId: string,
    uploadedBy: string,
    input: {
      mimeType: string;
      sizeBytes: number;
      ext?: string | undefined;
    }
  ): Promise<{
    mediaId: string;
    storageKey: string;
    uploadUrl: string;
    expiresInSeconds: number;
  }> {
    if (!isStorageConfigured()) throw new MediaStorageUnavailableError();
    const config = readStorageConfig();
    const storageKey = buildMediaKey(
      tenantId,
      input.ext ?? extFromMime(input.mimeType)
    );
    const db = getDb();
    const [row] = await db
      .insert(schema.mediaAssets)
      .values({
        tenantId,
        storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        uploadedBy,
      })
      .returning();
    if (!row) throw new Error("media.requestUpload: no row returned");

    await ensureBucket(config);
    const uploadUrl = await createPresignedUploadUrl(config, {
      key: storageKey,
      contentType: input.mimeType,
      expiresInSeconds: DEFAULT_UPLOAD_URL_TTL_SECONDS,
    });
    return {
      mediaId: row.id,
      storageKey,
      uploadUrl,
      expiresInSeconds: DEFAULT_UPLOAD_URL_TTL_SECONDS,
    };
  },

  /**
   * Verify the object referenced by a media row exists. Returns the row on
   * success, null when the row is missing, throws when storage is down.
   */
  async confirmUpload(
    tenantId: string,
    mediaId: string
  ): Promise<MediaAsset | null> {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.mediaAssets)
      .where(
        and(eq(schema.mediaAssets.tenantId, tenantId), eq(schema.mediaAssets.id, mediaId))
      )
      .limit(1);
    if (!row) return null;
    if (!isStorageConfigured()) throw new MediaStorageUnavailableError();
    const exists = await headObject(readStorageConfig(), row.storageKey);
    return exists ? row : null;
  },

  /**
   * Short-lived presigned GET URL for a tenant-scoped key. The caller must
   * already have authorized the user (enrollment/admin) — this function only
   * checks that the key belongs to the tenant and is well-formed.
   *
   * Returns null for an unsafe/foreign key (never throws for user input);
   * throws `MediaStorageUnavailableError` when storage is not configured.
   */
  async signedReadUrl(
    tenantId: string,
    storageKey: string,
    opts: { expiresInSeconds?: number | undefined } = {}
  ): Promise<{ url: string; expiresInSeconds: number } | null> {
    if (!isSafeStorageKey(storageKey) || !keyBelongsToTenant(storageKey, tenantId)) {
      return null;
    }
    if (!isStorageConfigured()) throw new MediaStorageUnavailableError();
    const config = readStorageConfig();
    const expiresInSeconds = clampTtl(
      opts.expiresInSeconds ?? DEFAULT_MEDIA_URL_TTL_SECONDS
    );
    const url = await createPresignedReadUrl(config, {
      key: storageKey,
      expiresInSeconds,
    });
    return { url, expiresInSeconds };
  },
};
