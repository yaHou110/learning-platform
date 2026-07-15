# ADR-0006: Plugin architecture — TypeScript pnpm monorepo, internal compile-time modules with typed manifest

- **Status:** Accepted
- **Date:** 2026-07-11
- **Deciders:** founder (Mavis orchestrator, founder authorization in chat 2026-07-11)

---

## Context

v1 needs a way to organize the bounded contexts from `BOUNDED_CONTEXTS.md` so that:

- Each context is **clearly separated** in code, with its own package, its own tests, and its own typed surface.
- The system still ships as **one deployable** (modular monolith per principle #4 and constraint C6).
- Plugins can extend the product **without ever touching the database directly** (principle #5).
- The plugin system in v1 is **internal and compile-time** (principle #7, #9): no runtime code loading, no marketplace, no third-party plugins.
- The result is **small and maintainable** for a single founder (principle #6) — no Turborepo/Nx/Module Federation overhead in v1.

This ADR fixes the v1 shape. A future ADR can introduce a runtime plugin loader if/when the product needs it; that would be an *addition*, not a replacement of this shape.

## Decision

We adopt a **pnpm workspaces monorepo** with the following shape:

```
.
├── apps/
│   └── web/                ← Next.js 15 app (ADR-0003)
├── packages/
│   ├── core/               ← The product. Owns DB, auth, RBAC, tenant context, plugin registry.
│   ├── contracts/          ← Shared TypeScript types (domain events, DTOs).
│   └── plugins/
│       ├── plugin-auth/        ← Bounded context: Identity & Access
│       ├── plugin-catalog/     ← Bounded context: Catalog & Content
│       ├── plugin-learning/    ← Bounded context: Learning & Progress
│       ├── plugin-credentials/ ← Bounded context: Credentials
│       └── plugin-localization/ ← Cross-cutting: Localization
└── pnpm-workspace.yaml
```

Specifically:

- **Monorepo tool:** **pnpm 9** with workspaces (`pnpm-workspace.yaml`). No Turborepo, no Nx — they are YAGNI for v1.
- **Package boundaries:** each `packages/plugins/*` is a separate npm package with its own `tsconfig.json` extending a base config in the repo root. The `core` package is the only package that depends on `drizzle-orm`, `pg`, and the database client.
- **Plugin contract:** every plugin exports a typed `manifest` object, validated by a Zod schema in `core`. The manifest declares:
  - `name`, `version`, `description`.
  - `domainEvents`: which `BOUNDED_CONTEXTS.md` events it emits and consumes.
  - `permissions`: the named permissions it requires from the RBAC system.
  - `apiRoutes`: route handler paths it owns (validated against the API contract registry).
  - `migrations`: SQL or DDL files the core runs at boot (only DDL the core itself defines; see below).
- **Plugin ↔ DB rule:** plugins **must not** import `drizzle-orm` or the `pg` client. They reach data only through the core's public API surface. This is enforced at the lint level (an ESLint `no-restricted-imports` rule in each plugin's `tsconfig`-adjacent lint config).
- **DB migrations:** only `core` owns migrations. Plugins may contribute **jsonb column metadata schemas** (Zod) and **typed event payloads**, but not DDL.
- **Compile-time registration:** the `apps/web` entry point imports every plugin's `manifest` and registers it with the core's `PluginRegistry` at boot. There is no dynamic `require()` or filesystem walk.
- **Tests:** each plugin has its own `vitest` suite; the core has a separate suite; integration tests live in `apps/web/tests/`.
- **No runtime loading, no marketplace, no third-party plugins** in v1 (per principles #7, #9). This is explicit and binding.

## Rationale

- **pnpm workspaces** give us a real monorepo (shared `node_modules`, workspace protocol for internal deps) without any extra build-orchestration tool. This is the smallest thing that satisfies "real package boundaries + one deployable".
- **Compile-time registration** turns the plugin surface into a TypeScript problem: missing exports, wrong event names, wrong permission references are all caught at build time. That is the central guarantee of v1.
- **The "plugins never touch the DB" rule** is the single most important property of the architecture. It is what makes plugins safe to add and what makes the audit story work. Enforcing it in lint, not just in docs, is the difference between a rule and a guideline.
- **DDL stays in core** because DDL changes are the most expensive thing a plugin could do (they can break migrations, block upgrades, leak data). JSONB + Zod covers 100% of the plugin-defined metadata we have in `MVP_SCOPE.md` (course-type-specific fields, lesson-type-specific fields, certificate templates, etc.).
- **One deployable** keeps the VPS story simple: `pnpm --filter web build` produces one artifact, deployed as one process.

### Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Runtime plugin loader** (filesystem walk + dynamic import) | Rejected for v1 | Violates principles #7 and #9. Adds attack surface, complicates the build, and we have no third-party plugins in v1. Re-evaluate in v1.2+ if a real need appears. |
| **Turborepo / Nx** | Rejected for v1 | Extra build tool, extra config, extra concepts. A `pnpm-workspace.yaml` + a few `pnpm --filter` scripts is enough. We adopt Turborepo only if the build graph becomes a measured bottleneck. |
| **Webpack Module Federation** | Rejected | Runtime complexity; no v1 value; doesn't match "one deployable". |
| **Single-package internal modules** (everything in `src/`, plugins are folders) | Rejected | Loses the npm-package boundary and the lint-enforced import rules; harder to test plugins in isolation. |
| **Skip plugins entirely in v1, ship as a single package, add plugins in v1.1** | Considered, **not chosen** | Reasonable, but the bounded contexts are clear enough today that the package boundary is essentially free. We get the typing and lint guarantees without paying the runtime-loader cost. |
| **Plugins own DDL migrations** | Rejected | DDL is the highest-stakes change in a database. Plugins contribute Zod-validated `jsonb` schemas instead, which is sufficient for the v1 feature set. |

## Consequences

### Positive

- Each plugin is a real TypeScript package with its own tests and its own lint rules.
- The "plugins never touch the DB" rule is enforced by tooling, not by convention.
- Build-time errors catch most plugin-misuse cases.
- One deployable, one process, one backup story.

### Negative

- Every plugin change requires a recompile of the `web` app. We accept this — it is the cost of compile-time safety.
- We are committing to a monorepo early. Reverting to a single package later would be a small refactor, not a rewrite.
- Plugin authors (in the future) will need to learn the manifest shape. We mitigate with a `templates/plugin-template/` package in the repo.

### Neutral

- This ADR does not pick a license for plugins. v1 plugins are first-party; the question of third-party plugin licensing is deferred.

## When to revisit

- When a real third-party plugin requirement appears (a center wants to ship its own module without a redeploy). At that point we add a *runtime* plugin loader in a new ADR; this ADR's compile-time registration remains the default for first-party modules.
- When `pnpm --filter` build scripts become a measured bottleneck — adopt Turborepo (or similar) in a new ADR.
- When a plugin needs to own DDL (probably never in v1, possibly in v2).

A new ADR is required to overturn this one.

## References

- `docs/01-product/MVP_SCOPE.md` — v1 plugin scope ("internal, compile-time modularity only").
- `docs/02-architecture/BOUNDED_CONTEXTS.md` — the contexts that become the plugin packages.
- `docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md` — C2, C6, supporting constraints.
- `docs/00-bootstrap/PROJECT_PRINCIPLES.md` — principles #4, #5, #6, #7, #9 (this ADR is the concrete realization of principles #5, #7, #9).
- ADR-0003 — Next.js 15 (the `apps/web` host).
- ADR-0004 — Postgres + Drizzle (the only DB owner is `core`).
- ADR-0005 — Auth.js (plugins call `auth()`, not the `user` table).
- pnpm workspaces: https://pnpm.io/workspaces
