/**
 * `@learning-platform/contracts` is the enforced single source of truth for
 * domain-event names (MED).
 *
 * The contracts package is a workspace dep of apps/web + core + 4 plugins, yet
 * its runtime exports (`EventNames`, the `AuthLogin*Payload` Zod schemas) had no
 * source importers — plugin manifests duplicated the event names as loose string
 * literals, with nothing enforcing agreement. This test makes contracts a real
 * enforcement layer at the composition root: every `domainEvents[].name` in
 * every registered plugin manifest must appear in `EventNames` (packages/contracts/src/events.ts).
 *
 * Why this lives in `apps/web/tests` and not in `core` or `packages/contracts`:
 *   - core's program is built with `rootDir: "src"` + `declaration`, so a core
 *     source file that imports the contracts package's source trips TS6059
 *     ("not under rootDir"). Keeping the loose `z.string().min(1)` on
 *     `EventRefSchema.name` in core and enforcing the enum here avoids that.
 *   - putting it in `packages/contracts` would invert the dependency
 *     (contracts → 5 plugins); apps/web is the only package that legitimately
 *     depends on *both* the registry (via getPluginRegistry) and contracts.
 *
 * Governance-note: inverting this to "every EventName is declared by some
 * plugin" is intentionally NOT done — contracts is allowed to declare the union
 * of all names the platform *will* use; a plugin need not emit every one.
 */
import { describe, expect, it } from "vitest";
import { EventNames } from "@learning-platform/contracts";
import { getPluginRegistry } from "../src/lib/plugins.js";

describe("contracts — EventNames is the enforced SSOT for manifest domain events", () => {
  it("every manifest domainEvents[].name appears in EventNames", () => {
    const allowed = new Set<string>(EventNames);
    const drift: { plugin: string; name: string }[] = [];
    for (const manifest of getPluginRegistry().list()) {
      for (const e of manifest.domainEvents) {
        if (!allowed.has(e.name)) {
          drift.push({ plugin: manifest.name, name: e.name });
        }
      }
    }
    // Format the failure so the offending plugin + name is actionable.
    expect(
      drift,
      drift
        .map((d) => `${d.plugin} declares "${d.name}" which is not in EventNames`)
        .join("; ")
    ).toEqual([]);
  });

  it("the contracts union is non-empty (guard against a wiring regression)", () => {
    expect(EventNames.length).toBeGreaterThan(0);
  });
});
