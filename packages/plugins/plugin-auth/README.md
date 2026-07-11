# @hawza/plugin-auth

Identity & Access bounded context.

**DB ownership**: the `tenants` and `users` tables live in `@hawza/core`
(`packages/core/src/db/schema/identity.ts`). This plugin only declares the
manifest, the permissions, and the API routes that operate on that data
through the `@hawza/core/api` surface.

**Hard rule**: do **not** import `drizzle-orm` or `pg` here. The ESLint
`no-restricted-imports` rule enforces it.
