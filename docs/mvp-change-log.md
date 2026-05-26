# MVP Change Log

Fecha de creacion: 2026-05-21.

Este documento resume cambios funcionales y tecnicos importantes. Para detalle historico por fase, revisar los documentos `docs/phase-*`.

## Estado Base Actual

El MVP esta orientado a una tienda guest-first de repuestos automotrices para El Salvador, con pago web simulado, inventario propio inicial, retiro en bodega, envio local y admin operativo.

## Cambios Implementados Por Area

### Catalogo Y Producto

- Catalogo en `/catalog` con busqueda, filtros y query params compartibles.
- Detalle de producto en `/product/[slug]`.
- Compatibilidad vehicular estructurada por marca, modelo, anio y notas.
- Stock publico en espanol: disponible, ultimas unidades, no disponible.
- Fallback mock solo permitido fuera de produccion.

### Carrito

- Carrito guest por cookie.
- Cookie guest firmada con HMAC.
- Cantidades normalizadas y limite por linea.
- Stepper editable con botones menos/mas.
- Validacion de stock antes de continuar.

### Checkout Y Ordenes

- Checkout guest obligatorio desde MVP.
- Retiro en bodega no solicita campos de entrega a domicilio.
- Envio local solicita direccion, notas y coordenadas.
- Mapa/pin manual preparado para proveedor final.
- Orden queda como `PAID_PENDING_SHIPMENT` despues de pago simulado.
- Pagina publica de orden requiere token guest.

### Fulfillment

- Retiro en bodega gratis.
- Zonas configurables para San Salvador y Santa Tecla.
- Tarifa de envio leida desde configuracion.
- Validacion server-side por `deliveryZoneSlug`.
- Validacion inicial de coordenadas dentro de rangos aproximados por zona.

### Pagos

- Capa `PaymentProvider`.
- Proveedor `mock` para MVP/QA.
- `Payment` y `PaymentEvent` guardan estado normalizado.
- Pago mock bloqueado en produccion.
- Pagos reales quedan como gate de produccion.

### Admin

- Login temporal admin protegido por cookie firmada.
- Rate limit para login admin.
- Admin de ordenes.
- Detalle de orden.
- Cambio de estado operativo.
- Reglas de cambio de estado extraidas a `src/lib/admin-orders.ts` para poder probarlas fuera de server actions.
- Restauracion de inventario al cancelar/reembolsar una orden pagada pendiente de entrega.
- Bloqueo de reapertura de estados terminales.
- Admin de productos e inventario.
- Admin de retiro, zonas y tarifas.
- Auditoria admin.
- Admin de solicitudes de aviso por stock.

### Stock Alerts

- Cliente puede dejar contacto cuando no hay stock suficiente.
- Solicitudes deduplicadas por producto/contacto mientras esten abiertas.
- Rate limit para evitar spam.
- Admin puede filtrar y cambiar estado de solicitudes.

### Emails

- Proveedor `console` para MVP.
- Plantilla de confirmacion de orden.
- Registro `EmailLog`.
- Redaccion de tokens de acceso a orden en logs.

### Seguridad

- Headers base en `next.config.ts`.
- Cookies sensibles `httpOnly`.
- Firmas HMAC para sesion admin y carrito.
- Token guest hasheado en DB para ordenes publicas.
- Rate limits basicos en acciones expuestas.
- No se guardan tarjetas.

### QA Y CI

- Vitest para reglas de negocio.
- Playwright para flujos navegables.
- Playwright para checkout completo con retiro, envio local y aviso de stock.
- Playwright responsive smoke para paginas cliente criticas, checkout y admin en mobile/tablet.
- Pruebas de integracion Prisma para cambio de estado admin, restauracion de stock y auditoria.
- E2E aislado por schema PostgreSQL temporal mediante `scripts/run-e2e.ts`.
- Workflow `.github/workflows/ci.yml`.
- Jobs CI: `quality` y `e2e`.
- Documentacion para branch protection en GitHub.

## Cambios De Decisiones

- Pagos reales se dejan para el final antes de produccion.
- El MVP usa pago simulado desde la web para validar flujo.
- `Castillo Auto Parts` sigue como codename hasta validacion legal/comercial.
- Home no debe tener filtros avanzados.
- Catalogo concentra filtros y busqueda por vehiculo.
- DTE inicia como proceso semiautomatico, no integracion completa.

## Riesgos Que Siguen Abiertos

- Proveedor real de pago y webhooks.
- DTE fiscal real.
- Auth admin con roles.
- Marca final.
- Proveedor final de mapa/autocomplete.
- Politicas de devoluciones, garantias y cancelaciones.
- Multi-bodega.
- Inventario real validado por mercado/proveedores.

## Cambios 2026-05-26 — Bloque 1 y Bloque 2

### Middleware Edge para Admin

- `middleware.ts` en la raiz protege todas las rutas `/admin/**` excepto `/admin/login`.
- Corre en Edge Runtime con Web Crypto API (HMAC-SHA256).
- Redirige a login con `?next=` si la sesion no es valida.
- Previene open redirects: solo acepta paths dentro de `/admin/`.

### Helpers Centralizados

- `src/lib/form-utils.ts` — `formString`, `optionalFormString`, `optionalFormStringOrNull`.
- `src/lib/url-utils.ts` — `firstValue`, `allValues`.
- Eliminadas 8+ copias duplicadas en actions y pages de admin, cart, checkout y orders.

### Numero de Orden Seguro

- `buildOrderNumber` en `src/lib/checkout.ts` usa `randomBytes(3)` de `node:crypto`.
- Reemplaza `Math.random()` que era predecible y propenso a colisiones.

### React.cache() en Catalogo

- `findDbProducts` en `src/data/products.ts` usa `React.cache()`.
- Deduplica queries DB identicas dentro del mismo render tree.

### Ruta /design Bloqueada en Produccion

- `src/app/design/page.tsx` retorna `notFound()` en produccion.

### Autocomplete en Checkout

- Campos de nombre, email y telefono tienen `autoComplete` correcto.

### Rate Limiter Redis (Bloque 2)

- `src/lib/rate-limit-redis.ts` con `AsyncRateLimiter` y backend seleccionable.
- Si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` configuradas → Redis (escala en serverless).
- Si no → in-memory (comportamiento anterior, valido para desarrollo y single-instance).
- Implementacion Redis usa REST API de Upstash con `fetch` nativo, sin dependencias nuevas.
- `src/app/admin/login/actions.ts` usa el nuevo limiter async.
- `.env.example` documenta las variables de Upstash.

## Proxima Linea De Trabajo Recomendada

1. Activar CI en GitHub y proteger `main`.
2. Bloque 3: centralizar formatters y maquina de estados de orden.
3. Bloque 4: busqueda en tiempo real en catalogo.
4. Bloque 5: paginacion de catalogo a nivel DB.
5. Bloque 6: Auth.js v5 para cuentas de usuario y multi-admin con roles.
6. Bloque 7: Cloudflare R2 para imagenes de producto.
7. Preparar decision record para proveedor de pago real (Wompi u otro).
