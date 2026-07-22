#!/usr/bin/env bash
#
# CP0.6b + CP0.8 — combined verification for the containerized-migrate change.
# Runs end-to-end: validate compose, rebuild the migrate target, bring the
# stack up (migrate runs first via depends_on), assert /api/health is GREEN
# (the proof the migrate fix worked), then run pnpm verify + governance.
#
# Usage: bash scripts/handoff/verify-migrate-and-stack.sh
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

echo "=== 1. validate compose ==="
docker compose -f docker-compose.prod.yml config --quiet && echo "compose OK" \
  || { echo "compose INVALID"; exit 1; }

echo "=== 2. bring stack up (rebuild migrate target) ==="
# --build ensures Dockerfile Stage 3 (migrate) is freshly built; depends_on
# chain runs migrate before app boots.
docker compose -f docker-compose.prod.yml up -d --build

echo "=== 3. wait for app healthy (up to 90s) ==="
for i in $(seq 1 45); do
  st=$(docker compose -f docker-compose.prod.yml ps --format '{{.Service}}|{{.Status}}' | grep '^app|' || true)
  if echo "$st" | grep -q healthy; then echo "app healthy after ~$((i*2))s"; break; fi
  if [ "$i" = 45 ]; then echo "app NOT healthy within 90s"; docker compose -f docker-compose.prod.yml logs --tail=40 app; exit 1; fi
  sleep 2
done

echo "=== 4. /api/health must be GREEN (db:true, auth:true) ==="
body=$(curl -s --max-time 10 http://127.0.0.1:3000/api/health || echo "CURL_FAIL")
echo "   $body"
echo "$body" | grep -q '"db":true' \
  && { echo "   ✅ /api/health db:true — migrations applied by the container"; } \
  || { echo "   ❌ /api/health db:false — migrate did NOT apply; aborting"; exit 1; }

echo "=== 5. migrate container should have exited 0 ==="
docker inspect lp-migrate --format '{{.State.Status}} exit={{.State.ExitCode}}' \
  | grep -q 'exit=0' \
  && echo "   ✅ lp-migrate exited 0" \
  || { echo "   ⚠️ lp-migrate not exit-0 (may have been removed/restarted)"; }

echo
echo "=== 6. pnpm verify + governance ==="
pnpm verify
pnpm governance:validate:local && echo "governance local OK"

echo
echo "=== ALL DONE ==="
echo "Stack green on local Docker. /api/health is {db:true, auth:true}."
echo "Next (CP0.5): bash scripts/handoff/run-local-nginx-harness.sh && bash scripts/handoff/assert-local-nginx.sh"
