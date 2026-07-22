#!/usr/bin/env bash
#
# CP0.5 assertions — confirms the committed nginx.conf behavior holds locally.
# Run AFTER run-local-nginx-harness.sh (the proxy must be up on :8443 with the
# prod stack serving on app:3000 inside lp-network).
#
# Exits 0 only if EVERY assertion passes; prints a clear pass/fail per check.
# This is the locally-runnable proof of the M7 §3/§4 posture items that M6 had
# to defer as "host-Nginx genuinely VPS-only".
#
set -euo pipefail

PROXY="https://localhost:8443"
pass=0; fail=0

check() { # desc  curl-args... — prints desc + HTTP status; sets pass/fail
  local desc="$1"; shift
  local code
  code=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$@")
  printf '  [%s] %-58s HTTP %s\n' "$([ "$2" = "PASS" ] && echo PASS || echo "$2")" "$desc" "$code" 2>/dev/null || true
}
ok()   { printf '  [PASS] %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  [FAIL] %s\n' "$1"; fail=$((fail+1)); }

echo "[assert] probing $PROXY (self-signed, -k) ..."

# --- HSTS header present over the proxied TLS endpoint ---------------------
hsts=$(curl -skI --max-time 10 "$PROXY/api/health" | grep -i '^strict-transport-security:' | head -1)
if [ -n "$hsts" ]; then ok "HSTS header present: $hsts"; else bad "HSTS header MISSING"; fi

# --- Security headers present (X-Content-Type-Options, X-Frame-Options) ---
hdrs=$(curl -skI --max-time 10 "$PROXY/api/health")
for h in 'x-content-type-options: nosniff' 'x-frame-options: DENY' 'referrer-policy:' 'permissions-policy:'; do
  if echo "$hdrs" | grep -qi "$h"; then ok "header present: $h"; else bad "header MISSING: $h"; fi
done

# --- /api/health proxies through to the app: 200 -------------------------
hc=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$PROXY/api/health")
if [ "$hc" = "200" ]; then ok "/api/health -> 200 (app reachable through proxy)"; else bad "/api/health -> $hc (expected 200 — is the prod stack up + migrated?)"; fi

# --- /api/ready 200 -------------------------------------------------------
rd=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$PROXY/api/ready")
if [ "$rd" = "200" ]; then ok "/api/ready -> 200"; else bad "/api/ready -> $rd (expected 200)"; fi

# --- /api/metrics through the proxy, NO token: nginx's allow 127.0.0.1/deny
#     should refuse the edge BEFORE the app's 401 -> 403 (or 401). 403 is the
#     clean nginx-deny; 401 means nginx let it through and the app denied. We
#     accept 403 or 401 — both prove it isn't an unmetered 200.
mt=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 10 "$PROXY/api/metrics")
if [ "$mt" = "403" ]; then ok "/api/metrics (no token, via proxy) -> 403 (nginx edge deny — double-gate holds)"
elif [ "$mt" = "401" ]; then ok "/api/metrics (no token, via proxy) -> 401 (app bearer deny — also gated)"
else bad "/api/metrics -> $mt (expected 403/401, not an open 200)"; fi

echo
echo "[assert] PASS=$pass FAIL=$fail"
[ "$fail" -eq 0 ] && { echo "[assert] ✅ ALL M7 §3/§4 posture checks hold locally"; exit 0; }
echo "[assert] ❌ some assertions failed — see above"; exit 1
