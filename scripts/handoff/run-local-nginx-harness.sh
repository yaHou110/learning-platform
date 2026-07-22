#!/usr/bin/env bash
#
# CP0.5 — localhost self-signed nginx harness (ADR-0017-era M7 prep).
#
# Stands up the committed nginx behavior (HSTS + security headers + rate-limit
# + /api/metrics localhost gating) in front of the standing docker-compose.prod
# stack, over a self-signed TLS cert on https://localhost:8443 — so the prod
# nginx.conf is exercised end-to-end before any real VPS exists. REUSES the prod
# compose stack on lp-network (do NOT run `compose down` first — leave the app
# serving on `app:3000` inside lp-network).
#
# Then runs assert-local-nginx.sh to assert: HSTS present, security headers
# present, /api/health + /api/ready proxy 200, /api/metrics 403 (proxied-allow
# rule denies from the host side) — i.e. the M7 §3/§4 posture, locally.
#
# Pre: the prod stack is up (`docker compose -f docker-compose.prod.yml up -d`).
# Pre: .tls-local/local.crt + local.key exist (gen-tls step below if missing).
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TLS_DIR="$REPO_ROOT/.tls-local"
NGINX_CONF="$TLS_DIR/nginx.local.conf"
PROXY_NAME="lp-local-nginx"
NGINX_IMG="nginx:1.27-alpine"

# --- 1. Gen self-signed cert if missing -------------------------------------
if [ ! -f "$TLS_DIR/local.crt" ] || [ ! -f "$TLS_DIR/local.key" ]; then
  echo "[harness] generating self-signed cert in $TLS_DIR ..."
  # Run openssl INSIDE a container so it doesn't trip Git-Bash MSYS path mangling
  # on the -subj argument (which broke the host openssl attempt earlier).
  docker run --rm -v "$TLS_DIR:/tls" --entrypoint /bin/sh "$NGINX_IMG" -c "
    apk add --no-cache openssl >/dev/null 2>&1
    openssl req -x509 -newkey rsa:2048 -nodes \
      -keyout /tls/local.key -out /tls/local.crt -days 825 \
      -subj '/C=US/ST=Local/L=Local/O=Learning Platform DEV/CN=localhost' \
      -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'
  "
  echo "[harness] cert generated."
fi

# --- 2. Remove any stale local proxy container -----------------------------
docker rm -f "$PROXY_NAME" >/dev/null 2>&1 || true

# --- 3. Run nginx on lp-network, fronting the app, TLS on 8443 -------------
echo "[harness] starting $PROXY_NAME on lp-network (https://localhost:8443) ..."
docker run -d --name "$PROXY_NAME" \
  --network lp-network \
  -p 8443:443 \
  -v "$NGINX_CONF:/etc/nginx/conf.d/default.conf:ro" \
  -v "$TLS_DIR:/etc/nginx/tls:ro" \
  "$NGINX_IMG" >/dev/null

# --- 4. nginx -t (syntax check the EXACT mounted config) -------------------
echo "[harness] nginx -t (syntax check of the LOCAL-adapted config) ..."
docker exec "$PROXY_NAME" nginx -t

# --- 5. Reload so default.conf is active -----------------------------------
docker exec "$PROXY_NAME" nginx -s reload >/dev/null 2>&1 || true

echo "[harness] proxy up. curl -k https://localhost:8443/api/health"
echo "[harness] now run: scripts/handoff/assert-local-nginx.sh"
