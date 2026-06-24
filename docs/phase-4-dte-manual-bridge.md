# Fase 4 - Puente manual DTE

Fecha: 2026-06-24.

Este documento cubre `T-040` sin implementar emisión real de DTE.

## Decisión provisional

El MVP no debe emitir DTE automáticamente hasta tener:

- contador salvadoreño validando el régimen;
- tipo de DTE definido;
- tratamiento fiscal del envío definido;
- proveedor DTE o acceso sandbox de Hacienda;
- pruebas de emisión, firma, transmisión, contingencia y anulación.

Mientras tanto, el sistema conserva el modelo `InvoiceDte` y el modo `DTE_MODE="manual"`.

## Flujo manual propuesto

1. Webhook/procesador de pago confirma el pago.
2. La orden pasa a `PAID_PENDING_SHIPMENT`.
3. Operación/admin revisa la orden en panel.
4. Contabilidad emite el DTE mediante portal/proveedor externo.
5. Admin registra manualmente:
   - estado fiscal;
   - número de control;
   - código de generación;
   - sello de recepción;
   - URL o referencia del PDF/JSON si aplica.
6. Si el DTE falla, la orden no se pierde: queda en revisión manual y se resuelve antes de despacho.

## Preguntas obligatorias para contador/proveedor

- ¿Castillo Auto Parts venderá como consumidor final, crédito fiscal o ambos?
- ¿Qué datos mínimos se deben pedir al cliente guest?
- ¿El DTE se emite al pago aprobado, al despacho o al cierre diario?
- ¿El envío se emite como línea gravada, servicio de transporte, cargo exento u otro tratamiento?
- ¿Qué pasa si el pago fue aprobado pero el servicio DTE está caído?
- ¿Quién envía al cliente la versión legible del DTE?
- ¿Cómo se manejan devoluciones, cancelaciones y anulaciones?

## No hacer todavía

- No crear provider DTE real sin credenciales sandbox.
- No prometer al cliente que el DTE ya fue emitido si está `PENDING_MANUAL`.
- No publicar ventas reales sin proceso fiscal revisado.

## Implementación futura

Cuando exista proveedor/contador:

- crear `src/lib/invoices/<provider>.ts`;
- hacer idempotente la emisión por `orderId`;
- disparar emisión tras pago confirmado;
- guardar request/response sanitizados;
- agregar reintentos controlados;
- agregar vista admin de estado DTE;
- agregar tests con provider fake/sandbox.
