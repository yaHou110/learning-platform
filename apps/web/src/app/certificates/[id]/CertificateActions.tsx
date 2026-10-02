"use client";

import { useState } from "react";

export default function CertificateActions({
  verifyUrl,
  hash,
}: {
  verifyUrl: string;
  hash: string;
}) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div className="print:hidden flex flex-wrap items-center justify-center gap-3 mt-6">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2.5 text-sm font-medium shadow-sm transition"
      >
        <span>🖨️</span>
        <span>چاپ / ذخیره به عنوان PDF</span>
      </button>

      <button
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-5 py-2.5 text-sm font-medium shadow-sm transition"
      >
        <span>📋</span>
        <span>{copied ? "کپی شد! ✓" : "کپی لینک استعلام گواهی"}</span>
      </button>

      <a
        href={`/verify?hash=${encodeURIComponent(hash)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-5 py-2.5 text-sm font-medium transition"
      >
        <span>🔍</span>
        <span>صفحه عمومی استعلام مدرک</span>
      </a>
    </div>
  );
}
