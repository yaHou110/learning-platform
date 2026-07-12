# QUALITY_GATES.md

> **Mandatory checks before every commit.** Aligned with ENGINEERING_PROTOCOL §6, §20, §32 and SPRINT-001 M1 baseline.
>
> Last updated: 2026-07-12

---

## Quick reference

```bash
# All gates in sequence (preferred)
pnpm verify

# Individual gates (for debugging failures)
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

On Windows PowerShell, if `pnpm` is blocked by execution policy, use:

```powershell
cmd /c "pnpm verify"
```

---

## Gate definitions

| Gate | Command | Pass criteria |
| --- | --- | --- |
| **Lint** | `pnpm lint` | Exit code 0; zero errors; zero warnings (project standard) |
| **Typecheck** | `pnpm typecheck` | Exit code 0 across all workspace packages |
| **Test** | `pnpm test` | Exit code 0; no skipped required tests |
| **Production build** | `pnpm build` | Exit code 0; Next.js production build completes |

---

## Prerequisites

| Requirement | Version | Source |
| --- | --- | --- |
| Node.js | ≥ 20 LTS | `package.json` `engines` |
| pnpm | ≥ 9 | `package.json` `packageManager` |
| PostgreSQL | 16 (for runtime / e2e smoke tests) | ADR-0004; not required for lint/typecheck/test/build |

Lint, typecheck, test, and build gates do **not** require a running database. Runtime smoke tests (SPRINT-001 M2+) do.

---

## CI alignment

GitHub Actions workflow: `.github/workflows/governance.yml`

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm verify
- run: pnpm governance:validate
```

Local equivalents:

```bash
pnpm verify
pnpm governance:validate:local   # skips PR body — before commit
pnpm governance:validate         # full check — set PR_BODY env for PR simulation
```

Local `pnpm verify` must match CI. Do not use alternate local-only shortcuts.

---

## Scripts

| Script | Path | Purpose |
| --- | --- | --- |
| `pnpm verify` | Root `package.json` | Runs all four gates |
| `scripts/quality-gates.ps1` | Windows | Same gates with explicit step output |
| `scripts/quality-gates.sh` | Unix / CI | Same gates with `set -euo pipefail` |

---

## On failure

1. **Stop.** Do not commit.
2. Fix the root cause (see ENGINEERING_PROTOCOL §33).
3. Re-run `pnpm verify`.
4. Record the fix and verification output in sprint evidence or handover.

---

## Evidence recording

For sprint milestones, capture:

- `commands.txt` — exact commands (include `pnpm verify`)
- `output-<gate>.txt` — full or relevant output per gate
- `checklist.md` — tick each gate

Evidence directory pattern: `docs/06-sprints/SPRINT-NNN-*/evidence/M{n}-*/`.
