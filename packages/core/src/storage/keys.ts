/**
 * Storage-key helpers — pure functions, unit-testable without a client.
 *
 * Key format: `media/<tenantId>/<uuid>.<ext>`.
 *
 * The tenant prefix is the v1 authorization boundary (ADR-0008 style): a key
 * is only ever signable by callers inside the tenant that owns it. Keeping the
 * format enforced here (rather than trusting free-form input) is what makes
 * `media.signedReadUrl` safe to expose.
 */
import { randomUUID } from "node:crypto";

import {
  DEFAULT_MEDIA_URL_TTL_SECONDS,
  MAX_MEDIA_URL_TTL_SECONDS,
} from "./config.js";

export const MEDIA_KEY_PREFIX = "media/";

/** Map a MIME type to a file extension for the storage key. */
export function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/mp4": "m4a",
    "application/pdf": "pdf",
    "text/plain": "txt",
    "text/markdown": "md",
  };
  return map[mimeType.toLowerCase()] ?? "bin";
}

/** Build a tenant-scoped media storage key, e.g. media/<tenantId>/<uuid>.mp4. */
export function buildMediaKey(tenantId: string, ext?: string): string {
  const safeExt = (ext ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 8);
  return `${MEDIA_KEY_PREFIX}${tenantId}/${randomUUID()}.${safeExt || "bin"}`;
}

/**
 * True when a key is safe to presign: non-empty, no path traversal, no control
 * chars, no backslashes, relative to the bucket root. Keys are always
 * `media/<tenantId>/<uuid>.<ext>` in v1, but this predicate is the hard gate —
 * anything unexpected is refused regardless of shape.
 */
export function isSafeStorageKey(key: string): boolean {
  if (typeof key !== "string" || key.length === 0 || key.length > 500) return false;
  if (key.startsWith("/") || key.includes("\\")) return false;
  // No ".." path segments: split on "/" and reject any segment that is "..".
  for (const segment of key.split("/")) {
    if (segment === ".." || segment === ".") return false;
  }
  // Reject control characters, spaces, and non-breaking spaces. Iterating
  // code points avoids a control-character regex (lint: no-control-regex).
  for (const ch of key) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f || ch === " " || code === 0xa0) return false;
  }
  return true;
}

/** True when the key lives under this tenant's media prefix. */
export function keyBelongsToTenant(key: string, tenantId: string): boolean {
  return key.startsWith(`${MEDIA_KEY_PREFIX}${tenantId}/`);
}

/** Clamp a requested URL TTL into the allowed window. */
export function clampTtl(
  seconds: number | undefined,
  min = 60,
  max = MAX_MEDIA_URL_TTL_SECONDS
): number {
  if (!Number.isFinite(seconds) || seconds === undefined) {
    return DEFAULT_MEDIA_URL_TTL_SECONDS;
  }
  return Math.min(max, Math.max(min, Math.floor(seconds)));
}
