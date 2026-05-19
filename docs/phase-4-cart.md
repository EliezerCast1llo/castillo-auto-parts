# Fase 4 - Carrito

Fecha: 2026-05-19.

## Estado

Primera versión implementada antes de checkout guest.

## Entregado

- Ruta `/cart`.
- Carrito invitado persistido con cookie segura.
- Agregar productos desde catálogo y detalle.
- Cambiar cantidad con control `-` / `+` y campo editable.
- Eliminar productos.
- Validación de productos sin disponibilidad.
- Validación de cantidad mayor al stock disponible.
- Resumen con productos/subtotal y nota de IVA incluido.
- CTA a checkout cuando el carrito no tiene bloqueos de stock.
- Estados vacíos y mensajes de ajuste de stock.

## Validaciones

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- QA visual de catálogo a carrito y de carrito a checkout.

## Pendiente

- Carrito de usuario registrado cuando se active auth.
- Merge de carrito invitado con carrito de usuario al iniciar sesión.
- Automatización E2E del flujo catálogo -> carrito -> checkout.
