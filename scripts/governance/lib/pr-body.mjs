import {
  DOD_CHECKBOXES,
  DOR_CHECKBOXES,
  DOR_WAIVER,
  PR_SECTIONS,
  RISK_LEVELS,
} from "../config.mjs";

/**
 * @param {string} body
 * @param {string} marker
 */
export function extractSection(body, marker) {
  const start = body.indexOf(`<!-- ${marker} -->`);
  if (start === -1) return null;

  const afterStart = start + `<!-- ${marker} -->`.length;
  const nextMarker = body.indexOf("<!-- governance:section:", afterStart);
  const end = nextMarker === -1 ? body.length : nextMarker;
  return body.slice(afterStart, end).trim();
}

/**
 * @param {string} section
 * @param {string} label
 */
export function isCheckboxChecked(section, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`-\\s*\\[x\\]\\s*${escaped}`, "i");
  return re.test(section);
}

/**
 * @param {string | null} section
 * @returns {{ level: string | null; errors: string[] }}
 */
export function parseRiskSection(section) {
  const errors = [];
  if (!section) {
    errors.push("Missing Risk Classification section.");
    return { level: null, errors };
  }

  const match = section.match(/\*\*Level:\*\*\s*`?(LOW|MEDIUM|HIGH|CRITICAL)`?/i);
  if (!match) {
    errors.push(
      "Risk Classification must set **Level:** to LOW, MEDIUM, HIGH, or CRITICAL.",
    );
    return { level: null, errors };
  }

  const level = match[1].toUpperCase();
  if (!RISK_LEVELS.includes(level)) {
    errors.push(`Invalid risk level: ${level}`);
    return { level: null, errors };
  }

  return { level, errors };
}

/**
 * @param {string | null} section
 * @param {string} riskLevel
 */
export function validateDoR(section, riskLevel) {
  const errors = [];
  if (!section) {
    errors.push("Missing Definition of Ready section.");
    return errors;
  }

  if (riskLevel === "LOW" && isCheckboxChecked(section, DOR_WAIVER)) {
    return errors;
  }

  if (riskLevel === "LOW") {
    errors.push(
      `LOW risk: either check all DoR items or check "${DOR_WAIVER}".`,
    );
  }

  for (const item of DOR_CHECKBOXES) {
    if (!isCheckboxChecked(section, item)) {
      errors.push(`Definition of Ready incomplete: "${item}" not checked.`);
    }
  }

  return errors;
}

/**
 * @param {string | null} section
 */
export function validateDoD(section) {
  const errors = [];
  if (!section) {
    errors.push("Missing Definition of Done section.");
    return errors;
  }

  for (const item of DOD_CHECKBOXES) {
    if (!isCheckboxChecked(section, item)) {
      errors.push(`Definition of Done incomplete: "${item}" not checked.`);
    }
  }

  return errors;
}

/**
 * @param {string | null} section
 * @param {boolean} architectureChanged
 * @param {boolean} newAdrInDiff
 */
export function validateAdrSection(section, architectureChanged, newAdrInDiff) {
  const errors = [];
  if (!section) {
    errors.push("Missing ADR References section.");
    return errors;
  }

  const hasReference = /ADR-\d{4}/i.test(section);
  const declaresNa =
    /N\/A|none|no architectural impact|not required/i.test(section) &&
    /\*\*Required:\*\*\s*no/i.test(section);

  if (architectureChanged || newAdrInDiff) {
    if (!hasReference && !newAdrInDiff) {
      errors.push(
        "Architecture-related files changed: ADR References must cite ADR-NNNN or this PR must add a new ADR file.",
      );
    }
    if (declaresNa && !newAdrInDiff) {
      errors.push(
        "Architecture changes detected but ADR section declares not required.",
      );
    }
  }

  return errors;
}

/**
 * @param {string | null} section
 * @param {string} riskLevel
 */
export function validateRollback(section, riskLevel) {
  const errors = [];
  if (!section) {
    errors.push("Missing Rollback Plan section.");
    return errors;
  }

  const minLen = riskLevel === "HIGH" || riskLevel === "CRITICAL" ? 20 : 5;
  const content = section.replace(/<!--[\s\S]*?-->/g, "").trim();

  if (content.length < minLen) {
    errors.push(
      `Rollback Plan too short for ${riskLevel} risk (min ${minLen} chars of content).`,
    );
  }

  if (
    (riskLevel === "HIGH" || riskLevel === "CRITICAL") &&
    /N\/A|none|not applicable/i.test(content) &&
    content.length < 30
  ) {
    errors.push("HIGH/CRITICAL risk requires a substantive Rollback Plan.");
  }

  return errors;
}

/**
 * @param {string | null} section
 */
export function validateEvidence(section) {
  const errors = [];
  if (!section) {
    errors.push("Missing Evidence section.");
    return errors;
  }

  const content = section.replace(/<!--[\s\S]*?-->/g, "").trim();
  if (content.length < 10) {
    errors.push("Evidence section must describe verification (min 10 chars).");
  }

  return errors;
}

/**
 * @param {string} body
 */
export function validatePrBody(body) {
  const errors = [];

  if (!body || body.trim().length < 50) {
    return {
      level: null,
      errors: [
        "PR description is empty or too short. Fill in `.github/pull_request_template.md`.",
      ],
    };
  }

  for (const marker of Object.values(PR_SECTIONS)) {
    if (!body.includes(`<!-- ${marker} -->`)) {
      errors.push(`PR body missing governance marker: ${marker}`);
    }
  }

  const riskSection = extractSection(body, PR_SECTIONS.risk);
  const { level, errors: riskErrors } = parseRiskSection(riskSection);
  errors.push(...riskErrors);

  if (!level) return { level: null, errors };

  errors.push(...validateDoR(extractSection(body, PR_SECTIONS.dor), level));
  errors.push(...validateDoD(extractSection(body, PR_SECTIONS.dod)));
  errors.push(
    ...validateRollback(extractSection(body, PR_SECTIONS.rollback), level),
  );
  errors.push(...validateEvidence(extractSection(body, PR_SECTIONS.evidence)));

  return { level, errors };
}
