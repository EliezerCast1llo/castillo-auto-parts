# Fase 5 - Checkout y órdenes

Fecha: 2026-05-19.

## Estado

Primera versión implementada en rama `codex/guest-checkout`.

## Entregado

- Ruta `/checkout` para compra de invitado.
- Formulario con nombre, email, teléfono, entrega, dirección y pago en línea.
- Validación server-side con Zod.
- Selector de retiro en bodega o envío local.
- Tarifas MVP:
  - retiro en bodega: USD 0.00;
  - Santa Tecla: USD 2.00;
  - San Salvador: USD 3.00.
- Creación de orden `PENDING_PAYMENT` en Prisma cuando PostgreSQL está disponible.
- Snapshot de productos, precios, cantidades, subtotal, envío, IVA incluido y total.
- Ruta `/orders/[orderNumber]` para ver orden creada.
- Carrito se limpia después de crear la orden.
- Carrito enlaza a `/checkout` cuando no tiene bloqueos de stock.

## Validaciones

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- QA visual de carrito a checkout en `http://localhost:3000/checkout`.

## Pendiente

- Reintentar `docker compose up -d postgres` cuando la descarga de la imagen de PostgreSQL termine correctamente.
- Ejecutar `npm run db:push` y `npm run db:seed`.
- Validar creación real de orden en PostgreSQL.
- Agregar mapa/pin manual para entrega local.
- Integrar proveedor de pago local en fase 6.
