# quality-gates.ps1 — Run all mandatory quality gates (ENGINEERING_PROTOCOL §6)
# Usage: .\scripts\quality-gates.ps1
# Exit code: 0 if all pass, 1 on first failure

$ErrorActionPreference = "Stop"

$gates = @(
    @{ Name = "lint";      Command = "pnpm lint" },
    @{ Name = "typecheck"; Command = "pnpm typecheck" },
    @{ Name = "test";      Command = "pnpm test" },
    @{ Name = "build";     Command = "pnpm build" }
)

Write-Host "=== Quality Gates ===" -ForegroundColor Cyan

foreach ($gate in $gates) {
    Write-Host "`n--- $($gate.Name) ---" -ForegroundColor Yellow
    cmd /c $gate.Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nFAILED: $($gate.Name) (exit $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
    Write-Host "PASSED: $($gate.Name)" -ForegroundColor Green
}

Write-Host "`n=== All quality gates passed ===" -ForegroundColor Cyan
exit 0
