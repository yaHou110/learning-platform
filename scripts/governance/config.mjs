/** @typedef {'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'} RiskLevel */

/** @type {RiskLevel[]} */
export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

/** Paths that trigger ADR reference requirement when changed. */
export const ARCHITECTURE_PATH_PATTERNS = [
  /^apps\/web\/src\/app\/api\//,
  /^apps\/web\/src\/auth\//,
  /^apps\/web\/src\/middleware\.ts$/,
  /^apps\/web\/next\.config\./,
  /^packages\/core\//,
  /^packages\/contracts\//,
  /^packages\/plugins\//,
  /^packages\/core\/.*\/migrations\//,
  /^docker-compose\.ya?ml$/,
  /^\.github\/workflows\//,
  /^docs\/02-architecture\//,
  /^docs\/05-decisions\/ADR-/,
];

/** Paths that require CHANGELOG.md update when changed (non-markdown or structural). */
export const PRODUCT_CODE_PATTERNS = [
  /^apps\//,
  /^packages\//,
  /^scripts\//,
  /^\.github\/workflows\//,
];

/** Files excluded from product-code / changelog requirements. */
export const CHANGELOG_EXEMPT_SUFFIXES = [".md", ".txt"];

export const PR_SECTIONS = {
  risk: "governance:section:risk",
  dor: "governance:section:dor",
  dod: "governance:section:dod",
  adr: "governance:section:adr",
  rollback: "governance:section:rollback",
  evidence: "governance:section:evidence",
};

export const DOR_CHECKBOXES = [
  "Clear objective documented",
  "Acceptance criteria defined",
  "Dependencies identified",
  "Risks identified",
  "Success metrics defined",
];

export const DOR_WAIVER = "DoR waived — LOW risk";

export const DOD_CHECKBOXES = [
  "Acceptance criteria verified",
  "`pnpm verify` passed",
  "Documentation updated",
  "Evidence attached",
  "Rollback documented (if non-trivial)",
];

export const ADR_REFERENCE_PATTERN = /ADR-\d{4}/gi;

export const WORDPRESS_FORBIDDEN = /\bwordpress\b/i;

export const ADR_DIR = "docs/05-decisions";
export const DECISIONS_INDEX = "docs/05-decisions/DECISIONS.md";
export const CHANGELOG_PATH = "CHANGELOG.md";
