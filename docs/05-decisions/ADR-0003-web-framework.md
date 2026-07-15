# ADR-0003: Web framework — Next.js 15 (App Router) on Node.js 20 LTS

- **Status:** Accepted
- **Date:** 2026-07-11
- **Deciders:** founder (Mavis orchestrator, founder authorization in chat 2026-07-11)

---

## Context

The v1 product needs:

- A web framework that runs the **UI and the API** in one runtime — required by `PROJECT_PRINCIPLES.md` principles #1 (API-first) and #2 (UI is just another client), and consistent with the modular-monolith choice (principle #4).
- SSR for fast first paint on Persian/RTL pages and good SEO for course catalogs.
- Strong TypeScript story so the plugin system (ADR-0006) gets compile-time type safety on its manifests.
- A self-hostable, single-binary-or-single-process deployment that fits a **4 GB VPS** (`ARCHITECTURE_CONSTRAINTS.md` C1).
- An active LTS line and a large plugin/adapter ecosystem, since the project is single-founder and must be maintainable for 10+ years (`PRODUCT_BIBLE.md §2`).
- No GPL dependencies in core (`ARCHITECTURE_CONSTRAINTS.md` supporting constraints).

## Decision

We adopt **Next.js 15 (App Router) on Node.js 20 LTS, written in TypeScript with `strict: true`**.

Specifically:

- Runtime: **Node.js 20 LTS** (active LTS line; aligns with the Next.js 15 support window).
- Framework: **Next.js 15.x** with the **App Router** (React Server Components + route handlers).
- Language: **TypeScript 5.x** with `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- API surface: built-in **route handlers** under `app/api/**/route.ts` for v1; the API contract format (OpenAPI generation) is decided in a later ADR per `ARCHITECTURE_CONSTRAINTS.md` C7.
- Package manager at the repo root: **pnpm 9** with workspaces (see ADR-0006 for the monorepo shape).
- i18n: `next-intl` for Persian/RTL first-class.

## Rationale

- **One runtime, one deploy artifact.** Next.js lets us host UI + API in one Node process, which matches the modular-monolith principle and the 4 GB VPS budget.
- **RSC + route handlers** give us server-first rendering (good for RTL/SEO and for not shipping the whole app to the client) while keeping the API contract close to the data.
- **Mature TypeScript story.** Required for the typed plugin manifest in ADR-0006.
- **Mature ecosystem for the things we actually need**: `next-intl` (i18n + RTL), Drizzle adapters, Auth.js, S3-compatible uploads, audit-log middleware examples — all without GPL in core.
- **Predictable LTS.** Next.js 15 + Node 20 are both on supported lines through at least 2026–2027, which honors the 10-year durability goal in the short-term operational sense (we will revisit before LTS ends).
- **Self-hostable**. Next.js builds to a Node process behind a reverse proxy; no proprietary runtime.

### Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| **Remix (React Router v7)** | Rejected (for v1) | Smaller ecosystem for the i18n/auth/multi-tenant story we need; RSC maturity lags Next.js. Re-evaluate in v1.2 if pain shows up. |
| **Nuxt 3 (Vue)** | Rejected | Vue is fine, but TypeScript ergonomics for the plugin-typing story are weaker than Next.js + React. |
| **SvelteKit** | Rejected | Smallest ecosystem of the four; plugin-typing story is less mature. |
| **Astro** | Rejected | Better for content sites; auth + multi-tenant + per-tenant dashboards are not its strength. |
| **Plain Fastify + Vite SPA** | Rejected | We would rebuild SSR, route grouping, and middleware plumbing that Next.js ships. Violates principle #6 (simplicity over premature extensibility). |

## Consequences

### Positive

- One process to operate, one binary to deploy, one log stream.
- First-class TypeScript end-to-end — directly enables ADR-0006.
- Persian/RTL and i18n are well-trodden paths in the Next.js ecosystem.
- Server Components reduce client bundle size — important for users on slower connections (in scope of `PRODUCT_BIBLE.md §3`).

### Negative

- Next.js is opinionated. We inherit its conventions and upgrade cadence.
- App Router is newer than Pages Router; some third-party libraries still catch up. We accept this in exchange for RSC.
- Serverless-style features (Vercel edge) will be **avoided** in v1 to keep the single-VPS deploy simple. If we ever go to edge, it is a new ADR.

### Neutral

- We commit to a Node 20 LTS baseline; Node 22 is not used in v1 to keep the matrix small.

## When to revisit

- When Next.js 15 reaches end-of-life and Next.js 16 is the supported line (track via the Next.js release page).
- If multi-tenant isolation (Q6 in `PROJECT_STATE.md`) forces per-tenant process isolation that Next.js route handlers cannot express.
- If a future requirement (e.g. heavy AI inference) makes us want a non-Node runtime — at that point we would split the AI worker into its own service and keep Next.js for web.
- If the founder later prefers Remix or SvelteKit and is willing to absorb the migration cost.

A new ADR is required to overturn this one.

## References

- `docs/01-product/PRODUCT_BIBLE.md` — vision, durability, ownership.
- `docs/01-product/MVP_SCOPE.md` — in-scope capabilities and out-of-scope items.
- `docs/02-architecture/ARCHITECTURE_CONSTRAINTS.md` — C1, C3, C6, supporting constraints.
- `docs/00-bootstrap/PROJECT_PRINCIPLES.md` — principles #1, #2, #4, #6, #8.
- Next.js docs: https://nextjs.org/docs/app
- Node.js release schedule: https://nodejs.org/en/about/previous-releases
