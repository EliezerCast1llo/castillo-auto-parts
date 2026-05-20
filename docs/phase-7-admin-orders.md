# Fase 7 - Admin básico de órdenes

Fecha: 2026-05-19.

## Estado

Primera versión implementada con guardia temporal de acceso admin.

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
- Ruta `/admin/login`.
- Protección de `/admin/orders` y `/admin/orders/[orderNumber]` con cookie `httpOnly`.
- Protección server-side de la acción para cambiar estado.
- Botón para cerrar sesión admin.

## Decisión temporal

El admin usa una contraseña de entorno para el MVP:

- `ADMIN_ACCESS_PASSWORD`
- `ADMIN_ACCESS_SECRET`

La sesión se firma con HMAC, expira en 8 horas y se guarda en cookie `httpOnly`, `sameSite=lax`. Esto evita dejar el panel abierto durante QA, pero sigue siendo una solución temporal. Antes de producción se debe reemplazar por autenticación real con roles/permisos.

## Fuera de alcance

- Roles/permisos.
- Auditoría de cambios.
- Notificaciones por email.
- DTE admin.
- Reembolsos reales con proveedor de pago.

## Checklist QA

- Entrar a `/admin/orders` sin sesión.
- Confirmar redirección a `/admin/login`.
- Intentar contraseña incorrecta y confirmar mensaje de error.
- Entrar con contraseña correcta.
- Entrar a `/admin/orders`.
- Ver órdenes pagadas.
- Filtrar por estado.
- Abrir detalle de una orden.
- Ver cliente, productos, entrega, pago y total.
- Cambiar estado a enviada.
- Confirmar que el detalle muestra estado actualizado.
- Confirmar que `/admin/orders` refleja el cambio.
- Cerrar sesión.
- Confirmar que `/admin/orders` vuelve a pedir login.
- Validar mobile/tablet/desktop.
