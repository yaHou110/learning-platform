# ============================================================================
# Invoke-TaskOutput.ps1 — the Git handoff runner (owns Git, owns state)
# ============================================================================
# Triggered by the .claude Stop hook when a milestone task-output.json is present
# and marked completed. Reads JSON *intent*, but verifies *state* — file list,
# verification (CI), and branch are derived from the live repo, never trusted
# from the JSON. Claude is architecturally blocked from mutating Git (see the
# PreToolUse hook in .claude/settings.json); this script is the sole Git author.
#
# The unifying principle (see .claude/state/TASK_OUTPUT.md):
#   JSON = intent. Repo + command output + CI = state.
#   The script verifies state and refuses to act on intent alone.
#   The harness prevents Claude from bypassing this.
#
# Non-mutating, side-effect-free preflight: pass -DryRun to validate the
# contract, print the derived file list / branch / PR plan, and exit before
# any publish action. Use this to sanity-check a handoff without pushing.
#
# Usage:
#   .\scripts\handoff\Invoke-TaskOutput.ps1            # full run (auto via hook)
#   .\scripts\handoff\Invoke-TaskOutput.ps1 -DryRun    # plan only, no git writes
#   .\scripts\handoff\Invoke-TaskOutput.ps1 -Path .\path\to\other.json
#
# Exit codes:
#   0  success (PR open, CI green, stopped before merge OR auto-merged)
#   2  soft no-op: handoff absent or not status=completed (normal mid-task stop)
#   3  contract failure: not gitignored / missing fields / schema invalid
#   4  verification failure: CI not green
#   5  git/gh operational failure
# ============================================================================

