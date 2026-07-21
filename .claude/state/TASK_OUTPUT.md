# TaskOutput — the Git handoff contract

> **JSON is intent. Repo + command output + CI are state.**
> **The script verifies state and refuses to act on intent alone.**
> **The harness prevents Claude from bypassing this by touching Git directly.**
> **Schema versioning lets the contract evolve without breaking old handoffs.**

## What this replaces

Previously Claude ran the entire Git lifecycle inline: `git add → commit → push → gh pr create → wait CI → merge`. That burned context window on mechanical ops and mixed two roles in one agent. This model **separates concerns**:

- **Claude Code owns code + intent.** Design, implement, write tests, run validation locally, then write `.claude/state/task-output.json` describing *what this milestone is and how it should be framed*. Claude **does not touch Git mutating ops** — a `PreToolUse(Bash)` hook (see `.claude/settings.json` → `scripts/handoff/block-mutating-git.ps1`) physically refuses `commit/push/merge/...`.
- **The handoff script owns Git + state.** `scripts/handoff/Invoke-TaskOutput.ps1` reads the JSON *intent*, but derives file list, branch, and green-ness from the **live repo and CI** — never trusting JSON claims. It commits, pushes, opens the PR, waits for required CI green, and **stops before merge** (manual by default).
- **A human owns the merge decision.** The last gate is preserved unless `merge_policy: "auto-on-green"` explicitly opts out.

## When the chain fires

A `Stop` hook (`.claude/settings.json`) runs the script **every time Claude stops**. Cheap on non-milestone stops: the script exits with code `2` (soft no-op) when `task-output.json` is absent or `status` is not `completed`. So:

- Claude answers a question / reads a file / pauses mid-task → no JSON, or `status=in-progress` → script exits immediately, nothing happens.
- Claude finishes a milestone, has run local validation, and writes `task-output.json` with `status="completed"` → the Stop hook runs, the script owns the chain: verify → branch → commit → push → PR → wait CI → stop before merge.

## The file: `.claude/state/task-output.json`

Schema: [.claude/state/schema/v1.schema.json](schema/v1.schema.json) — the authoritative contract. Validator: `scripts/handoff/validate-task-output.mjs` (Ajv, or structural fallback).

### Required fields
- `schema_version` (number, `1`) — **bump only when you change the shape**. The script maps this to `schema/v{N}.schema.json` so old handoffs validate against the schema they were written with.
- `task` (string) — milestone id, e.g. `"M6-deployment"`. Human context only.
- `status` (string, `draft|in-progress|completed`) — the trigger gate. Only `completed` fires Git.
- `commit_message` (string) — **full Conventional Commits message, including type+scope.** The script does NOT derive this from the diff (type, scope, and the WHY are intent — a diff-derived message loses them). Lead the body with the WHY.
- `pr_title` (string) — PR title; also derives the branch slug when starting from `main`.
- `pr_body` (string) — the WHY; the WHAT is in the diff. Include a short checklist if useful.
- `merge_policy` (`manual` | `auto-on-green`) — `manual` (recommended) stops before merge; `auto-on-green` squashes + deletes the branch once CI is green.

### Optional fields
- `closes_issues` (string[], each `#N`) — appended to the body as `Closes #N`.
- `labels` (string[]) — GitHub labels applied after PR creation.
- `reviewers` (string[]) — reserved for v1; script may add `--request-reviewer` later.
- `verification.commands_run_locally` (string[]) — **informational only.** Records which gates Claude ran locally before marking `completed`. The script **does not trust these results** — under the confirmed CI-only policy it waits for required GitHub Actions checks instead. Listed so the PR body shows a local-evidence trail.

### Minimal example
```json
{
  "schema_version": 1,
  "task": "M6-deployment",
  "status": "completed",
  "commit_message": "feat(deployment): M6 — Dockerfile + compose.prod + nginx + systemd + backup/restore + CI/CD",
  "pr_title": "M6: Deployment stack",
  "pr_body": "Adds the production deployment stack: Dockerfile, compose.prod, nginx reverse proxy, systemd unit, backup/restore scripts, and the CI/CD pipeline.\n\nWhy: M6 production readiness — the app needs a reproducible prod path before we cut a release.\n\n- Dockerfile (multi-stage)\n- compose.prod with healthchecks\n- backup/restore scripts",
  "closes_issues": [],
  "labels": ["deployment"],
  "merge_policy": "manual",
  "verification": {
    "commands_run_locally": ["pnpm typecheck", "pnpm lint", "pnpm test", "pnpm build", "pnpm governance:validate:local"]
  }
}
```

## Working rules for Claude

1. **Do not run mutating Git ops.** You can't — the hook blocks them. Use `git status`/`git diff`/`git log` to inspect; route all commits/pushes/PRs through this file.
2. **Set `status="draft"` while you work**, flip to `"completed"` only after local validation genuinely passes. The hook fires on `completed`.
3. **Write the WHY, not the WHAT**, in commit message + PR body. The script and the diff carry the WHAT.
4. **Never trust your own recall** for the file list — you don't write one. The script derives `git status`/`git diff` itself; that's the structure enforcing the principle.
5. **Keep `merge_policy: "manual"` unless the founder has explicitly opted into auto-merge** for this project. The merge gate is a deliberate human checkpoint.
6. **When you start a new milestone** mid-session, overwrite `task-output.json` (not append — only the latest is authoritative) and set `status="draft"` until you finish.

## Schema evolution (versioning)

`schema_version` is mandatory precisely because this contract will grow. When you add fields (e.g. `deploy`, `release`, `linked_adrs`):

1. Create `schema/v{N+1}.schema.json` (don't edit v1 — old handoffs validate against their original schema).
2. Bump `schema_version` to `N+1` in new handoffs.
3. Document the migration here, in a `## Migrations` section.

The validator (`validate-task-output.mjs`) reads the version from the JSON and loads the matching schema, so a v1 handoff and a v3 handoff can coexist in history without one breaking the other.

## Migrations
(none yet — v1 is current.)
