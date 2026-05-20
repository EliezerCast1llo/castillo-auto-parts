# Fase 5 - Checkout y órdenes

Fecha: 2026-05-19.

## Estado

Primera versión implementada en rama `codex/guest-checkout`.

## Entregado

- Ruta `/checkout` para compra de invitado.
- Formulario con nombre, email, teléfono, entrega y pago en línea.
- Validación server-side con Zod.
- Selector de retiro en bodega o envío local.
- Retiro en bodega oculta campos de domicilio y muestra mapa de la bodega provisional.
- Retiro en bodega muestra dirección, horario e instrucciones configuradas desde admin.
- Tarifas MVP:
  - retiro en bodega: USD 0.00;
  - Santa Tecla: USD 2.00;
  - San Salvador: USD 3.00.
- Las tarifas de envío ya se leen desde `DeliveryZone`; esos montos son seed inicial y pueden cambiar desde `/admin/settings`.
- Simulación de pago web para crear la orden en estado `PAID_PENDING_SHIPMENT`.
- Registro `Payment` con proveedor `mock` para dejar lista la integración real posterior.
- Snapshot de productos, precios, cantidades, subtotal, envío, IVA fiscal interno y total.
- Descuento de inventario en la misma transacción después del pago simulado.
- Ruta `/orders/[orderNumber]` para ver orden creada.
- Carrito se limpia después de crear la orden.
- Carrito enlaza a `/checkout` cuando no tiene bloqueos de stock.
- El desglose visible muestra productos, envío y total; no muestra IVA como cálculo separado porque los precios ya lo incluyen.

## Validaciones

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run db:push -- --accept-data-loss`
- `npm run db:seed`
- QA visual de carrito a checkout y detalle de orden en `http://localhost:3000`.

## Pendiente

- Reemplazar pago simulado por proveedor local real.
- Agregar mapa/pin manual para entrega local.
- Validar ubicación con coordenadas cuando exista pin manual.
- Integrar proveedor de pago local en fase 6.
