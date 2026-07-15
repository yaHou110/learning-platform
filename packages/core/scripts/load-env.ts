/**
 * Tiny env loader — stdlib only (no dotenv dependency).
 *
 * Walks up from the script's directory to find the repo root (where .git lives),
 * then reads `${repoRoot}/.env` and sets process.env vars if DATABASE_URL
 * is not already set.
 *
 * This replaces `dotenv` while keeping the same runtime behavior:
 * - Explicit `DATABASE_URL=… node script` works unchanged (already set → skip).
 * - Node's own `--env-file` still works (loaded before script runs → skip).
 * - Running from any cwd works (resolves root from import.meta.dirname, not cwd).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_FILE = ".env";

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    try {
      readFileSync(join(dir, ".git"), "utf8"); // .git is a file listing the worktree ref
      return dir;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  // Fallback: return the script's own directory
  return startDir;
}

const VAR_RE = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/;

export function loadEnvOnce(): void {
  if (process.env.DATABASE_URL) return; // already provided — nothing to do

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const root = findRepoRoot(scriptDir);
  const envPath = join(root, ENV_FILE);

  let content: string;
  try {
    content = readFileSync(envPath, "utf8");
  } catch {
    return; // no .env file — silently skip
  }

  for (const line of content.split("\n")) {
    const m = VAR_RE.exec(line);
    if (!m) continue;
    const [, key, val] = m;
    if (key in process.env) continue;
    // strip optional surrounding quotes
    const clean = val.replace(/^["'](.*)["']$/, "$1");
    process.env[key] = clean;
  }
}