# MVP Current Status

Fecha: 2026-05-20.

Este documento es la fuente rapida de estado actual del MVP. Los documentos de fase anteriores pueden conservar contexto historico o decisiones previas.

## Estado General

El MVP esta en etapa funcional local, guest-first, con pago simulado y operacion admin basica.

Implementado:

- Home, catalogo, detalle de producto, filtros y compatibilidad vehicular estructurada.
- Carrito guest firmado por cookie.
- Checkout guest con retiro en bodega y envio local.
- Mapa/pin manual con coordenadas requeridas para envio local.
- Ordenes en estado `PAID_PENDING_SHIPMENT` usando proveedor de pago mock.
- Admin protegido por login temporal.
- Admin de ordenes, productos, inventario, ajustes de entrega, auditoria y avisos de stock.
- Emails transaccionales con proveedor `console/mock`.
- Playwright E2E inicial.

## Scope Actual del MVP

Incluido:

- Compra como invitado.
- Pago simulado desde la web.
- Inventario de una bodega principal, modelado para crecer a mas bodegas.
- Precios en USD con IVA incluido.
- Retiro en bodega gratis.
- Envio local por zonas configurables.
- Solicitud de aviso cuando no hay stock suficiente.
- Avisos de stock deduplicados por producto/contacto mientras esten abiertos.

No incluido todavia:

- Pago real con proveedor local.
- Apple Pay / Google Pay.
- Usuario registrado y ordenes asociadas a cuenta.
- DTE real integrado con Ministerio de Hacienda.
- Chat de soporte.
- Proveedor final de mapa/autocomplete.
- Escaner de factura para cargar inventario.

## Gates Antes de Produccion Comercial

### Pagos

- Elegir proveedor real.
- Completar onboarding y credenciales.
- Implementar webhook verificado.
- Agregar idempotencia por evento externo.
- Definir conciliacion, reversas, reembolsos, cancelaciones y restauracion de inventario.

### DTE

- Definir proceso manual MVP con contador.
- Crear o actualizar `InvoiceDte` por orden pagada.
- Definir datos fiscales minimos capturados.
- Vista admin para estado DTE y revision manual.
- Gate: ninguna venta real sin proceso fiscal claro.

### Auth y Clientes

Decision actual: MVP sigue guest-first.

Pendiente si se decide incluir usuarios registrados:

- proveedor de auth;
- merge de carrito guest a usuario;
- vista "Mis ordenes";
- roles admin reales.

### Marca

`Castillo Auto Parts` sigue como nombre provisional/codename hasta validacion legal/comercial.

Gate: no lanzar publicidad, dominio final o papeleria con marca sin validacion.

### Fulfillment

- Validar tarifas reales por zona.
- Confirmar direccion de bodega publica.
- Confirmar horario de retiro.
- Decidir proveedor final de mapas/autocomplete.
- Validar server-side que el pin corresponda a la zona seleccionada.

### Politicas Comerciales

Definir antes de ventas reales:

- cambios y devoluciones;
- garantia por compatibilidad;
- cancelaciones;
- retiro no reclamado;
- SLA de entrega;
- responsabilidad cuando el cliente elige repuesto incompatible.

## QA Actual

Automatizado:

- Vitest para helpers de negocio.
- Playwright para catalogo, carrito, checkout local basico y login/admin stock alerts.

Manual pendiente:

- revisar UX real del mapa/pin;
- revisar stock alerts en admin;
- probar checkout pickup y envio local en navegador;
- revisar responsive mobile/tablet;
- validar copy legal/comercial.
