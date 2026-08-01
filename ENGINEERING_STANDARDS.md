# Engineering Standards: Next.js + Drizzle Monorepo

This document captures consensus best practices for the `learning-platform` project. All architectural changes must align with these patterns.

## 1. Database & Drizzle (packages/core)
- **Schema:** Defined centrally in `packages/core/src/db/schema`.
- **Migrations:** Managed only within `packages/core/scripts/migrate.ts`. **Application startup must never run migrations.**
- **Connections:** Use a shared client singleton in `packages/core/src/db/client.ts`. Ensure pooling is configured for Serverless (e.g., using `neon` or `pg-pool` with appropriate limits).
- **Type Safety:** Always use Drizzle's `inferSelectModel` and `inferInsertModel` for type definitions. Avoid manual type mapping.

## 2. Next.js App Router (apps/web)
- **Data Fetching:** Server Components must call `packages/core` exported functions directly. Do not call DB directly from `apps/web`.
- **Environment Variables:** Must be validated at runtime using `zod` in `apps/web/src/lib/env.ts`. Fail fast if required variables are missing.
- **Caching:** Leverage `next/cache` (revalidatePath, revalidateTag) for DB-heavy queries.

## 3. Monorepo Structure
- **Core vs. Plugins:** `packages/core` is strictly for infrastructure (DB, Auth, Observability). `packages/plugins` contains domain logic.
- **Dependencies:** Avoid circular dependencies between packages. `apps/web` depends on `packages/core` and `packages/plugins`, but never vice-versa.

## 4. Architectural Change Process
Before proposing any architectural change:
1. Search official documentation.
2. Review these patterns.
3. If changing a pattern, cite at least two independent sources or established production examples.
4. Ensure compatibility with the current plugin-based architecture.
