# Fase 6 - Pagos locales

Fecha: 2026-05-19.

## Estado

Fase iniciada como capa técnica de pagos. No integra todavía proveedor real porque falta onboarding, credenciales y decisión final de proveedor.

## Objetivo

Preparar el checkout para operar detrás de un proveedor reemplazable, manteniendo el MVP con pago simulado mientras se decide y configura Wompi, Pagadito o BAC.

## Decisión

Usar `PaymentProvider` como contrato interno.

Proveedor activo por defecto:

- `mock`

Variable local:

- `PAYMENT_PROVIDER=mock`

Proveedores reservados para implementación futura:

- `wompi`
- `pagadito`
- `bac_manual`

## Entregado

- Contrato `PaymentProvider` en `src/lib/payments/provider.ts`.
- Registro/resolución de proveedor en `src/lib/payments/index.ts`.
- Adaptador `mockPaymentProvider`.
- El checkout ya crea pagos mediante `getPaymentProvider()`.
- El pago mock confirma inmediatamente en estado `PAID`.
- La orden queda en `PAID_PENDING_SHIPMENT`.
- El registro `Payment` guarda proveedor, estado, monto, moneda, referencia externa, URL de checkout/retorno, `rawStatus` y `paidAt`.
- Se crea un `PaymentEvent` inicial con payload del proveedor mock.
- Error de proveedor se transforma en estado de UI `payment_unavailable`.

## Fuera de alcance de este corte

- Integración real con Wompi.
- Webhook real de Wompi/Pagadito/BAC.
- Firma/verificación criptográfica de webhook.
- Reintentos automáticos.
- Conciliación bancaria.
- Reembolsos.

## Reglas

- La app no almacena datos de tarjeta.
- Mientras no haya proveedor real, el pago simulado debe ser explícito en copy y documentación.
- No debe volver a existir una orden visible como pendiente de pago.
- Una orden creada por checkout web debe quedar pagada y pendiente de entrega.
- Si el proveedor no confirma `PAID`, no se crea la orden final.

## Próximo paso recomendado

Cuando se elija proveedor:

1. Crear adaptador real detrás de `PaymentProvider`.
2. Agregar variables de entorno del proveedor.
3. Cambiar `PAYMENT_PROVIDER` al proveedor real solo cuando el adaptador exista.
4. Crear endpoint de webhook.
5. Guardar eventos crudos en `PaymentEvent`.
6. Hacer idempotencia por `externalPaymentId` y `externalEventId`.
7. Probar en sandbox con tickets pequeños.
