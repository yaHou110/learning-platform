/**
 * Object-storage configuration (ADR-0010 — S3-compatible provider).
 *
 * The prod stack ships MinIO (docker-compose.prod.yml) and already passes
 * `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` /
 * `S3_REGION` to the app. This module reads the same variable names so
 * `apps/web` needs no plumbing: it only has to expose the vars in .env.
 *
 * Config is read lazily at call time (never at module import) so tests and
 * builds that never touch media do not require credentials, and so a deploy
 * can flip credentials without a rebuild.
 */
export interface StorageConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
  forcePathStyle: boolean;
}

export const DEFAULT_MEDIA_URL_TTL_SECONDS = 900; // 15 min
export const MAX_MEDIA_URL_TTL_SECONDS = 3600; // 1 h
export const DEFAULT_UPLOAD_URL_TTL_SECONDS = 600; // 10 min

/** True when S3 credentials + endpoint are present (i.e. storage is usable). */
export function isStorageConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY && env.S3_SECRET_KEY);
}

export function readStorageConfig(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  return {
    endpoint: env.S3_ENDPOINT ?? "",
    accessKey: env.S3_ACCESS_KEY ?? "",
    secretKey: env.S3_SECRET_KEY ?? "",
    bucket: env.S3_BUCKET ?? "learning-platform",
    region: env.S3_REGION ?? "auto",
    forcePathStyle: (env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
  };
}
