/**
 * Governance: implemented API routes are claimed by a plugin manifest.
 *
 * The AI's literal "every declared apiRoute must have a matching file" gate is
 * self-contradictory against the instruction to keep planned-but-unimplemented
 * routes — it would fail CI permanently on the 13 declared routes whose files
 * don't exist yet (catalog/learning/credentials surfaces). The useful,
 * green-today invariant is the inverse and the one that prevents real drift:
 * every *implemented* route file under `apps/web/src/app/api/` is either
 * declared by some plugin manifest (so its bounded context owns it) or is an
 * explicitly-listed infrastructure route (health/ready/metrics — M5
 * operational surface that no bounded-context plugin claims).
 *
 * What this catches: a future `apps/web/src/app/api/foo/route.ts` added
 * without (a) a manifest declaring `/api/foo` or (b) an infra exemption — an
 * orphan route that bypasses the plugin/contract model. It does NOT fail on
 * intentional forward-declared surface (planned routes have no file and so
 * are not in the implemented set this scans).
 *
 * Matching: manifest `:param` paths and App-Router dynamic segments (`[id]`,
 * catch-all `[...nextauth]`) are pattern-matched, so the Auth.js catch-all
 * (`/api/auth/[...nextauth]`) is correctly covered by plugin-auth's
 * `/api/auth/login` + `/api/auth/logout` declarations.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getPluginRegistry } from "../src/lib/plugins.js";

const API_DIR = fileURLToPath(new URL("../src/app/api", import.meta.url));

// Routes implemented by the platform, not a bounded-context plugin. Add here
// ONLY when a route is genuinely cross-cutting infra (no plugin owns it).
const INFRA_ROUTE_PATTERNS: RegExp[] = [
  /^\/api\/health$/,
  /^\/api\/ready$/,
  /^\/api\/metrics$/,
];

/** Recursively collect `route.ts` files under dir, returning URL-path patterns. */
function collectRoutePatterns(dir: string, prefix = "/api"): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      // App Router dynamic segment → manifest `:param` convention.
      // [id]        -> ":param" (one segment)
      // [...slug]   -> "*"      (catch-all, spans segments) — kept as a trailing
      //                           `/*` in the pattern so the regex matches every
      //                           sub-path the catch-all serves.
      const seg = entry
        .replace(/^\[\.\.\.([\w-]+)\]$/, "*")
        .replace(/^\[([\w-]+)\]$/, ":param");
      const nextPrefix = seg === "*" ? `${prefix}/*` : `${prefix}/${seg}`;
      out.push(...collectRoutePatterns(full, nextPrefix));
    } else if (entry === "route.ts") {
      out.push(prefix);
    }
  }
  return out;
}

/** Convert an App-Router-derived path pattern into a regex anchoring a URL. */
function filePatternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  // `:param` matches one segment; trailing `*` (catch-all) matches the rest.
  const body = escaped
    .replace(/:param/g, "[^/]+")
    .replace(/\/\*$/g, "/.+");
  return new RegExp(`^${body}$`);
}

/** Render a manifest `:param` path into a sample concrete path for matching. */
function sampleOf(manifestPath: string): string {
  return manifestPath.replace(/:[\w-]+/g, "x");
}

describe("manifest/route coverage (governance)", () => {
  it("every implemented route file is declared by a manifest or is infra", () => {
    const implemented = collectRoutePatterns(API_DIR);
    expect(implemented.length).toBeGreaterThan(0); // sanity: the scan found routes

    const manifests = getPluginRegistry().list();
    const declaredSamples = manifests
      .flatMap((m) => m.apiRoutes.map((r) => sampleOf(r.path)));

    const orphans: string[] = [];
    for (const filePattern of implemented) {
      const isInfra = INFRA_ROUTE_PATTERNS.some((re) => re.test(filePattern));
      if (isInfra) continue;
      const fileRe = filePatternToRegex(filePattern);
      const covered = declaredSamples.some((s) => fileRe.test(s));
      if (!covered) orphans.push(filePattern);
    }

    expect(orphans).toEqual([]);
  });
});
