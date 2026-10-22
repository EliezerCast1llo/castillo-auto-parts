#!/usr/bin/env bash
#
# Load test local de resiliencia. Corre SOLO contra tu propio servidor local.
# NUNCA apuntar a producción ni a servicios de terceros.
#
# Uso:
#   BASE_URL=http://localhost:3456 ./scripts/loadtest.sh
#
# Requiere el servidor levantado (npm run dev / npm run start) en BASE_URL.
# Usa autocannon vía npx (no se agrega como dependencia).

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
DURATION="${DURATION:-12}"
CONNECTIONS="${CONNECTIONS:-20}"

echo "== Flood a /api/search (rate limit 60/min por IP) =="
echo "   Se espera: ~60 respuestas 2xx y el resto 429 (limiter recorta el flood)."
npx --yes autocannon -c "$CONNECTIONS" -d "$DURATION" "${BASE_URL}/api/search?q=bujia"

echo
echo "== Verificación del header Retry-After en 429 =="
for _ in $(seq 1 65); do curl -s -o /dev/null "${BASE_URL}/api/search?q=abc"; done
curl -s -D - -o /dev/null "${BASE_URL}/api/search?q=abc" | grep -iE "HTTP/|retry-after"
