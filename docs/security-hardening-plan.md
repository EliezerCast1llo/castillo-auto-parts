# Security hardening plan

Fecha: 2026-05-20.

## Contexto

El MVP usa autenticacion admin temporal, carrito guest por cookie y pago mock mientras se define proveedor local. Esto es correcto para desarrollo, pero requiere controles antes de cualquier despliegue publico.

Existe una contrasena admin local temporal en `.env`. No debe versionarse y debe cambiarse antes de produccion.

## P0 antes de produccion

| Riesgo | Control recomendado |
| --- | --- |
| Fuerza bruta en login admin | Implementado en `codex/security-hardening-mvp`: rate limit por IP en server action de login. |
| Pago mock en produccion | Implementado en `codex/security-hardening-mvp`: bloqueo de `PAYMENT_PROVIDER=mock` cuando `NODE_ENV=production`. |
| Orden publica adivinable | Implementado en `codex/order-access-token`: token guest aleatorio, hash en DB y `?token=` requerido para ver la orden pública. |
| Sesion admin con secretos debiles | Implementado parcialmente en `codex/security-hardening-mvp`: rechazo de credenciales debiles en produccion y cookie `SameSite=strict`. |
| Stock descontado en momento incorrecto | Con proveedor real, descontar solo con webhook verificado o usar reserva idempotente. |

## P1 hardening MVP

| Riesgo | Control recomendado |
| --- | --- |
| Headers de seguridad ausentes | Implementado en `codex/security-hardening-mvp`: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` y HSTS en produccion. |
| Server actions invocables por POST | Validar origen y agregar rate limit en acciones costosas. |
| Cookie guest no firmada | Firmar cookie o mover carrito guest a DB con token hasheado; usar `secure` en produccion. |
| Inputs sin limites claros | Implementado parcialmente en `codex/security-hardening-mvp`: limites `.max()` en checkout. Pendiente formularios admin. |
| Fallback mock si DB falla | Fallar cerrado en produccion o mostrar mantenimiento. |
| Cambios admin sin auditoria | Agregar `AdminAuditLog` para productos, stock, zonas y ordenes. |
| Webhook futuro sin idempotencia | Agregar identificador unico de evento externo por proveedor. |

## Orden sugerido de PRs

1. `codex/security-hardening-mvp`: bloquear pago mock en produccion, validar secretos admin, rate limit login y headers. En progreso/completado para revision.
2. `codex/order-access-token`: proteger pagina publica de orden con token guest. En progreso/completado para revision.
3. `codex/cart-cookie-hardening`: firmar cookie o migrar carrito guest a DB.
4. `codex/admin-audit-log`: registrar cambios admin relevantes.

## Fuentes base

- Next.js Data Security: https://nextjs.org/docs/app/guides/data-security
- Next.js headers: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Authorization Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
