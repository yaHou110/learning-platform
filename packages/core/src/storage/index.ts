/**
 * Object storage — public surface.
 *
 * `apps/web` should prefer the higher-level `media` API in `src/api/media.ts`
 * (tenant scoping + DB registry). This module is the low-level S3 wrapper plus
 * the pure key helpers.
 */
export {
  isStorageConfigured,
  readStorageConfig,
  DEFAULT_MEDIA_URL_TTL_SECONDS,
  MAX_MEDIA_URL_TTL_SECONDS,
  DEFAULT_UPLOAD_URL_TTL_SECONDS,
} from "./config.js";
export type { StorageConfig } from "./config.js";
export {
  buildMediaKey,
  extFromMime,
  isSafeStorageKey,
  keyBelongsToTenant,
  clampTtl,
  MEDIA_KEY_PREFIX,
} from "./keys.js";
export {
  ensureBucket,
  createPresignedUploadUrl,
  createPresignedReadUrl,
  headObject,
  pingStorage,
} from "./client.js";
