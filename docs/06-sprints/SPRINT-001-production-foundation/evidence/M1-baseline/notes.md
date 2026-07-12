# M1 — Baseline Verification — Notes

## What we did

1. **Freeze session 005-007** (commit `c480da7`): 12 uncommitted files from the Identity & Access work were staged and committed as a clean baseline. Sprint plan + updated `PROJECT_STATE.md` / `NEXT_SESSION.md` were included in the same commit.
2. **Verified the baseline** with the canonical quality gates: `pnpm install --frozen-lockfile`, `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build`.

## Real issues found during M1 (and how we fixed them)

These were **not** silently worked around — each one is recorded so the sprint audit trail is honest.

### Issue 1 — `next/no-page-custom-font` warning in `apps/web/src/app/layout.tsx`

**Symptom:** `next lint` exit 0 but with one warning at `layout.tsx:19:9` — a custom Google Font (`Vazirmatn`) was loaded via raw `<link>` tags in the App Router `<head>`, which Next.js flags as discouraged.

**Fix:** Converted the import to `next/font/google` (`Vazirmatn` from `next/font/google`). This:
- Inlines the font CSS at build time (no extra request at runtime)
- Removes the warning
- Aligns with the App Router-recommended pattern

**Files changed:** `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css` (unchanged — the body class swap is in layout only).

### Issue 2 — Root `pnpm build` script had a broken filter

**Symptom:** `pnpm build` at the root ran `pnpm -r --filter='./packages/*' build`, which pnpm 9 interpreted as "no projects matched" and silently continued. Then it ran `next build` without first compiling `@hawza/core`, so `core/dist/...js` (the package's `exports` target) did not exist.

**Fix:** Changed the root `build` script to `pnpm --filter web build`. Since `transpilePackages` in `next.config.mjs` already tells Next.js to compile the workspace packages from source, no per-package build step is required. The individual package `build` scripts remain available for ad-hoc use (`pnpm --filter @hawza/core build`) but are not part of the default root pipeline.

**Files changed:** `package.json` (root).

### Issue 3 — `core/package.json` `exports` pointed to `dist/...js` while other packages pointed to source

**Symptom:** Even after the filter fix, `next build` failed with `Module not found: Can't resolve '../db/client.js'`. `@hawza/core` was the only package whose `exports` field targeted the compiled output (`./dist/...js`). All other workspace packages export source (`./src/...ts`).

**Fix:** Updated `packages/core/package.json` so `main`, `types`, and all subpath `exports` point to `./src/...ts`. The TypeScript source uses NodeNext-style `.js` extensions on its imports (e.g. `from '../db/client.js'`), so we also need webpack to map `.js` → `.ts`.

**Files changed:** `packages/core/package.json`.

### Issue 4 — Webpack did not map `.js` → `.ts` for NodeNext-style imports

**Symptom:** After fixing the `exports`, `next build` still failed because `@hawza/core/src/api/index.ts` does `from '../db/client.js'`. Webpack looked for an actual `.js` file in `packages/core/src/db/` and did not find one (only `client.ts`).

**Fix:** Added `extensionAlias` to `apps/web/next.config.mjs`:
```js
config.resolve.extensionAlias = {
  ".js": [".ts", ".tsx", ".js", ".jsx"],
  ".mjs": [".mts", ".mjs"],
};
```
This is the canonical pattern for TypeScript NodeNext + Next.js + workspace packages.

**Files changed:** `apps/web/next.config.mjs`.

### Issue 5 — Native `bcrypt` is unbundlable in the Next.js server build

**Symptom:** After the `.js` → `.ts` fix, `next build` failed again with webpack errors inside `node_modules/.pnpm/bcrypt@5.1.1/.../node-pre-gyp` (HTML files, missing `mock-aws-s3` / `aws-sdk` / `nock`). `@hawza/core` used `bcrypt` (native, C++ bindings) for `hashPassword` / `verifyPassword`. Webpack tried to bundle it and choked.

**Fix:** Switched `@hawza/core` from native `bcrypt` to pure-JS `bcryptjs` (the same package that `apps/web` already uses for Auth.js adapters). Trade-off: ~250ms vs ~80ms per hash at cost 12, which is acceptable for the login flow. Operational win: no native build, no `node-pre-gyp`, no CI matrix pain, no Alpine/musl issues on the production VPS. Rationale documented in the JSDoc header of `credentials.ts`.

**Files changed:** `packages/core/package.json` (deps), `packages/core/src/auth/credentials.ts` (import + JSDoc).

## Test summary

| Package | Tests | Result |
| --- | --- | --- |
| `packages/core` | 3 (registry) | ✓ |
| `packages/plugin-auth` | 3 (manifest) | ✓ |
| `packages/plugin-catalog` | 2 (manifest) | ✓ |
| `packages/plugin-credentials` | 3 (manifest) | ✓ |
| `packages/plugin-learning` | 2 (manifest) | ✓ |
| `packages/plugin-localization` | 3 (manifest) | ✓ |
| `apps/web` | 2 (plugins) | ✓ |
| `packages/contracts` | 0 (no tests yet) | n/a |
| **Total** | **18** | **all pass** |

## Build summary (next build)

```
Route (app)                              Size     First Load JS
┌ ƒ /                                    151 B           100 kB
├ ○ /_not-found                          895 B           101 kB
├ ƒ /api/auth/[...nextauth]              151 B           100 kB
├ ƒ /api/auth/session                    151 B           100 kB
├ ƒ /api/health                          151 B           100 kB
├ ƒ /api/users                           151 B           100 kB
└ ƒ /login                               151 B           100 kB
+ First Load JS shared by all            99.9 kB
ƒ Middleware                             42.5 kB
```

- 7 routes, all API routes are dynamic (`ƒ`) which is correct for our auth-gated model.
- First Load JS = 100 kB — within the budget for a Persian/RTL LMS over slow connections.
- Middleware = 42.5 kB — Edge bundle from `getToken`.

## Tooling observations

- **`pnpm` not directly invokable from PowerShell** on this machine due to execution policy. Workaround: `cmd /c "pnpm ..."`. We will codify this in the M6 deployment doc.
- **Node 24 is installed** on this dev machine; the project targets Node 20 LTS. The build works on both, but the production VPS will be Node 20.
- **ESLint v8 / Next 15.0.3** emit deprecation warnings on `pnpm install` (transitive). Not blocking; track for upgrade in a future sprint.

## What is **not** in M1 (deferred to later milestones)

- Running `next start` against the production build (M2).
- GitHub Actions CI (M3).
- CSP, security headers, rate limit (M4).
- Structured logs, metrics, error reporting (M5).
- Docker Compose, Nginx, systemd, backup (M6).
- Production readiness sign-off (M7).

## Status

🟢 **M1 PASSED.** All five quality gates green. The repo is at a state where feature work could resume, but per the sprint's hard gate we proceed to M2.
