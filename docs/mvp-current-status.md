# MVP Current Status

Fecha: 2026-06-21.

Este documento es la fuente rapida de estado actual del MVP. Los documentos de fase anteriores pueden conservar contexto historico o decisiones previas.

## Estado General

El MVP esta en etapa funcional local, guest-first, con pago simulado y operacion admin basica.

Implementado:

- Middleware Edge que protege `/admin/**` antes del Server Component (HMAC-SHA256, Edge Runtime).
- Rate limiter admin con backend Redis opcional (Upstash) + fallback en memoria.
- Helpers centralizados `form-utils.ts` y `url-utils.ts` (elimina duplicacion en 9+ archivos).
- Numero de orden con sufijo `randomBytes` criptograficamente seguro.
- `React.cache()` en query de catalogo para deduplicar DB requests.
- Ruta `/design` bloqueada con `notFound()` en produccion.
- Home, catalogo, detalle de producto, filtros y compatibilidad vehicular estructurada.
- Carrito guest firmado por cookie.
- Checkout guest con retiro en bodega y envio local.
- Mapa/pin manual con coordenadas requeridas para envio local.
- Checkout asíncrono: orden `PAYMENT_PROCESSING`, pago `PENDING` y reserva temporal de inventario.
- Simulación explícita de confirmación de pago que usa el mismo procesador idempotente del webhook.
- Adaptador Wompi y webhook HMAC implementados, pendientes de validación con credenciales sandbox reales.
- Reserva, confirmación, liberación y expiración atómicas de inventario.
- Cálculo interno de IVA consistente: `Order.taxCents` se compone desde IVA por línea más IVA incluido del envío.
- Preparación de producción Fase 4: `DIRECT_DATABASE_URL`, CSP `Report-Only`, checklist operativo y puente manual DTE documentados.
- Preparación de calidad Fase 5: índices DB, búsqueda DB/rate-limited, email provider endurecido, E2E admin por rol y SEO noindex.
- Admin protegido por login temporal.
- Admin de ordenes, productos, inventario, ajustes de entrega, auditoria y avisos de stock.
- Emails transaccionales con proveedor `console/mock`.
- Playwright E2E inicial.
- Playwright responsive smoke para Home, Catalogo, Producto y Carrito en mobile/tablet.
- GitHub Actions CI con jobs `quality` y `e2e`.
- Pruebas de integracion para reglas admin de orden/inventario.
- Runner E2E con schema PostgreSQL temporal por corrida.

## Scope Actual del MVP

Incluido:

- Compra como invitado.
- Pago simulado asíncrono desde la web.
- Inventario de una bodega principal, modelado para crecer a mas bodegas.
- Precios en USD con IVA incluido.
- El IVA no se muestra como desglose al cliente; internamente se guarda para conciliación/DTE futura.
- Retiro en bodega gratis.
- Envio local por zonas configurables.
- Solicitud de aviso cuando no hay stock suficiente.
- Avisos de stock deduplicados por producto/contacto mientras esten abiertos.

No incluido todavia:

- Credenciales y validación sandbox/producción del pago real con Wompi.
- Apple Pay / Google Pay.
- Usuario registrado y ordenes asociadas a cuenta.
- DTE real integrado con Ministerio de Hacienda.
- CSP en modo enforcement; por ahora está en `Report-Only` para observar violaciones.
- Chat de soporte.
- Proveedor final de mapa/autocomplete.
- Escaner de factura para cargar inventario.

## Gates Antes de Produccion Comercial

### Pagos

- Elegir proveedor real.
- Completar onboarding y credenciales.
- Completar onboarding Wompi y validar el adaptador contra sandbox.
- Configurar `WOMPI_*` y registrar la URL pública del webhook.
- Configurar el scheduler de expiración con `RESERVATION_CRON_SECRET`.
- Definir conciliación operativa, reversas y reembolsos reales.

### DTE

- Definir proceso manual MVP con contador.
- Confirmar con contador si el envío debe emitirse como línea gravada separada, servicio de transporte, cargo exento u otro tratamiento DTE.
- Crear o actualizar `InvoiceDte` por orden pagada.
- Definir datos fiscales minimos capturados.
- Vista admin para estado DTE y revision manual.
- Gate: ninguna venta real sin proceso fiscal claro.

### Infraestructura

- Configurar `DATABASE_URL` pooled y `DIRECT_DATABASE_URL` directa en Vercel.
- Confirmar proveedor de PostgreSQL gestionado y revisar métricas de conexiones.
- Verificar en preproducción que una caída de PostgreSQL nunca activa datos mock bajo `NODE_ENV=production`; debe mostrarse un estado no disponible y generarse una alerta operativa.
- Confirmar después de restaurar la base de datos que Home, Catálogo, Producto, Carrito y Checkout usan datos persistidos.
- Revisar `docs/production-operations-checklist.md` antes de cualquier lanzamiento público.
- Revisar violaciones CSP en preview antes de pasar de `Report-Only` a enforcement.

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
- Vitest con Prisma real para transiciones admin de orden e inventario.
- Playwright para catalogo, carrito, checkout pickup/local completo, aviso de stock y login/admin stock alerts.
- Playwright cubre autorización de roles admin en rutas permitidas y denegadas.
- Playwright responsive smoke para detectar overflow horizontal en pantallas cliente criticas, checkout y admin operativo.
- GitHub Actions corre Prisma validate, lint, typecheck, unit tests, build y E2E en PR/push a `main`.
- `npm run test:e2e` prepara y limpia su propio schema para no modificar el schema local normal.

Manual pendiente:

- revisar UX real del mapa/pin;
- revisar stock alerts en admin;
- revisar manualmente UX fina de checkout pickup/envio local en navegador;
- revisar responsive mobile/tablet;
- validar copy legal/comercial.

## CI / Merge Gate

Implementado:

- Workflow `.github/workflows/ci.yml`.
- Job `quality`: dependencias, Prisma, DB seed, lint, typecheck, unit tests y build.
- Job `e2e`: Playwright Chromium contra app local y PostgreSQL de CI.
- Documentacion de reglas de proteccion en `docs/ci-cd-quality-gates.md`.

Pendiente manual en GitHub:

- Activar ruleset de `main`.
- Exigir status checks `quality` y `e2e` antes de merge.
