# Technical Architecture - E-commerce de repuestos

## Objetivo tecnico

Construir una aplicacion modular y mantenible, iniciando con un monolito Next.js bien separado por dominios. La arquitectura debe permitir vender pronto sin bloquear el crecimiento hacia multi-bodega, facturacion electronica, pagos alternativos, chat, analytics y automatizacion.

## Stack recomendado

- Framework: Next.js App Router.
- Lenguaje: TypeScript.
- UI: Tailwind CSS + shadcn/ui.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Auth: Auth.js o Supabase Auth. Decision pendiente.
- Pagos: Wompi SV mediante capa `PaymentProvider`, con BAC Compra Click como fallback operativo manual.
- Facturacion DTE: modo semiautomatico inicial mediante capa `InvoiceProvider`.
- Mapas: Google Maps Places/Maps JavaScript API o alternativa validada, mediante capa `MapProvider`.
- Internacionalizacion: base i18n para espanol/ingles.
- Imagenes: Cloudinary o S3 compatible.
- Email: Resend o SendGrid.
- Deploy: Vercel para frontend/backend serverless, con revision si webhooks/procesos requieren otra infraestructura.

## Principio de arquitectura

No acoplar la tienda a un proveedor especifico de pago o DTE. El dominio de ordenes debe conocer conceptos internos como `Payment`, `Order`, `InvoiceDte`, pero no detalles del API externo.

Capas sugeridas:

- `app/`: rutas y acciones/server components.
- `components/`: UI reusable.
- `features/`: logica por dominio si el proyecto crece.
- `lib/`: clientes externos, auth, db, validaciones.
- `server/`: servicios de negocio y repositories si se necesita separar mas.
- `prisma/`: schema y migraciones.
- `docs/`: documentacion viva.

## Estructura inicial propuesta

```txt
src/
  app/
    page.tsx
    catalog/
    product/[slug]/
    cart/
    checkout/
    orders/
    admin/
      orders/
      products/
      inventory/
      settings/
    api/
      payments/
        webhook/
      invoices/
  components/
    ui/
    product/
    cart/
    checkout/
    admin/
  lib/
    auth.ts
    db.ts
    env.ts
    money.ts
    validations.ts
    shipping.ts
    i18n/
      config.ts
      messages/
        es.json
        en.json
    maps/
      provider.ts
      google.ts
    payments/
      provider.ts
      wompi.ts
      pagadito.ts
    invoices/
      provider.ts
      dte-provider.ts
  prisma/
    schema.prisma
docs/
```

## Rutas principales

- `/`: home con busqueda, categorias y productos destacados.
- `/catalog`: catalogo.
- `/product/[slug]`: detalle de producto.
- `/cart`: carrito.
- `/checkout`: checkout.
- `/orders`: ordenes del cliente.
- `/orders/[id]`: detalle de orden.
- `/admin`: dashboard.
- `/admin/orders`: gestion de ordenes.
- `/admin/products`: gestion de productos.
- `/admin/inventory`: carga manual de inventario.
- `/admin/settings`: configuracion inicial de zonas, horarios, DTE y pagos.

## Flujo de checkout

1. Cliente revisa carrito.
2. Backend valida stock.
3. Cliente elige retiro en bodega o envio local.
4. Si elige retiro, se muestran datos/mapa de bodega y no se solicitan campos de entrega.
5. Si elige envio, captura direccion legible, coordenadas, pin manual y notas.
6. Backend valida cobertura y calcula tarifa de envio.
7. Backend inicia pago web con proveedor local o simula pago web en MVP.
8. Cuando el pago web se confirma, backend crea orden `PAID_PENDING_SHIPMENT`.
9. Inventario se descuenta en transaccion.
10. Se crea registro de factura DTE en estado `PENDING` o `ISSUED`.
11. Se envia confirmacion por email o se marca pendiente si email aun no esta configurado.

## Pagos locales

Decision inicial recomendada: implementar una abstraccion y evaluar proveedor antes de escribir integracion definitiva.

### Candidatos iniciales

- Wompi El Salvador:
  - Tiene documentacion API publica.
  - Soporta enlaces de pago, boton/API y webhooks.
  - Segun su sitio publico, acepta Visa/Mastercard y muestra tarifa base de 3.50% para compras normales.
  - Buena candidata para MVP si onboarding y requisitos comerciales son adecuados.
- Pagadito:
  - Proveedor regional nacido en El Salvador.
  - Ofrece boton de pago, pasarela, QR, links, APIs y certificacion PCI-DSS Nivel 1 segun su sitio.
  - Puede ser opcion fuerte si condiciones comerciales y soporte son mejores.
- BAC / adquirente bancario:
  - Puede ser opcion empresarial, pero documentacion y onboarding suelen depender de contrato.

### Interfaz sugerida

```ts
export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyWebhook(request: Request): Promise<PaymentWebhookEvent>;
  getPaymentStatus(externalPaymentId: string): Promise<PaymentStatus>;
}
```

Implementación actual:

- `mock`: activo por defecto para MVP.
- `wompi`: reservado para integración real.
- `pagadito`: reservado como alternativa.
- `bac_manual`: reservado para fallback operativo/manual.

