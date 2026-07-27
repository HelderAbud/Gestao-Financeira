#!/usr/bin/env bash
set -euo pipefail
ROOT="/mnt/c/Users/Pessoal/Desktop/Gestão Financeira/hh-financeiro-v6"
OUT="$ROOT/docs/screenshots"
cd "$ROOT"
docker compose up -d
docker update --restart unless-stopped \
  hh-financeiro-v6-db-1 hh-financeiro-v6-api-1 hh-financeiro-v6-web-1 >/dev/null || true

ok=0
for i in $(seq 1 45); do
  api=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8090/actuator/health || echo 000)
  web=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ || echo 000)
  echo "try=$i api=$api web=$web"
  if [ "$api" = "200" ] && [ "$web" = "200" ]; then
    ok=1
    break
  fi
  sleep 2
done
if [ "$ok" != "1" ]; then
  echo "stack not healthy" >&2
  docker compose ps
  docker logs hh-financeiro-v6-api-1 2>&1 | tail -40
  exit 1
fi

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -e HH_OUT=/out \
  -e HH_WEB_URL=http://host.docker.internal:3000 \
  -e HH_API_URL=http://host.docker.internal:8090 \
  -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  -v "$OUT:/out" \
  -v "$OUT/_pw/capture.mjs:/work/capture.mjs:ro" \
  -w /work \
  mcr.microsoft.com/playwright:v1.54.2-jammy \
  bash -lc 'npm init -y >/dev/null && npm install playwright@1.54.2 --no-fund --no-audit && node capture.mjs'

ls -la "$OUT"/landing.png "$OUT"/dashboard.png
