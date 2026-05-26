# Agent Review Findings - 2026-05-26

Revision de seguridad y arquitectura aplicada como continuacion de los hallazgos anteriores.
Cubre el Bloque 1 (hardening sin dependencias nuevas) y el Bloque 2 (rate limiter Redis).

## Contexto

El MVP ya tenia flujo guest-first funcional, pago simulado, admin operativo, auditoria y CI.
Esta sesion se enfoca en reducir riesgo tecnico antes de produccion sin reescribir el proyecto.

Principio guia: no confiar en datos enviados desde el frontend para precio, stock, totales o
estado de orden. Toda la logica critica vive en server actions y se valida server-side.

## Bloque 1 — Hardening sin dependencias externas

### 1.1 Middleware Edge para rutas admin

Problema: las rutas `/admin/**` estaban protegidas solo a nivel de page/action con
`requireAdminAccess()`, que corre en Node.js. No existia una primera linea de defensa en la capa
de red que redirigiera antes de ejecutar el Server Component.

Aplicado en `middleware.ts` (raiz del proyecto):

- Edge Runtime (Web Crypto API, sin Node.js). Replica la verificacion HMAC-SHA256 del token de
  sesion admin usando `crypto.subtle`.
- Intercepta todas las rutas `/admin/**` excepto `/admin/login`.
- Usuarios sin sesion valida son redirigidos a `/admin/login?next=<path>`.
- `getSafeNextPath()` previene open redirects: solo acepta paths dentro de `/admin/`.
- Si `ADMIN_ACCESS_SECRET` no esta configurado, siempre redirige (fail secure).
- La verificacion Node.js en `requireAdminAccess()` sigue siendo la capa de seguridad real
  (defensa en profundidad). El middleware es primera linea de defensa y mejora UX.

### 1.2 Helpers duplicados centralizados

Problema: `formString`, `optionalFormString` y `firstValue` estaban copiados en 8+ archivos.
Cualquier cambio de comportamiento requeria editar multiples lugares.

Aplicado:

- `src/lib/form-utils.ts` — `formString`, `optionalFormString`, `optionalFormStringOrNull`.
- `src/lib/url-utils.ts` — `firstValue`, `allValues`.
- 9 archivos actualizados para importar desde los modulos centralizados:
  - `src/app/admin/login/actions.ts`
  - `src/app/admin/login/page.tsx`
  - `src/app/admin/orders/[orderNumber]/actions.ts`
  - `src/app/admin/orders/page.tsx`
  - `src/app/admin/products/actions.ts`
  - `src/app/admin/settings/actions.ts`
  - `src/app/cart/page.tsx`
  - `src/app/checkout/page.tsx`
  - `src/app/orders/[orderNumber]/page.tsx`
- Las funciones locales eliminadas en cada archivo.

### 1.3 Sufijo de numero de orden criptograficamente seguro

Problema: `buildOrderNumber` en `src/lib/checkout.ts` usaba `Math.random()` para el sufijo.
Math.random() es predecible y puede generar colisiones bajo carga concurrente.

Aplicado:

- Reemplazado `Math.random()` por `randomBytes(3).toString("hex").toUpperCase()` de `node:crypto`.
- 3 bytes → 6 caracteres hex → 16 millones de combinaciones, criptograficamente seguro.
- Formato del numero de orden: `CAP-20260526-A3F9C1`.

### 1.4 React.cache() en consulta de catalogo

Problema: `getCatalogProducts()` podia ejecutar multiples queries identicas a la DB si varios
Server Components la llamaban en el mismo render tree.

Aplicado:

- `findDbProducts` envuelta con `React.cache()` en `src/data/products.ts`.
- Deduplica la query dentro del mismo render tree (misma request).
- Cada nueva request obtiene datos frescos.

### 1.5 Ruta /design bloqueada en produccion

Problema: `/design` es una ruta interna para materializar la direccion visual. No debe ser
accesible en produccion publica.

Aplicado:

- `src/app/design/page.tsx` retorna `notFound()` si `NODE_ENV === "production"`.
- En desarrollo sigue siendo accesible normalmente.

### 1.6 Autocomplete en formularios de checkout

Problema: los campos de nombre, email y telefono en checkout no tenian el atributo `autoComplete`,
lo que dificultaba el autorellenado en navegadores moviles.

Aplicado:

- `CheckoutField` en `src/app/checkout/page.tsx` acepta prop `autoComplete`.
- `autoComplete="name"` en nombre, `autoComplete="email"` en email, `autoComplete="tel"` en telefono.

## Bloque 2 — Rate limiter con backend Redis (Upstash)

### Problema

El rate limiter en `src/lib/rate-limit.ts` usa un `Map` en memoria del proceso Node.js. En un
entorno serverless (Vercel) con multiples instancias en paralelo, cada instancia tiene su propio
contador. Un atacante puede rotar entre instancias y acumular mas intentos fallidos de los
permitidos.

### Solucion

Nuevo archivo `src/lib/rate-limit-redis.ts`:

- `AsyncRateLimiter`: interfaz async identica al limiter sincrono (check / registerFailure / reset).
- `createAsyncRateLimiter(options)`: factory que selecciona backend segun entorno:
  - Si `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` estan configuradas → Redis.
  - Si no → wrapper async sobre el limiter en memoria (comportamiento actual, funciona en dev
    y en produccion single-instance).
- `createAdminLoginRateLimiter()`: funcion pre-configurada con los parametros del login admin
  (5 intentos, ventana de 15 min, bloqueo de 15 min).
- Implementacion Redis usa la REST API de Upstash directamente con `fetch` nativo.
  No requiere dependencias nuevas.
- Claves Redis: `{key}:count` (INCR + EXPIRE) y `{key}:locked` (SET EX).
- Fail open en `check` si Redis no responde (permite el intento, no bloquea al usuario por
  error de infraestructura). Fail closed en `registerFailure` si Redis no responde (conservador).

`src/app/admin/login/actions.ts` actualizado:

- Importa `createAdminLoginRateLimiter` de `rate-limit-redis`.
- Llama con `await` a `check`, `registerFailure` y `reset`.
- Comportamiento identico al anterior sin Redis; escala en produccion con Redis.

`src/lib/rate-limit.ts` sin cambios (sincrono, en memoria, con pruebas unitarias existentes).

`.env.example` actualizado con instrucciones para configurar Upstash.

### Como activar Redis en produccion

1. Crear cuenta en https://upstash.com.
2. Crear base de datos Redis (Global o Regional segun preferencia).
3. Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` desde el panel REST API.
4. Agregar las variables en Vercel → Settings → Environment Variables.
5. Sin cambios adicionales en el codigo: el factory detecta las variables automaticamente.

## Pendiente

- Auth admin real con usuarios, roles y posiblemente MFA (reemplaza password temporal).
- Rate limiter Redis para stock alerts si el volumen lo justifica (actualmente en memoria, menos critico).
- CSP con dominios finales de mapas, pagos e imagenes.
- Bloque 3: Formatters centralizados y maquina de estados de orden explicita.
- Bloque 4: Busqueda en tiempo real (Route Handler + debounce Client Component).
