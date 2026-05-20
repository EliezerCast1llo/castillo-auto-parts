# Fase 7 - Admin básico de órdenes

Fecha: 2026-05-19.

## Estado

Primera versión en implementación.

## Objetivo

Permitir que el operador/admin vea órdenes pagadas, revise detalles de compra y actualice el estado operativo de entrega.

## Entregado

- Ruta `/admin/orders`.
- Listado de últimas 50 órdenes.
- Filtro por estado.
- Métricas por estado.
- Ruta `/admin/orders/[orderNumber]`.
- Detalle de cliente, productos, entrega, pago, resumen y eventos.
- Cambio de estado de orden:
  - pendiente de entrega;
  - enviada;
  - entregada;
  - cancelada;
  - reembolsada.
- Sincronización básica de estado de envío según estado de orden.

## Decisión temporal

El admin aún no tiene autenticación ni autorización. Esta fase deja la operación visible para QA y desarrollo, pero no debe exponerse en producción sin login/admin real.

## Fuera de alcance

- Login admin.
- Roles/permisos.
- Auditoría de cambios.
- Notificaciones por email.
- DTE admin.
- Reembolsos reales con proveedor de pago.

## Checklist QA

- Entrar a `/admin/orders`.
- Ver órdenes pagadas.
- Filtrar por estado.
- Abrir detalle de una orden.
- Ver cliente, productos, entrega, pago y total.
- Cambiar estado a enviada.
- Confirmar que el detalle muestra estado actualizado.
- Confirmar que `/admin/orders` refleja el cambio.
- Validar mobile/tablet/desktop.
