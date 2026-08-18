# ADR-0010: Media storage — S3-compatible object storage with signed URLs

- **Status:** Accepted (implemented)
- **Date:** 2026-08-17
- **Deciders:** Founder
- **Supersedes:** — (previously "Proposed", parked until the first media feature)

---

## Context

Courses are made of lessons with `content_type` in `video / audio / pdf / text`
and a free-text `content_ref`, but v1 shipped **no way to actually deliver
content**: the lesson page rendered a placeholder. The schema already has a
`media_assets` registry table, the prod compose file already provisions MinIO,
and the founder's security concern is real: content must not be freely
downloadable or re-shareable — a "cracked" client (or a leaked URL) must not
bypass access control.

Streaming bytes through the Next.js app would waste memory and CPU, and plain
public URLs in an S3 bucket would be copy-paste-able forever. The natural
pattern is **presigned, short-lived URLs**: the server authorizes once (enrolled
/ admin), hands out a URL that expires in minutes, and never sees the bytes.

## Decision

**Adopt S3-compatible object storage (MinIO in dev/prod) with signed URLs as
the sole way media is read and written.**

1. **Write path (admin):** `POST /api/media/upload` reserves a tenant-scoped
   `media_assets` row and returns a presigned PUT URL. The browser uploads the
   bytes **directly to storage** — the app never proxies media payloads.
   Storage keys are `media/<tenantId>/<uuid>.<ext>` and are enforced by pure
   helpers (`isSafeStorageKey`, `keyBelongsToTenant`) — never trusted input.
2. **Read path (enrolled / admin):** signed GET URLs with a **15-minute
   default TTL, hard-capped at 1 hour** (`clampTtl`). Generation happens
   server-side on the lesson page, and via `GET /api/media/url?key=…&courseId=…`
   which re-checks enrollment against the course before signing.
3. **Player rendering:** the lesson page renders `<video>` / `<audio>` /
   `<iframe>` from the signed URL; unenrolled users, missing keys, or a down
   storage cluster degrade to the existing placeholder — never a 500.
4. **Registry:** `media_assets` records every upload (tenant, key, MIME, size,
   uploader) for audit and future lifecycle features (re-upload, expiry sweep).
5. **Library:** AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
   in `@learning-platform/core` — the standard, provider-neutral way to talk to
   S3-compatible stores. Presigning is a pure local HMAC computation, so it is
   unit-testable without a running MinIO.

## Consequences

**Positive**

- Content is protected at the *server*, which is the only place protection
  works: signed URLs expire in minutes and cannot be re-shared; a rebuilt or
  "patched" client still must pass auth + enrollment to fetch anything.
- No media bytes flow through the app — cheap to run, easy to scale (any S3
  provider: MinIO → R2 / S3 / OSS later).
- Storage unconfigured/down is an explicit `503` with a clear message, and the
  lesson page silently falls back to its placeholder.

**Negative / trade-offs**

- Signed URLs expire: a user who leaves a lesson open past the TTL sees a dead
  player until reload (page reload regenerates). Acceptable for v1.
- The browser upload path relies on the presigned PUT working across proxies
  (force path-style for MinIO; `S3_FORCE_PATH_STYLE=true` default).
- One more moving part in prod (MinIO) that must be backed up and monitored —
  already present in `docker-compose.prod.yml`.

## Alternatives considered

- **Stream through Next.js** — simplest, but memory-heavy and couples app
  scaling to media bandwidth. Rejected.
- **Public bucket URLs + per-file tokens** — tokens are re-shareable and
  require a DB lookup per request anyway. Rejected.
- **Cloudinary-style media CDN** — external dependency and cost; no advantage
  for v1 volumes. Parked.
- **Capacitor-native download at enrollment time** — would let a user keep
  files forever; explicitly not wanted for paid content. Rejected.

## Implementation notes

- Key helpers, TTL clamp, and presign shape are unit-tested in
  `packages/core/tests/storage-media.test.ts` (15 tests, no network needed).
- Dev: `docker compose up -d` now also starts MinIO; set the `S3_*` vars in
  `apps/web/.env` (see `apps/web/.env.example`).
- The admin lesson page embeds a small uploader that returns the storage key to
  paste into a lesson's `contentRef`.
