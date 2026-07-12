#!/usr/bin/env node
/**
 * Executable governance validator (Engineering OS).
 * Used locally and in .github/workflows/governance.yml
 *
 * Env:
 *   PR_BODY          — pull request description (required on pull_request)
 *   BASE_SHA         — merge base commit
 *   HEAD_SHA         — PR head commit
 *   GITHUB_EVENT_NAME — pull_request | push | workflow_dispatch
 *   SKIP_PR_BODY     — set to "1" to skip PR template checks (local only)
 */

import { validatePrBody, extractSection, validateAdrSection } from "./lib/pr-body.mjs";
import {
  validateAdrIndex,
  validateNewAdrCompleteness,
  validateWordPressBan,
} from "./lib/adr-compliance.mjs";
import { validateChangelog } from "./lib/changelog.mjs";
import { getChangedFiles, matchesAny } from "./lib/git.mjs";
import { ARCHITECTURE_PATH_PATTERNS, PR_SECTIONS } from "./config.mjs";

const eventName = process.env.GITHUB_EVENT_NAME ?? "local";
const skipPrBody = process.env.SKIP_PR_BODY === "1";
const prBody = process.env.PR_BODY ?? "";
const baseSha = process.env.BASE_SHA ?? "";
const headSha = process.env.HEAD_SHA ?? "";

const errors = [];
const warnings = [];

console.log("=== Governance validation ===");
console.log(`Event: ${eventName}`);

const changedFiles = getChangedFiles(baseSha, headSha);
console.log(`Changed files: ${changedFiles.length}`);

// --- ADR index integrity (always) ---
errors.push(...validateAdrIndex());

// --- ADR-0001 WordPress ban on changed files ---
errors.push(...validateWordPressBan(changedFiles, baseSha, headSha));

// --- New ADR completeness ---
errors.push(...validateNewAdrCompleteness(changedFiles));

// --- CHANGELOG requirement ---
errors.push(...validateChangelog(changedFiles));

const architectureChanged = matchesAny(changedFiles, ARCHITECTURE_PATH_PATTERNS);
const newAdrInDiff = changedFiles.some((f) =>
  /^docs\/05-decisions\/ADR-\d{4}-.+\.md$/.test(f),
);

if (architectureChanged) {
  console.log("Architecture-sensitive paths changed — ADR reference required.");
}

// --- PR body governance sections ---
const isPullRequest = eventName === "pull_request";

if (isPullRequest && !skipPrBody) {
  const { errors: prErrors } = validatePrBody(prBody);
  errors.push(...prErrors);

  const adrSection = extractSection(prBody, PR_SECTIONS.adr);
  errors.push(
    ...validateAdrSection(adrSection, architectureChanged, newAdrInDiff),
  );
} else if (isPullRequest && skipPrBody) {
  warnings.push("PR body validation skipped (SKIP_PR_BODY=1).");
} else if (!isPullRequest && architectureChanged) {
  warnings.push(
    "Non-PR event: PR template sections not validated. Open a PR before merge.",
  );
}

if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (errors.length) {
  console.error("\nGovernance validation FAILED:\n");
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(
    "\nSee docs/03-development/GOVERNANCE_CHECKLIST.md and .github/pull_request_template.md",
  );
  process.exit(1);
}

console.log("\nGovernance validation PASSED.");
process.exit(0);
