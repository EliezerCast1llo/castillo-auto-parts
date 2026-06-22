# Fase 2 - Pagos asíncronos e inventario

Fecha: 2026-06-21.

## Objetivo

Evitar que una orden se considere pagada antes de la confirmación servidor a servidor y evitar sobreventa cuando dos clientes intentan comprar las últimas unidades.

## Flujo implementado

1. Checkout valida precios y disponibilidad en servidor.
2. Una transacción PostgreSQL reserva inventario en `quantityReserved` y crea:
   - orden `PAYMENT_PROCESSING`;
   - pago `PENDING`;
   - vencimiento de reserva a 20 minutos.
3. El proveedor crea el enlace fuera de la transacción de base de datos.
4. El cliente paga fuera del sitio.
5. Solo un evento verificado puede cambiar la orden a `PAID_PENDING_SHIPMENT`.
6. La confirmación descuenta simultáneamente `quantityOnHand` y `quantityReserved`.
7. El email de confirmación se envía después del commit y usa un segundo token hasheado para no invalidar el enlace original del navegador.

El redirect del navegador nunca marca una orden como pagada.

## Proveedor mock

El modo local muestra `/payments/mock/[externalPaymentId]`. QA puede comprobar primero la reserva pendiente y después usar `Simular pago aprobado`. La acción pasa por el mismo procesador idempotente que un webhook real.

El proveedor mock continúa bloqueado en producción, salvo durante el runner E2E aislado mediante las banderas específicas del proyecto.

## Wompi El Salvador

Implementación basada en la documentación oficial:

- OAuth2 Client Credentials: <https://docs.wompi.sv/autenticacion/autenticacion>
- Crear enlace de pago: <https://docs.wompi.sv/metodos-api/enlace-de-pago>
- Payload del webhook: <https://docs.wompi.sv/webhook/definicion-webhook>
- Validación HMAC: <https://docs.wompi.sv/webhook/validar-webhook>
- Redirect frente a webhook: <https://docs.wompi.sv/redirect-url/parametros-de-url-de-redirect>

Controles aplicados:

- OAuth y creación del enlace solo en servidor.
- Monto y cantidad no editables.
- Enlace limitado a un pago exitoso.
- Tarjeta como única forma habilitada inicialmente.
- HMAC-SHA256 sobre el body crudo y comparación en tiempo constante.
- Idempotencia mediante `provider + externalEventId` único.
- Validación del monto contra `Payment.amountCents` y `Order.totalCents`.
- Validación de referencia y ambiente sandbox/producción.
- Un pago recibido después de liberar su reserva queda pagado pero en revisión manual; no se promete inventario automáticamente.

Variables requeridas para `PAYMENT_PROVIDER=wompi`:

```text
WOMPI_APP_ID
WOMPI_API_SECRET
WOMPI_WEBHOOK_SECRET
WOMPI_WEBHOOK_URL
WOMPI_ENVIRONMENT=sandbox|production
```

`WOMPI_WEBHOOK_SECRET` debe corresponder a la llave utilizada por Wompi para el HMAC. Según su documentación actual, es el API Secret del aplicativo.

## Expiración

`GET` o `POST /api/internal/expire-payment-reservations` libera reservas vencidas. Requiere:

```text
Authorization: Bearer <RESERVATION_CRON_SECRET>
```

El scheduler debe invocarlo cada cinco minutos. La operación reclama la orden condicionalmente y es idempotente, por lo que dos ejecuciones no liberan stock dos veces.

## Casos automatizados

- Dos reservas concurrentes por la última unidad: una gana y una falla.
- Confirmar mueve reservado a vendido.
- Liberar no reduce existencias físicas.
- Expirar dos veces solo libera una vez.
- Body de webhook modificado falla la firma.
- Evento duplicado no cumple dos veces.
- Monto incorrecto no marca pagado.
- Evento sandbox rechazado cuando se espera producción.
- Mock asíncrono pasa de pago pendiente a orden pendiente de entrega.

## Pendiente externo

No es posible declarar validado el sandbox real hasta completar el onboarding y disponer de credenciales Wompi. Antes de producción se debe ejecutar una compra sandbox y verificar en ambos lados:

- enlace creado en el ambiente correcto;
- entrega y reintento del webhook;
- HMAC recibido;
- monto, referencia e identificadores reales;
- comportamiento de una transacción rechazada;
- conciliación en el panel de Wompi.
