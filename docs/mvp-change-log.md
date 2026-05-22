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

## Proxima Linea De Trabajo Recomendada

1. Activar CI en GitHub y proteger `main`.
2. Agregar pruebas de integracion de orden/inventario.
3. Aislar base E2E por run.
4. Completar validaciones admin.
5. Preparar decision record para auth admin real.
