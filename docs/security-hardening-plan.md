# Security hardening plan

Fecha: 2026-05-21.

## Contexto

El MVP usa autenticacion admin temporal, carrito guest por cookie y pago mock mientras se define proveedor local. Esto es correcto para desarrollo, pero requiere controles antes de cualquier despliegue publico.

Existe una contrasena admin local temporal en `.env`. No debe versionarse y debe cambiarse antes de produccion.

## P0 antes de produccion

| Riesgo | Control recomendado |
| --- | --- |
| Fuerza bruta en login admin | Implementado en `codex/security-hardening-mvp`: rate limit por IP en server action de login. Mejorado 2026-05-26: rate limiter async con backend Redis (Upstash) para escalar en serverless multi-instancia; fallback en memoria si no hay credenciales. |
| Pago mock en produccion | Implementado en `codex/security-hardening-mvp`: bloqueo de `PAYMENT_PROVIDER=mock` cuando `NODE_ENV=production`, salvo runner E2E aislado con `ALLOW_MOCK_PAYMENT_IN_E2E=true`. |
| Orden publica adivinable | Implementado en `codex/order-access-token`: token guest aleatorio, hash en DB y `?token=` requerido para ver la orden pública. |
| Sesion admin con secretos debiles | Implementado parcialmente en `codex/security-hardening-mvp`: rechazo de credenciales debiles en produccion y cookie `SameSite=strict`. |
| Stock descontado en momento incorrecto | Con proveedor real, descontar solo con webhook verificado o usar reserva idempotente. |

## P1 hardening MVP

| Riesgo | Control recomendado |
| --- | --- |
| Headers de seguridad ausentes | Implementado en `codex/security-hardening-mvp`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` y HSTS en produccion. |
| Server actions invocables por POST | Validar origen y agregar rate limit en acciones costosas. |
| Cookie guest no firmada | Implementado en `codex/cart-cookie-hardening`: cookie guest firmada con HMAC y `secure` en produccion. |
| Inputs sin limites claros | Implementado parcialmente en `codex/security-hardening-mvp`: limites `.max()` en checkout. Pendiente formularios admin. |
| Fallback mock si DB falla | Implementado en `codex/catalog-production-fallback`: en produccion no se muestra inventario mock si DB falla. |
| Cambios admin sin auditoria | Implementado en `codex/vehicle-compatibility-structure`: `AdminAuditLog` para productos, stock, zonas, ordenes y avisos de stock. |
| Webhook futuro sin idempotencia | Agregar identificador unico de evento externo por proveedor. |
| Merge sin pruebas | Implementado en `codex/ci-docs-quality-gates`: GitHub Actions `quality` y `e2e`; pendiente activar branch ruleset en GitHub. |

## Orden sugerido de PRs

1. `codex/security-hardening-mvp`: bloquear pago mock en produccion, validar secretos admin, rate limit login y headers. En progreso/completado para revision.
2. `codex/order-access-token`: proteger pagina publica de orden con token guest. En progreso/completado para revision.
3. `codex/cart-cookie-hardening`: firmar cookie o migrar carrito guest a DB. En progreso/completado para revision.
4. `codex/admin-audit-log`: completado como parte de `codex/vehicle-compatibility-structure`.

## Aplicado 2026-05-26

| Mejora | Detalle |
| --- | --- |
| Middleware Edge admin | `middleware.ts` intercepta `/admin/**` en Edge Runtime con HMAC-SHA256 via Web Crypto API. Primera linea de defensa antes del Server Component. |
| Helpers centralizados | `src/lib/form-utils.ts` y `src/lib/url-utils.ts` eliminan duplicacion y reducen superficie de error. |
| Sufijo de orden seguro | `randomBytes(3)` reemplaza `Math.random()` en `buildOrderNumber`. |
| React.cache() | Deduplica queries DB dentro del render tree, reduce carga en DB. |
| /design bloqueada en produccion | `notFound()` si `NODE_ENV === "production"`. |
| Rate limiter Redis | `src/lib/rate-limit-redis.ts` con seleccion automatica de backend segun env vars. |

## Gates pendientes

- Reemplazar login admin temporal por auth con usuarios/roles antes de produccion.
- Mantener `PAYMENT_PROVIDER=mock` bloqueado en produccion y no activar ventas reales sin proveedor verificado.
- Implementar webhook real con firma e idempotencia antes de pagos reales.
- Revisar logs para evitar datos sensibles cuando se integren proveedores externos.
- Activar branch ruleset de `main` para exigir checks `quality` y `e2e`.

## Fuentes base

- Next.js Data Security: https://nextjs.org/docs/app/guides/data-security
- Next.js headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
