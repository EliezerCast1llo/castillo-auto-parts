# Agent Review Findings - 2026-05-26 — Bloque 3

Formatters centralizados y máquina de estados explícita para órdenes.

## Contexto

Las funciones de presentación (`formatOrderStatus`, `formatShipmentMethod`, etc.) estaban
duplicadas en 3 archivos distintos. Cualquier cambio de label o lógica requería editar múltiples
lugares sin garantía de consistencia.

La lógica de transiciones de estado de orden era implícita: un booleano `isTerminalOrderStatus`
definía qué no era posible, pero no declaraba explícitamente qué sí era válido. No existía una
fuente de verdad para el diagrama de estados.

## 3.1 — Módulo order-formatters.ts

Nuevo archivo `src/lib/order-formatters.ts`:

- `formatOrderStatus(status)` — label en español (Cancelada, Enviada, etc.).
- `formatShipmentMethod(method)` — Retiro en bodega / Envío local / Pendiente.
- `formatShipmentStatus(status)` — En tránsito / Entregado / etc.
- `formatPaymentProvider(provider)` — Wompi / Pago mock / etc.
- `formatPaymentStatus(status)` — Pagado / Fallido / etc.
- `formatDateTime(date)` — Intl.DateTimeFormat en es-SV, zona America/El_Salvador.
- `getOrderStatusClassName(status)` — clases Tailwind para el badge de estado.

Reemplaza funciones locales en 3 archivos. El módulo es la fuente única de verdad para labels
y colores de estados de orden en toda la aplicación.

Tests en `src/lib/order-formatters.test.ts` cubren todos los formatters.

## 3.2 — Máquina de estados explícita en admin-orders.ts

`ORDER_STATUS_TRANSITIONS: Record<OrderStatus, ReadonlyArray<OrderStatus>>` —
mapa declarativo de transiciones válidas:

```
PAID_PENDING_SHIPMENT → [SHIPPED, CANCELLED, REFUNDED]
SHIPPED               → [DELIVERED, CANCELLED, REFUNDED]
DELIVERED             → [] (cerrada)
CANCELLED             → [REFUNDED]
REFUNDED              → [] (terminal)
```

Funciones exportadas (antes privadas o implícitas):

- `canTransitionOrderStatus(from, to)` — reemplaza la lógica implícita en updateOrderStatusForAdmin.
- `isTerminalOrderStatus(status)` — identifica estados cerrados para evitar reaperturas operativas.

`updateOrderStatusForAdmin` ahora usa `canTransitionOrderStatus` en lugar del condicional
implícito anterior. El mapa de transiciones es la fuente de verdad para cambios de estado.
Se conserva el flujo `CANCELLED -> REFUNDED` para reconciliar una cancelación como reembolso
sin restaurar inventario dos veces, y se bloquea cualquier reapertura hacia estados operativos.

Tests en `admin-orders.test.ts` cubren transiciones válidas, inválidas, estados terminales
y que todos los valores del enum están cubiertos en el mapa.

## 3.3 — Archivos UI actualizados

Archivos que importan desde `order-formatters` (funciones locales eliminadas):

- `src/app/admin/orders/page.tsx`
- `src/app/admin/orders/[orderNumber]/page.tsx`
- `src/app/orders/[orderNumber]/page.tsx`

Corrección adicional: `admin/orders/[orderNumber]/page.tsx` tenía una copia local de
`firstValue` que no fue reemplazada en el Bloque 1.2. Corregido en este bloque.

## Archivos nuevos

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/order-formatters.ts` | Formatters de dominio centralizados para órdenes. |
| `src/lib/order-formatters.test.ts` | Tests unitarios de todos los formatters. |

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/admin-orders.ts` | ORDER_STATUS_TRANSITIONS, canTransitionOrderStatus, isTerminalOrderStatus exportados. |
| `src/lib/admin-orders.test.ts` | Tests para state machine: transiciones válidas, inválidas, terminales y cobertura de enum. |
| `src/app/admin/orders/page.tsx` | Importa formatters centralizados; funciones locales eliminadas. |
| `src/app/admin/orders/[orderNumber]/page.tsx` | Importa formatters y firstValue centralizados; funciones locales eliminadas. |
| `src/app/orders/[orderNumber]/page.tsx` | Importa formatShipmentMethod; función local eliminada. |
