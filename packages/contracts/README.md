# @hawza/contracts

Shared TypeScript types (and Zod schemas) for **domain events** and **DTOs**
that flow between bounded contexts.

Why a separate package?

- Plugins can type their emitted/consumed events against `@hawza/contracts`
  without depending on `@hawza/core` (which owns the DB).
- The package graph stays one-way: `apps/*` and `packages/plugins/*` depend on
  `contracts`; `contracts` depends on no internal package.
- It makes the cross-context contract the **only** place where event names
  and payload shapes are defined — single source of truth.

## Layout

```
src/
├── events/         # Domain event names + payload schemas (Zod)
├── dto/            # Data transfer objects exposed via the public API
└── index.ts
```

v1 contents are minimal — only the events the `plugin-auth` manifest
references. Other contexts add their events as they are built.
