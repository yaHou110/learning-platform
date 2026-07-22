# block-mutating-git.ps1 — enforces "Claude never touches mutating Git"
# ============================================================================
# Wired as the PreToolUse(Bash) hook (.claude/settings.json). The harness runs
# this BEFORE any Bash tool call. It inspects the proposed command and refuses
# (exit 2, non-zero) mutating git/github operations, so Claude physically
# cannot bypass the task-output.json handoff model under context pressure.
#
# WHY a hook and not a CLAUDE.md instruction: instructions are advisory. The
# model can ignore them when context is long or pressure is high. A hook is
# run by the harness and cannot be skipped by the model. This makes the
# division of labor (Claude owns code+intent; the handoff script owns Git) a
# structural property rather than an aspiration.
#
# Read git ops (status/diff/log/show/blame/branch -v) are ALLOWED through —
# Claude can still inspect state; only state mutations are refused.
#
# Input: $args[0] is the JSON tool_input payload with a "command" field, passed
# by the harness when the Stop/PreToolUse hook fires. We JSON-decode and inspect.
# Exit codes: 0 = allow, 2 = deny (shown to Claude as a hook block).
# ============================================================================

$ErrorActionPreference = "Stop"

# The harness passes tool_input as $1 (we quoted "$tool_input" in settings).
$raw = $args[0]
if (-not $raw) { exit 0 }   # nothing to inspect → allow

$cmd = $null
try {
    $obj = $raw | ConvertFrom-Json
    $cmd = $obj.command
} catch {
    # Malformed payload → don't block (avoid false denials); let the real tool reject.
    exit 0
}
if (-not $cmd) { exit 0 }

# Mutating git subcommands that must not run from Claude.
# `git <sub>` parsed loosely: first token git, second is the subcommand.
# We also block `gh pr create|merge|edit|close|ready|review` (mutating PR ops)
# and `gh pr merge` explicitly; `gh pr view|list|checks` are reads and allowed.
$mutatingGit = @(
    "commit","push","merge","rebase","reset","revert","cherry-pick",
    "switch","checkout","restore","stash","tag","am","init","update-ref",
    "rm","mv","apply","clean","bisect","worktree"
)
# gh subcommands that mutate; pr checks|view|list are reads.
$mutatingGh = @{
    "pr"      = @("create","merge","edit","close","ready","review","reopen","lock","unlock")
    "repo"    = @("create","delete","rename","edit","sync")
    "label"   = @("create","delete","edit")
    "release" = @("create","delete","edit","upload","download")
    "workflow"= @("run","disable","enable")
    "run"     = @("rerun","cancel")
}

# Normalize for matching: lowercase, collapse whitespace.
$c = ($cmd -replace '\s+',' ').Trim().ToLower()
$tokens = $c -split ' '
if ($tokens.Count -lt 1) { exit 0 }

if ($tokens[0] -eq "git") {
    $sub = if ($tokens.Count -ge 2) { $tokens[1] } else { "" }
    if ($mutatingGit -contains $sub) {
        Write-Host "[git-block] Denied: '$sub' is a mutating Git op. Handoffs go via .claude/state/task-output.json (status=completed) → the Stop hook runs scripts/handoff/Invoke-TaskOutput.ps1, which owns Git. Read ops (status/diff/log) are allowed." -ForegroundColor Red
        exit 2
    }
    # `git add` and `git commit` variants also caught above; allow `git config --get`, `git remote`, `git ls-files`, etc.
    exit 0
}

if ($tokens[0] -eq "gh") {
    $sub = if ($tokens.Count -ge 2) { $tokens[1] } else { "" }
    if ($mutatingGh.ContainsKey($sub)) {
        $inner = if ($tokens.Count -ge 3) { $tokens[2] } else { "" }
        $denyList = $mutatingGh[$sub]
        if ($denyList -contains $inner) {
            Write-Host "[git-block] Denied: 'gh $sub $inner' is a mutating GitHub op. PR create/merge is owned by the handoff script." -ForegroundColor Red
            exit 2
        }
    }
    exit 0
}

# Anything else (pnpm, node, npm, system tools): allow. Git-blockhook is scoped
# to git/gh only; broad denial would break the entire tool surface.
exit 0
