import { execSync } from "node:child_process";

/**
 * @param {string} baseSha
 * @param {string} headSha
 * @returns {string[]}
 */
export function getChangedFiles(baseSha, headSha) {
  if (!baseSha || !headSha) {
    try {
      const out = execSync("git diff --name-only HEAD~1 HEAD", {
        encoding: "utf8",
      }).trim();
      return out ? out.split("\n").filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  const out = execSync(`git diff --name-only ${baseSha}...${headSha}`, {
    encoding: "utf8",
  }).trim();
  return out ? out.split("\n").filter(Boolean) : [];
}

/**
 * @param {string[]} files
 * @param {RegExp[]} patterns
 */
export function matchesAny(files, patterns) {
  return files.some((file) => patterns.some((p) => p.test(file)));
}

/**
 * @param {string[]} files
 * @param {RegExp[]} patterns
 */
export function filterMatches(files, patterns) {
  return files.filter((file) => patterns.some((p) => p.test(file)));
}
