# Fase 3 - Consistencia de IVA

Fecha: 2026-06-23.

## Objetivo

Cerrar `T-030` del plan de trabajo: evitar descuadres entre el IVA guardado en cada `OrderItem` y el IVA total guardado en `Order.taxCents`.

## Regla fiscal provisional del MVP

- Los precios visibles al cliente son montos finales en USD con IVA incluido.
- La UI no desglosa IVA; solo informa que los precios ya incluyen IVA.
- El envío local también se trata como precio final con IVA incluido para efectos del cálculo interno.
- `Order.taxCents` se compone como:

```txt
SUM(OrderItem.taxCents) + IVA incluido del envío
```

No se debe recalcular el IVA de la orden desde `subtotalCents + shippingCents`, porque los redondeos por línea pueden generar diferencias de centavos frente al detalle.

## Implementación

- `src/lib/checkout.ts`
  - `calculateIncludedTaxCents(totalCents)` extrae IVA incluido al 13%.
  - `calculateOrderTaxCents({ itemTaxCents, shippingCents })` compone el IVA total de la orden.
- `src/lib/orders.ts`
  - La creación de orden guarda `taxCents` usando la suma de líneas más el IVA del envío.
- `src/lib/checkout.test.ts`
  - Cubre un caso donde recalcular desde el total bruto daría un centavo distinto.

## Pendiente para T-040 / DTE

Antes de producción comercial, el contador o proveedor DTE debe confirmar si el envío debe modelarse como línea gravada separada, servicio de transporte, cargo exento o cualquier tratamiento fiscal específico. Si la respuesta cambia esta regla, se debe ajustar el provider DTE y los tests de redondeo antes de emitir comprobantes.
