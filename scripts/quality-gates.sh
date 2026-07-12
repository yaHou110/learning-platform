#!/usr/bin/env bash
# quality-gates.sh — Run all mandatory quality gates (ENGINEERING_PROTOCOL §6)
# Usage: ./scripts/quality-gates.sh
set -euo pipefail

echo "=== Quality Gates ==="

run_gate() {
  local name="$1"
  shift
  echo ""
  echo "--- ${name} ---"
  "$@"
  echo "PASSED: ${name}"
}

run_gate "lint"      pnpm lint
run_gate "typecheck" pnpm typecheck
run_gate "test"      pnpm test
run_gate "build"     pnpm build

echo ""
echo "=== All quality gates passed ==="
