# @learning-platform/core

The product. Owns the database, the auth wiring, the plugin registry, and the
public API surface that plugins and the web app call into.

## Rule

**`@learning-platform/core` is the only package in the monorepo that may import
`drizzle-orm` or `pg`.** Every other package reaches the database only through
the typed functions exported from `./api` (see ADR-0006).

## Layout

```
src/
├── db/
│   ├── schema/         # Drizzle table definitions, one file per bounded context
│   ├── migrations/     # Generated SQL (drizzle-kit) — committed
│   ├── client.ts       # Pooled Drizzle client factory (with tenant-scoped helpers)
│   └── index.ts
├── auth/               # Auth.js v5 helpers (Credentials provider, bcrypt)
├── plugins/            # PluginRegistry — typed compile-time registration
├── api/                # The public API surface (what plugins and apps import)
└── index.ts
scripts/
├── migrate.ts          # `pnpm db:migrate`
└── seed-dev.ts         # `pnpm db:seed:dev` (idempotent)
```

## Scripts

- `pnpm --filter @learning-platform/core typecheck`
- `pnpm --filter @learning-platform/core test`
- `pnpm --filter @learning-platform/core db:generate`  — generate SQL from schema changes
- `pnpm --filter @learning-platform/core db:migrate`   — apply pending migrations
- `pnpm --filter @learning-platform/core db:seed:dev` — seed a dev tenant + super admin

## Environment

Set `DATABASE_URL` (defaults to `postgres://learning_platform:learning_platform@localhost:5432/learning_platform`
which matches the root `docker-compose.yml`).
