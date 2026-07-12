import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  ADR_DIR,
  DECISIONS_INDEX,
  WORDPRESS_FORBIDDEN,
} from "../config.mjs";
import { execSync } from "node:child_process";

/**
 * @returns {string[]}
 */
export function listAdrsInDecisionsIndex() {
  const content = readFileSync(DECISIONS_INDEX, "utf8");
  const matches = content.matchAll(/\[?(ADR-\d{4})\]?/g);
  const ids = new Set();
  for (const m of matches) {
    if (m[1]) ids.add(m[1].toUpperCase());
  }
  return [...ids].sort();
}

/**
 * Validate DECISIONS.md index matches ADR files on disk (Active ADRs).
 */
export function validateAdrIndex() {
  const errors = [];
  if (!existsSync(ADR_DIR) || !existsSync(DECISIONS_INDEX)) return errors;

  const indexed = listAdrsInDecisionsIndex();

  for (const file of readdirSync(ADR_DIR)) {
    if (!/^ADR-\d{4}-.+\.md$/.test(file)) continue;
    const id = file.match(/^(ADR-\d{4})/)?.[1]?.toUpperCase();
    if (!id) continue;

    const content = readFileSync(join(ADR_DIR, file), "utf8");
    if (/^\s*-\s*\*\*Status:\*\*\s*Accepted/m.test(content)) {
      if (!indexed.includes(id)) {
        errors.push(
          `${id} is Accepted on disk but missing from ${DECISIONS_INDEX} Active table.`,
        );
      }
    }
  }

  return errors;
}

/**
 * @param {string[]} changedFiles
 */
export function validateNewAdrCompleteness(changedFiles) {
  const errors = [];
  const newAdrs = changedFiles.filter(
    (f) => f.startsWith(`${ADR_DIR}/ADR-`) && f.endsWith(".md"),
  );

  if (newAdrs.length === 0) return errors;

  if (!changedFiles.includes(DECISIONS_INDEX)) {
    errors.push(
      `New ADR file(s) added but ${DECISIONS_INDEX} was not updated.`,
    );
  }

  if (!changedFiles.includes("CHANGELOG.md")) {
    errors.push("New ADR file(s) added but CHANGELOG.md was not updated.");
  }

  return errors;
}

/**
 * ADR-0001: forbid WordPress in changed product code (not documentation).
 * @param {string[]} changedFiles
 * @param {string} baseSha
 * @param {string} headSha
 */
export function validateWordPressBan(changedFiles, baseSha, headSha) {
  const errors = [];
  const codePatterns = [
    /^apps\//,
    /^packages\//,
    /^package\.json$/,
    /^pnpm-lock\.yaml$/,
  ];

  const candidates = changedFiles.filter((file) =>
    codePatterns.some((p) => p.test(file)),
  );

  for (const file of candidates) {
    try {
      let content;
      if (baseSha && headSha) {
        content = execSync(`git show ${headSha}:${file}`, { encoding: "utf8" });
      } else {
        content = readFileSync(file, "utf8");
      }
      if (WORDPRESS_FORBIDDEN.test(content)) {
        errors.push(`ADR-0001 violation: "wordpress" found in ${file}`);
      }
    } catch {
      // deleted or binary — skip
    }
  }

  return errors;
}
