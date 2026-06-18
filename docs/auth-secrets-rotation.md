# Auth Secrets Rotation

Fecha: 2026-06-12.

Este documento define como generar, guardar, rotar y verificar secretos de autenticacion para Castillo Auto Parts. Aplica a ambientes locales, preview y produccion.

## Secretos cubiertos

| Variable | Uso | Criticidad | Impacto si rota |
| --- | --- | --- | --- |
| `AUTH_SECRET` | Secreto principal de Auth.js v5 para sesiones JWT/cookies de clientes. | Alta | Puede cerrar sesiones activas de clientes si se reemplaza sin ventana de compatibilidad. |
| `NEXTAUTH_SECRET` | Alias legado compatible con NextAuth. Usar solo si el hosting/proyecto aun lo tiene configurado. | Alta | Igual que `AUTH_SECRET`. |
| `ADMIN_ACCESS_SECRET` | Firma de tokens/cookies del panel admin. | Alta | Cierra sesiones admin activas. |
| `GUEST_CART_SECRET` | Firma de carrito guest. | Media | Puede invalidar carritos guest existentes. |
| `UPSTASH_REDIS_REST_TOKEN` | Rate limiting distribuido. | Alta | Sin Redis en produccion, el arranque debe fallar para no degradar seguridad. |
| `GOOGLE_CLIENT_SECRET` | OAuth de Google. | Alta | Afecta login con Google hasta actualizar el proveedor y el deploy. |

## Regla de origen

- Produccion y preview deben guardar secretos en el proveedor de hosting, por ejemplo Vercel Environment Variables.
- No se deben commitear secretos en `.env`, docs, screenshots, issues ni PRs.
- Localmente se usa `.env.local`; `.env.example` solo documenta nombres y placeholders.
- Para Auth.js v5, `AUTH_SECRET` es el nombre preferido. `NEXTAUTH_SECRET` queda permitido como alias legado durante la migracion.
- Produccion debe usar un secreto de al menos 32 caracteres y sin placeholders como `replace-with`.

## Generacion

Comando recomendado:

```bash
openssl rand -base64 32
```

Alternativa Auth.js:

```bash
npx auth secret
```

Guardar el resultado directamente en el administrador de variables del ambiente correspondiente.

## Rotacion programada

1. Crear un secreto nuevo para el ambiente objetivo.
2. Agregarlo primero en preview y desplegar.
3. Correr smoke tests de autenticacion:
   - registro cliente;
   - login cliente con credenciales;
   - logout;
   - proteccion de `/account`;
   - login admin;
   - acceso a `/admin/orders`.
4. Repetir en produccion durante una ventana de bajo trafico.
5. Comunicar que las sesiones activas podrian cerrarse si no hay compatibilidad temporal de secretos.
6. Eliminar el secreto anterior cuando la ventana de compatibilidad termine.

## Rotacion de emergencia

Usar este flujo si hay exposicion real o sospechada:

1. Revocar o reemplazar inmediatamente el secreto comprometido en el proveedor externo si aplica.
2. Generar un secreto nuevo.
3. Actualizar variables de produccion.
4. Forzar redeploy.
5. Validar login cliente y admin.
6. Revisar logs de auth, admin y rate limit.
7. Documentar el incidente y la hora exacta de rotacion.

## Compatibilidad de sesiones

Auth.js soporta multiples secretos mediante configuracion explicita o variables de entorno compatibles. Antes de usar rotacion sin cerrar sesiones, probarla en una rama dedicada y confirmar que:

- las sesiones existentes siguen leyendo con el secreto anterior;
- las sesiones nuevas se firman con el secreto nuevo;
- `npm run test:e2e -- tests/e2e/auth-account.spec.ts` queda en verde.

Si no se valida compatibilidad, asumir que rotar `AUTH_SECRET`/`NEXTAUTH_SECRET` cierra sesiones activas.

## Checklist post-rotacion

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e -- tests/e2e/auth-account.spec.ts`
- Login cliente probado manualmente.
- Login admin probado manualmente.
- Checkout guest probado si se roto `GUEST_CART_SECRET`.
- No hay errores `MissingSecret`, `JWTSessionError` o `UntrustedHost` en logs.

## Plan de actualizacion de Auth.js

- Mantener `next-auth` con version exacta en `package.json`.
- Revisar changelog/advisories antes de subir de version.
- Hacer upgrades de Auth.js en rama separada.
- Correr unit tests, E2E de auth y smoke manual antes de merge.
- No combinar upgrade de Auth.js con cambios de pagos, inventario, DTE o admin.