[CmdletBinding()]
param(
    [string]$Path = ".\.claude\state\task-output.json",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$PSCommandPath = $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Fail($code, $msg) {
    Write-Host $msg -ForegroundColor Red
    exit $code
}

# ============================================================================
# STAGE 0 — Guard: handoff absent or not completed? Soft no-op (exit 2).
# This is what makes the Stop hook cheap on every non-milestone Claude stop:
# most stops there is no JSON at all (Claude answered a question), so the hook
# exits here in <50ms. Only a real milestone completion produces a JSON with
# status=completed, and only then does the chain run.
# ============================================================================
if (-not (Test-Path $Path)) {
    # Not an error: just a normal Claude stop with no handoff pending.
    exit 2
}

$raw = Get-Content $Path -Raw
try {
    $task = $raw | ConvertFrom-Json
} catch {
    Fail 3 "task-output.json is not valid JSON: $($_.Exception.Message)"
}

if ($task.status -ne "completed") {
    # JSON present but not completed — Claude marked it draft/pending/in-progress.
    # Not the trigger condition. No-op.
    exit 2
}

Write-Host "=== TaskOutput handoff ===" -ForegroundColor Cyan
Write-Host "task:    $($task.task)" -ForegroundColor Gray
Write-Host "status:  $($task.status)" -ForegroundColor Gray
Write-Host "schema_version: $($task.schema_version)" -ForegroundColor Gray

# ============================================================================
# STAGE 1 — Contract: schema validation + gitignore self-check.
# Both are mandatory. A non-ignored handoff path is a sharp footgun in a long
# project: a stray handoff file gets committed, the script silently uses stale
# intent. The script refuses rather than proceed.
# ============================================================================
$schemaVersion = $task.schema_version
if (-not $schemaVersion) { Fail 3 "task-output.json missing required field: schema_version" }
$schemaPath = Join-Path $repoRoot ".claude\state\schema\v$schemaVersion.schema.json"
if (-not (Test-Path $schemaPath)) {
    Fail 3 "No schema for schema_version=$schemaVersion (expected $schemaPath). Refusing to act on an unknown contract."
}

# JSON Schema validation via the dotnet System.Text.Json schema validator is
# not present in stock PowerShell. We ship a parallel Node validator in
# scripts/handoff/validate-task-output.mjs which is the canonical validator
# (Ajv, draft-07). Call it here; it exits non-zero on any schema violation.
$validator = Join-Path $PSScriptRoot "validate-task-output.mjs"
if (Test-Path $validator) {
    Push-Location $repoRoot
    try {
        $resolve = Resolve-Path $Path
        & node $validator $resolve
        if ($LASTEXITCODE -ne 0) {
            Fail 3 "Schema validation failed (schema_version=$schemaVersion). Fix the handoff JSON; refusing to proceed."
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "WARN: validate-task-output.mjs not found; skipping structural validation." -ForegroundColor Yellow
}

# Required intent fields.
foreach ($f in @("commit_message", "pr_title", "pr_body", "merge_policy")) {
    if ($null -eq $task.$f -or "" -eq "$($task.$f)") {
        Fail 3 "task-output.json missing required field: $f"
    }
}

# merge_policy enforcement.
$mergePolicy = "$($task.merge_policy)"
if ($mergePolicy -notin @("manual", "auto-on-green")) {
    Fail 3 "merge_policy must be 'manual' or 'auto-on-green' (got '$mergePolicy')."
}

# Gitignore self-check: the handoff path MUST be ignored, else we could
# accidentally commit a stale handoff. git check-ignore exits 0 when ignored.
Push-Location $repoRoot
try {
    $ignored = & git check-ignore --quiet $Path 2>$null
    if ($LASTEXITCODE -ne 0) {
        $rel = Resolve-Path $Path -Relative
        Fail 3 "Handoff path '$rel' is NOT gitignored. Refusing: a handoff file committed to the repo is a sharp footgun. Add it to .gitignore, then re-run."
    }
} finally { Pop-Location }

# ============================================================================
# STAGE 2 — State: derive file list, branch from the live repo.
# JSON never carries file lists or branch names — those are STATE, and the
# script reads them from git. This is the second-AI principle made structural:
# the script never trusts Agent 1's recall of what changed.
# ============================================================================
Push-Location $repoRoot
try {
    Write-Host "`n--- working tree state ---" -ForegroundColor Yellow
    & git status --short
    if ($LASTEXITCODE -ne 0) { Fail 5 "git status failed." }

    # Show unstaged tracked changes (informational). Stage 4 runs `git add -A`
    # for the handoff commit, so a dirty working tree is INCLUDED by design —
    # the genuine protection against committing unintended change is the human
    # PR review surface (the diff --stat printed in Stage 4 and the GitHub PR
    # page), NOT a pre-commit refuse. Refusing here would contradict `git add -A`.
    $unstaged = & git diff --name-only
    if ($LASTEXITCODE -eq 0 -and $unstaged) {
        Write-Host "`nUnstaged tracked changes (will be staged + committed as part of this handoff):" -ForegroundColor Gray
        Write-Host $unstaged
    }

    # Branch: derive from pr_title kebab-case, or if already on a feat/ branch, reuse it.
    $currentBranch = (& git rev-parse --abbrev-ref HEAD).Trim()
    if ($LASTEXITCODE -ne 0) { Fail 5 "git rev-parse failed." }
    if ($currentBranch -eq "main") {
        $slug = ($task.pr_title -replace '[^A-Za-z0-9 ]', '' -replace '\s+', '-').ToLower().Trim('-')
        $branch = "feat/$slug"
        Write-Host "On main — creating branch: $branch" -ForegroundColor Gray
        if (-not $DryRun) {
            & git checkout -b $branch
            if ($LASTEXITCODE -ne 0) { Fail 5 "git checkout -b $branch failed." }
        }
    } else {
        $branch = $currentBranch
        Write-Host "Already on feature branch: $branch (reusing)" -ForegroundColor Gray
    }

    # Diff summary: what will be committed (the truth, printed for human review).
    Write-Host "`n--- diff --stat (staged set after add) ---" -ForegroundColor Yellow
} finally { Pop-Location }

# ============================================================================
# STAGE 3 — Plan point. In -DryRun we stop here, before any write.
# ============================================================================
if ($DryRun) {
    Write-Host "`n[DryRun] Would stage all changes, commit with:" -ForegroundColor Cyan
    Write-Host "  $($task.commit_message)"
    Write-Host "[DryRun] Push to $branch, open PR '$($task.pr_title)', wait CI, $($mergePolicy -eq 'auto-on-green' ? 'auto-merge' : 'stop before merge')." -ForegroundColor Cyan
    Write-Host "[DryRun] No git writes performed." -ForegroundColor Green
    exit 0
}

# ============================================================================
# STAGE 4 — Publish: stage, commit, push, open PR.
# ============================================================================
Push-Location $repoRoot
try {
    & git add -A
    if ($LASTEXITCODE -ne 0) { Fail 5 "git add -A failed." }

    & git --no-pager diff --cached --stat
    if ($LASTEXITCODE -ne 0) { Fail 5 "git diff --cached --stat failed." }

    # Commit message from JSON (intent — Agent 1 owns the WHY; this script does
    # NOT derive the commit message from the diff, by design decision: conventional-
    # commit type and scope are intent, and diff-derived messages lose them).
    & git commit -m "$($task.commit_message)"
    if ($LASTEXITCODE -ne 0) { Fail 5 "git commit failed (possibly nothing staged — check --stat above)." }

    Write-Host "Commit created." -ForegroundColor Green

    # Push (set upstream). `-u` so subsequent gh pr create knows the head.
    & git push -u origin $branch
    if ($LASTEXITCODE -ne 0) { Fail 5 "git push -u origin $branch failed." }

    Write-Host "Pushed $branch." -ForegroundColor Green

    # Build PR body: JSON body + closes issues + verification summary.
    $body = "$($task.pr_body)"
    if ($task.closes_issues) {
        $issues = ($task.closes_issues | ForEach-Object { "$_" }) -join " "
        $body = "$body`n`nCloses $issues"
    }
    if ($task.labels) {
        $labels = ($task.labels | ForEach-Object { $_ }) -join ","
    } else {
        $labels = $null
    }

    # Try to create the PR. If a PR already exists for this head branch, gh pr
    # create exits non-zero — detect that case and UPDATE the existing PR
    # (title + body) instead of failing, so re-running the chain amends the
    # open PR rather than aborting.
    $prUrl = $null
    $prArgs = @("pr", "create", "--base", "main", "--head", $branch, "--title", "$($task.pr_title)", "--body", $body)
    $createOut = & gh @prArgs 2>&1
    if ($LASTEXITCODE -eq 0) {
        $prUrl = "$createOut".Trim()
        Write-Host "PR opened: $prUrl" -ForegroundColor Green
    } else {
        # Likely "already exists" — locate the open PR for this head and update it.
        $prNum = (& gh pr list --head $branch --state open --json number --jq '.[0].number' 2>$null)
        if ($LASTEXITCODE -eq 0 -and $prNum -and $prNum -ne "null") {
            $prUrl = (& gh pr view $prNum --json url --jq '.url' 2>$null).Trim()
            Write-Host "PR already exists (#$prNum) — updating: $prUrl" -ForegroundColor Gray
            & gh pr edit $prNum --title "$($task.pr_title)" --body $body 2>$null | Out-Null
        } else {
            Write-Host $createOut -ForegroundColor Red
            Fail 5 "gh pr create failed and no existing open PR found for head '$branch'."
        }
    }

    # If create succeeded but didn't print a URL (older gh), query it.
    if (-not $prUrl -or -not ($prUrl -match '^https?://')) {
        $viewOut = & gh pr view $branch --json url --jq '.url' 2>$null
        if ($LASTEXITCODE -eq 0 -and $viewOut) { $prUrl = "$viewOut".Trim() }
    }
    if (-not $prUrl -or -not ($prUrl -match '^https?://')) {
        Fail 5 "PR operation completed but URL could not be captured. Check GitHub for the open PR on branch '$branch'."
    }
    Write-Host "PR URL: $prUrl" -ForegroundColor Green
    if ($labels) {
        # gh pr create --label is unreliable across gh versions; add after creation.
        & gh pr edit $prUrl --add-label $labels 2>$null | Out-Null
    }
} finally { Pop-Location }

# ============================================================================
# STAGE 5 — Verify state: wait for required CI checks to go green.
# Per the confirmed policy: CI-only. We do NOT re-run tests locally.
#
# Semantics robust to path-filtered workflows (e.g. security-audit.yml only runs
# when pnpm-lock.yaml/package.json change):
#   - gh pr checks --required returns the required-set if branch protection is
#     configured. If so, wait on exactly those.
#   - If no required-set configured, fall back to ALL reported checks.
#   - A check that never reports (path filter excluded it) is non-blocking: it
#     simply isn't in either set, so it can't block a green.
#   - A NEUTRAL/pending check blocks until it resolves to SUCCESS/SKIPPED.
#																		.
# CronCreate/Monitor tools are for this Claude session only; the script must be
# self-contained, so we poll on a schedule directly. (The off-:00 nudge from
# session tooling doesn't apply to a CLI script — humans only run this once
# per milestone.)
# ============================================================================
Write-Host "`n--- waiting for required CI checks ---" -ForegroundColor Yellow
Push-Location $repoRoot
try {
    $timeoutMin = 30
    $deadline = (Get-Date).AddMinutes($timeoutMin)
    $pollSec = 20
    $lastSeen = ""

    # Determine the set we must wait on. Try required first.
    $required = & gh pr checks --required 2>$null
    $useRequired = ($LASTEXITCODE -eq 0)
    if (-not $useRequired) {
        Write-Host "branch protection required-set unavailable — waiting on ALL reported checks." -ForegroundColor Gray
    } else {
        Write-Host "waiting on required checks: $($required | Measure-Object | % Count) listed" -ForegroundColor Gray
    }

    do {
        if ($useRequired) {
            $checks = & gh pr checks --required --json bucket,name 2>$null | ConvertFrom-Json
        } else {
            $checks = & gh pr checks --json bucket,name 2>$null | ConvertFrom-Json
        }
        if (-not $checks) { $checks = @() }

        # bucket values: pass|fail|pending|skipping. pending OR missing-report → keep waiting.
        $pending = $checks | Where-Object { $_.bucket -eq "pending" }
        $fails = $checks | Where-Object { $_.bucket -eq "fail" }
        $passes = $checks | Where-Object { $_.bucket -eq "pass" }
        $summary = "pass=$($passes.Count) fail=$($fails.Count) pending=$($pending.Count)"
        if ($summary -ne $lastSeen) { Write-Host "  $summary"; $lastSeen = $summary }

        if ($fails.Count -gt 0) {
            $names = ($fails | ForEach-Object { $_.name }) -join ", "
            Fail 4 "CI checks FAILED: $names. Fix and re-run; PR is open at $prUrl."
        }
        if ($pending.Count -eq 0 -and $checks.Count -gt 0) {
            Write-Host "All waited checks green." -ForegroundColor Green
            break
        }
        # Edge: no checks reported at all yet (just pushed) — keep waiting the first cycle.
        Start-Sleep -Seconds $pollSec
    } while ((Get-Date) -lt $deadline)

    if ((Get-Date) -ge $deadline) {
        Fail 4 "Timed out after ${timeoutMin}m waiting for CI. PR is open at $prUrl — inspect manually and re-run if re-merge is needed."
    }
} finally { Pop-Location }

# ============================================================================
# STAGE 6 — Merge gate. Manual by default.
# merge_policy=manual (default) → STOP here, print the PR for a human to merge.
# merge_policy=auto-on-green    → gh pr merge --squash --auto.
# The first-AI caveat we agreed with: do NOT remove the last human gate unless
# the JSON explicitly opted in.
# ============================================================================
if ($mergePolicy -eq "manual") {
    Write-Host "`n=== CI green. Stopping before merge (manual). ===" -ForegroundColor Cyan
    Write-Host "PR:  $prUrl" -ForegroundColor White
    Write-Host "To merge:  gh pr merge --squash --delete-branch $prUrl" -ForegroundColor Gray
    Write-Host "To add the next milestone, mark task-output.json status='draft' or delete it." -ForegroundColor Gray
    exit 0
}

if ($mergePolicy -eq "auto-on-green") {
    Write-Host "`nmerge_policy=auto-on-green — merging via squashed auto-merge." -ForegroundColor Cyan
    Push-Location $repoRoot
    try {
        & gh pr merge --squash --delete-branch $prUrl
        if ($LASTEXITCODE -ne 0) { Fail 5 "gh pr merge failed for $prUrl." }
    } finally { Pop-Location }
    Write-Host "Merged and branch deleted." -ForegroundColor Green
    Write-Host "PR: $prUrl" -ForegroundColor White
    exit 0
}

# Unreachable: merge_policy was validated in Stage 1.
Fail 3 "Unknown merge_policy '$mergePolicy' reached merge stage."
