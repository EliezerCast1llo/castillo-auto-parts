# Reporte de resiliencia / load test (local)

Fase 3 del plan de seguridad. **Alcance: solo local** (`localhost`, DB propia en
`:5433`). No se lanzó tráfico contra producción, Railway, Wompi, R2, Resend ni
Google. Reproducible con `scripts/loadtest.sh`.

## Entorno

- Next.js dev server (`npm run dev`), Postgres local.
- Sin Redis configurado → rate limiter en memoria (por-proceso). En Railway
  single-instance el comportamiento es equivalente.
- Herramienta: `autocannon` vía `npx` (no agregado como dependencia).
- **Caveat**: números de latencia/throughput son de *dev mode* (con overhead de
  compilación/HMR), sirven para comparar comportamiento, no como capacidad de
  producción.

## Resultado principal — rate limit corta el flood

Flood a `GET /api/search?q=bujia`, 20 conexiones, 12 s (límite: 60/min por IP):

| Métrica | Valor |
|---|---|
| Respuestas 2xx | 58 |
| Respuestas 429 | 1315 |
| Total solicitudes | ~1373 en 12 s |
| Latencia media | 173 ms (p99 410 ms) |
| Header en 429 | `Retry-After: 32` |

El limiter dejó pasar ~60 solicitudes (la ventana) y recortó **~96%** del flood
con 429, sin caerse ni degradar la latencia del resto. Confirma que el limiter
por-IP protege el endpoint y responde con `Retry-After` correcto.

## Cambios de hardening validados (PR #68)

- **Fail-open de Redis eliminado**: ante caída de Redis en caliente, `check` y
  `registerFailure` caen a un limiter en memoria en vez de dejar pasar todo.
  Cubierto por test unitario (`rate-limit-redis.test.ts`).
- **Endpoints antes sin límite, ahora con rate limit por IP**:
  - `POST /api/webhooks/wompi` — 120/min, antes de verificar firma.
  - `POST /api/admin/upload-image`, `DELETE /api/admin/delete-image` — 30/min, antes de auth.
- **CSP** configurable con `CSP_ENFORCE` (default report-only).
- **Secretos**: `GUEST_CART_SECRET` ya no reusa `ADMIN_ACCESS_SECRET` en producción.

## Observaciones / siguientes pasos

- El limiter en memoria es por-proceso: en un deploy multi-instancia solo Redis
  coordina el conteo global. Mantener `UPSTASH_*` en producción (ya es obligatorio
  por defecto salvo `ALLOW_IN_MEMORY_RATE_LIMIT=true`).
- Pool de Prisma sin `connection_limit` explícito: para un load test de escritura
  (checkout) medir agotamiento del pool con un script dedicado antes de subir
  `connection_limit`.
- Baseline de páginas SSR (home, catálogo) pendiente contra un build de producción
  (`npm run build && npm run start`) para números representativos.
