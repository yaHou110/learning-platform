import {
  CHANGELOG_EXEMPT_SUFFIXES,
  CHANGELOG_PATH,
  PRODUCT_CODE_PATTERNS,
} from "../config.mjs";

/**
 * @param {string[]} changedFiles
 */
export function requiresChangelogUpdate(changedFiles) {
  const productChanges = changedFiles.filter((file) => {
    if (!PRODUCT_CODE_PATTERNS.some((p) => p.test(file))) return false;
    if (file === CHANGELOG_PATH) return false;
    if (file.startsWith("docs/")) return false;
    if (CHANGELOG_EXEMPT_SUFFIXES.some((s) => file.endsWith(s))) return false;
    return true;
  });

  return productChanges.length > 0;
}

/**
 * @param {string[]} changedFiles
 */
export function validateChangelog(changedFiles) {
  if (!requiresChangelogUpdate(changedFiles)) return [];

  if (!changedFiles.includes(CHANGELOG_PATH)) {
    return [
      `${CHANGELOG_PATH} must be updated when product code changes (apps/, packages/, scripts/, workflows/).`,
    ];
  }

  return [];
}
