#!/usr/bin/env node
/**
 * Sync AGENTS.md to CLAUDE.md and .github/copilot-instructions.md
 * Source of truth: AGENTS.md
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const sourcePath = join(root, "AGENTS.md");
const targets = [
  join(root, "CLAUDE.md"),
  join(root, ".github", "copilot-instructions.md"),
];

const banner =
  "<!-- AUTO-SYNCED from AGENTS.md — edit AGENTS.md and run pnpm sync:agents -->\n\n";

const source = readFileSync(sourcePath, "utf8");

for (const target of targets) {
  writeFileSync(target, banner + source, "utf8");
  console.log(`Synced → ${target.replace(root + "/", "")}`);
}

console.log("Agent instructions synchronized.");
