"use client";

import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";

/**
 * Admin media uploader (ADR-0010): pick a file → the server reserves a
 * tenant-scoped media_assets row + presigned PUT URL → the browser uploads the
 * bytes straight to object storage (never through the app) → the resulting
 * storage key is shown for pasting into a lesson's «Content reference» field.
 *
 * The storage key is the only thing the admin ever writes down; the content
 * itself is protected by enrollment-gated, short-lived signed URLs.
 */
export default function MediaUploader({
  dict,
}: {
  dict: Dictionary;
}): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(file: File): Promise<void> {
    setBusy(true);
    setError(null);
    setStorageKey(null);
    setCopied(false);
    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? dict.adminLessons.uploadFailed);
      }
      // Upload the bytes directly to storage.
      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        throw new Error(dict.adminLessons.uploadFailed);
      }
      setStorageKey(data.storageKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.adminLessons.uploadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function copyKey(): Promise<void> {
    if (!storageKey) return;
    try {
      await navigator.clipboard.writeText(storageKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (non-secure context) — fall back to selection.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 p-4 text-sm dark:bg-gray-900">
      <p className="mb-2 font-semibold">{dict.adminLessons.uploadMedia}</p>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {dict.adminLessons.uploadHint}
      </p>
      <input
        ref={inputRef}
        type="file"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="block w-full text-xs text-gray-600 file:me-3 file:rounded file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-800 dark:text-gray-300"
      />
      {busy ? (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent align-middle" />{" "}
          …
        </p>
      ) : null}
      {storageKey ? (
        <div className="mt-3 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1 text-[11px] text-gray-700 ring-1 ring-gray-200 dark:bg-gray-950 dark:text-gray-200 dark:ring-gray-700">
            {storageKey}
          </code>
          <button
            type="button"
            onClick={() => void copyKey()}
            className="shrink-0 rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
          >
            {copied ? dict.adminLessons.copied : dict.adminLessons.copyKey}
          </button>
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