El dominio de órdenes no debe depender directamente de APIs externas. Debe consumir `getPaymentProvider()` y guardar `Payment`/`PaymentEvent` con datos normalizados y payload crudo.

## Envio y direccion

El MVP debe soportar dos metodos:

- Retiro en bodega: gratis, disponible solo en dias/horarios configurados.
- Envio local propio: San Salvador y Santa Tecla.

Tarifas iniciales de referencia:

- Santa Tecla: USD 2.
- San Salvador: USD 3 a USD 5, pendiente de tabla por zona.

La direccion debe guardar:

- direccion legible;
- municipio/departamento;
- notas de entrega;
- `placeId` si existe;
- latitud/longitud;
- fuente de la coordenada: ubicacion actual, busqueda, pin manual.

La integracion de mapa debe estar detras de una abstraccion sencilla para poder cambiar proveedor si costos o cobertura no convienen.

```ts
export interface MapProvider {
  geocode(input: GeocodeInput): Promise<GeocodeResult>;
  reverseGeocode(input: Coordinates): Promise<AddressResult>;
  validateCoverage(input: Coordinates): Promise<CoverageResult>;
}
```

## Internacionalizacion

- Idioma principal: espanol.
- Idioma secundario: ingles.
- Recomendacion inicial: centralizar textos de UI en archivos de mensajes.
- El contenido de productos puede iniciar en espanol y tener campos opcionales para ingles.
- Evitar textos hardcodeados en componentes cuando sean visibles al usuario.

## Facturacion electronica DTE

El sistema debe estar preparado para emitir DTE, pero la integracion definitiva depende de:

- registro/autorizacion como emisor DTE;
- decision con contador;
- proveedor DTE o integracion directa;
- ambiente de pruebas y produccion;
- manejo de contingencia.

Modelo tecnico recomendado:

- `InvoiceDte` guarda estado fiscal de la orden.
- El pedido puede pasar a `PAID_PENDING_SHIPMENT` aunque la factura este `PENDING`, pero debe quedar visible para admin.
- La emision de DTE debe ser idempotente.
- Guardar codigo de generacion, numero de control, sello de recepcion, JSON, PDF/representacion legible y errores.

Estados sugeridos:

- `PENDING`
- `ISSUED`
- `FAILED`
- `VOIDED`
- `MANUAL_REVIEW`

## Seguridad

- Variables sensibles solo en env vars.
- No exponer llaves de proveedor al cliente.
- No guardar tarjetas.
- Validar webhook con firma/token/mecanismo del proveedor.
- Usar HTTPS en produccion.
- Proteger rutas admin por rol.
- Sanitizar entradas.
- Validar con Zod en server.
- Auditar cambios de orden, inventario y facturacion.

## Manejo de inventario

Para MVP:

- Una bodega logica default.
- Tabla separada para stock por producto y ubicacion.
- Descuento de stock en transaccion al confirmar pago.
- Reserva de stock opcional en fase posterior.

Preparado para futuro:

- multiples bodegas;
- transferencias entre bodegas;
- conteos;
- ajustes con razon;
- escaner de factura.

## Estrategia de datos

- Usar seed data solo para demo/desarrollo.
- No inventar inventario real sin estudio de mercado.
- Cada producto debe tener SKU interno.
- Guardar numero de parte del fabricante si existe.
- Compatibilidad simple en tabla separada para crecer despues.

## Ambientes

- `ci`: GitHub Actions con PostgreSQL service container, proveedor de pago `mock`, email `console`, Prisma validate, lint, typecheck, unit tests, build y Playwright E2E.
- `development`: datos seed, proveedor de pago sandbox/mock.
- `preview`: deploy por PR, pago sandbox/mock.
- `production`: pago real, DTE real o proceso fiscal aprobado.

## CI/CD

CI implementado en:

- `.github/workflows/ci.yml`

Gates:

- `quality`;
- `e2e`.

CD/deploy automatico queda pendiente hasta cerrar pagos reales, DTE, dominio, secretos y ambiente productivo.

Documento operativo:

- `docs/ci-cd-quality-gates.md`

## Decisiones pendientes

- Auth.js vs Supabase Auth.
- Validacion comercial final de Wompi.
- Proceso operativo DTE semiautomatico con contador.
- Hosting definitivo para webhooks si el proveedor requiere respuesta/tiempos especificos.
- Tabla final de zonas/tarifas de San Salvador.
- Google Maps vs alternativa de mapas.
- Libreria i18n especifica.

## Referencias consultadas

- Ministerio de Hacienda, reformas sobre DTE: https://www.mh.gob.sv/reformas-al-codigo-tributario-relativas-a-la-facturacion-electronica-documentos-tributarios-electronicos-dte/
- Guia rapida MH para emitir factura en Sistema de Facturacion: https://www.mh.gob.sv/wp-content/uploads/2023/10/Guia-r%C3%A1pida-emitir-una-Factura-en-la-plataforma-Sistema-de-Facturaci%C3%B3n.pdf
- Wompi El Salvador: https://wompi.com.sv/
- Wompi API: https://docs.wompi.sv/
- Pagadito: https://www.pagadito.com/
- Pagadito Developers: https://dev.pagadito.com/en/el-salvador/
