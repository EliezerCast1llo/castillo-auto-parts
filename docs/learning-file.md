# Learning File - Castillo Auto Parts

## Proposito

Este archivo resume lo aprendido y decidido durante el proyecto para que cualquier IA, colaborador o agente pueda continuar sin depender del historial del chat.

Actualizar este archivo cuando cambien decisiones importantes, riesgos, arquitectura, reglas del negocio o estado de implementacion.

## Estado Actual

- Fecha de ultima actualizacion: 2026-05-20.
- Repo: `EliezerCast1llo/castillo-auto-parts`.
- Rama principal: `main`.
- Codename: `Castillo Auto Parts`.
- Marca final: pendiente.
- Producto: e-commerce de repuestos automotrices para El Salvador.
- Mercado inicial: San Salvador y Santa Tecla.
- Horizonte objetivo: MVP robusto en aproximadamente 3 meses.

## Rol Del Humano

El humano es QA / Product Owner tecnico.

Responsabilidades:

- aprobar o rechazar entregables;
- revisar UX y responsive;
- priorizar features;
- validar bugs y edge cases;
- revisar checklists QA;
- proteger el alcance;
- decidir negocio, pagos, DTE, inventario y marca.

## Vision Del Producto

Crear una tienda online moderna, rapida y confiable para comprar repuestos automotrices, evitando experiencias tipo catalogo viejo o busqueda torpe.

La experiencia debe sentirse mas cercana a retail moderno tipo Siman, pero adaptada a autopartes:

- busqueda por vehiculo;
- busqueda por SKU o numero de parte;
- compatibilidad visible;
- filtros basicos pero potentes;
- precio claro;
- stock claro;
- compra guest;
- pago online;
- retiro o envio local;
- admin operativo.

## Decisiones De Negocio

- Inventario: propio.
- Data inicial: mock data mientras se valida inventario real.
- Compra guest: obligatoria desde MVP.
- Moneda: USD.
- IVA: 13%, precios visibles con IVA incluido; no mostrar un calculo separado de IVA en el desglose de compra.
- Pago MVP: pago completo en linea, simulado por plataforma web hasta integrar proveedor local.
- Pago objetivo: Wompi SV.
- Pago fallback: BAC Compra Click.
- Stripe: no es prioridad por limitaciones locales.
- DTE: proceso semiautomatico inicial.
- DTE futuro: proveedor API o integracion mas automatizada.
- Entrega inicial: equipo propio.
- Entrega futura: tercerizada para departamentos.
- Retiro en bodega: gratis, con horarios/dias pendientes.
- En retiro en bodega no se solicitan campos de entrega a domicilio; se muestra direccion/mapa de bodega.
- Envio Santa Tecla: referencia USD 2.
- Envio San Salvador: referencia USD 3 a USD 5.
- Direccion: mapa, ubicacion actual y pin manual.
- Idioma: espanol principal, opcion/base para ingles.
- Bodega: una bodega inicial, escalable a multiples bodegas.
- Estado de orden para compra pagada: `PAID_PENDING_SHIPMENT`, mostrado al cliente como "pendiente de entrega".

## Marca

`Castillo Auto Parts` se usa solo como codename/propuesta provisional.

Aprendizaje importante:

- Se encontraron coincidencias publicas relevantes con `Castillo Auto Parts`, `Repuestos Castillo` y `Auto Repuestos Castillo` en El Salvador.
- No aprobar marca publica sin revision formal en CNR/Registro de Comercio y asesoria legal.

Documento clave:

- `docs/phase-1-name-clearance.md`

## Inventario Y Mercado

Hipotesis inicial:

- Catalogo visible inicial: 50 a 80 SKUs.
- Inventario fisico inicial: 25 a 40 SKUs.
- Categorias iniciales: filtros, frenos, bujias, escobillas, focos y fluidos.

Vehiculos foco:

- Toyota Corolla;
- Nissan Sentra;
- Toyota Hilux;
- Nissan Rogue;
- Hyundai Accent;
- Hyundai Elantra;
- Honda Civic;
- Nissan Frontier;
- Kia Forte;
- Kia Soul;
- Kia Rio;
- Nissan Versa;
- Toyota Yaris;
- Toyota Tacoma;
- Mitsubishi Mirage.

Aprendizaje importante:

- Un estudio de escritorio no da 80-90% de confianza para compra de inventario.
- Para llegar a 80-90% se necesita validar con talleres, proveedores, margen, disponibilidad, compatibilidad y prueba comercial.
- Se adapto un flujo de scoring tomado del agente de busqueda de empleo.

Documentos clave:

- `docs/phase-1-market-research-report.md`
- `docs/phase-1-market-validation-protocol.md`
- `docs/commercial-validation-workflow.md`
- `docs/templates/sku-scorecard.csv`
- `docs/templates/provider-scorecard.csv`

## Proveedores

Se puede buscar proveedores en China/Japon, pero con controles:

- evitar falsificaciones;
- pedir muestras;
- revisar certificaciones;
- validar compatibilidad;
- calcular landed cost;
- comprar pequeno al inicio;
- evitar piezas criticas de seguridad sin certificacion.

Agente agregado:

- Procurement / Supply Chain Agent.

Documento clave:

- `docs/phase-1-sourcing-plan.md`

## Seguridad

Se agrego un Security / Compliance Agent.

Debe revisar:

- auth;
- admin;
- pagos;
- webhooks;
- DTE;
- secretos;
- roles;
- despliegue;
- datos personales.

Reglas criticas:

- No almacenar tarjetas.
- No exponer secretos.
- Validar webhooks server-side.
- Procesar webhooks de forma idempotente.
- Proteger rutas admin.
- No descontar inventario dos veces.

Hallazgos 2026-05-20:

- Existe una contrasena admin local temporal en `.env`; no debe versionarse y debe rotarse antes de cualquier deploy publico.
- Antes de produccion se debe bloquear `PAYMENT_PROVIDER=mock` en `NODE_ENV=production`.
- El login admin necesita rate limit simple para reducir fuerza bruta.
- Las paginas publicas de orden deben protegerse con token guest firmado/hasheado antes de manejar datos reales.
- Agregar headers de seguridad en `next.config.ts`.
- Firmar cookie de carrito guest o mover carrito guest a DB cuando suba el riesgo.

Implementado en rama `codex/security-hardening-mvp`:

- Rate limit por IP para login admin.
- Rechazo de credenciales admin debiles en produccion.
- Cookie admin con `SameSite=strict`.
- Bloqueo del proveedor de pago mock en produccion.
- Headers de seguridad base.
- Limites de longitud en inputs de checkout.

Implementado en rama `codex/order-access-token`:

- Las ordenes guest publicas requieren `?token=...`.
- La base de datos guarda solo `accessTokenHash`, no el token plano.
- Checkout redirige a `/orders/{orderNumber}?token={token}` despues de crear la orden.

Implementado en rama `codex/cart-cookie-hardening`:

- La cookie guest `castillo_guest_cart` queda firmada con HMAC.
- En produccion no se aceptan carritos unsigned/legacy.
- La cookie guest usa `secure` en produccion.

Implementado en rama `codex/catalog-production-fallback`:

- El catálogo solo usa mock data fuera de producción.
- Si PostgreSQL falla en producción, se muestra estado temporalmente no disponible.
- Home no muestra inventario mock si la base de datos no responde.

Documento clave:

- `docs/security-hardening-plan.md`

## Agentes Del Proyecto

- Product Agent.
- Market Research Agent.
- Marketing/SEO Agent.
- UX/UI Agent.
- Frontend Agent.
- Backend Agent.
- QA Agent.
- Security / Compliance Agent.
- Procurement / Supply Chain Agent.
- Codex Orchestrator.

Documento clave:

- `docs/agent-workflow.md`

## Diseño Y UX

Direccion visual:

- moderno;
- limpio;
- retail;
- confiable;
- fitment-first;
- no catalogo viejo;
- no racing/tuning agresivo;
- no landing decorativa.

Paleta provisional:

- Azul profundo: `#12324A`.
- Verde: `#19A974`.
- Amarillo: `#F2B705`.
- Gris claro: `#F5F7F8`.
- Carbon: `#1E252B`.
- Blanco: `#FFFFFF`.

Decision visual 2026-05-20:

- Se adopta `Taller Tecnico Moderno` como sistema visual base del MVP.
- Header debe buscar realmente en catalogo.
- Home no debe tener filtros; los filtros viven en `/catalog`.
- Catalogo debe mostrar chips de filtros activos.
- Home debe incluir busquedas populares para validar demanda.
- Carrito debe mostrar SKU y senales de revision antes de pagar.

Canva:

- Plugin disponible.
- No hay brand kits configurados en Canva para esta cuenta.
- Se generaron 4 candidatos de documento visual para `Castillo Auto Parts - UI Design Direction MVP`.
- Se creo una ruta local `http://localhost:3000/design` para ver catalogo y producto materializados como UI real.
- Se agrego investigacion UX/UI y teoria de color en `docs/design-ux-research.md`.
- Tema base actualizado a `Taller Tecnico Moderno`.
- El outline de Canva tiene 5 paginas propuestas: objetivo, 3 identidades visuales y comparacion MVP.
- El QA/PO eligio el candidato 1 y se convirtio en diseno editable de Canva.

Documentos clave:

- `docs/design-agent-brief.md`
- `docs/design-qa-checklist.md`
- `docs/design-canva-sync.md`
- `docs/design-component-guide.md`
- `docs/design-system.md`
- `docs/design-ux-research.md`
- `docs/phase-1-brand-ux-direction.md`
- `docs/ui-ux-page-opportunities.md`

## QA

El humano quiere checklists claros para sus tareas de QA.

Se crearon:

- checklist global por feature;
- checklist home;
- checklist catalogo;
- checklist detalle producto;
- checklist carrito;
- checklist checkout guest;
- checklist mapa;
- checklist pagos;
- checklist admin;
- checklist DTE;
- release checklist;
- checklist visual de diseño.

Documentos clave:

- `docs/qa-checklists.md`
- `docs/qa-strategy.md`
- `docs/design-qa-checklist.md`

## Stack Tecnico

Implementado:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Prisma.
- PostgreSQL configurado como datasource.
- Vitest.
- ESLint.
- Mock data inicial.
- Docker Compose para PostgreSQL local.
- Seed Prisma desde mock data.
- Capa de datos `src/data/products.ts` con lectura Prisma y fallback mock.
- Capa de filtros `src/data/catalog-filters.ts` por query params.
- Capa de pagos `src/lib/payments` con `PaymentProvider` y adaptador `mock`.

Decisiones tecnicas:

- Prisma 6 estable por simplicidad.
- Wompi/Pagadito/BAC detras de `PaymentProvider`.
- Proveedor de pagos activo por defecto: `mock`.
- `PAYMENT_PROVIDER` debe quedarse en `mock` hasta que exista adaptador real y credenciales sandbox/produccion.
- DTE detras de `InvoiceProvider`.
- UI inicial con fallback mock mientras se valida PostgreSQL real.
- Home, catalogo y detalle son dinamicos para evitar stock congelado por build.
- Filtros de catalogo via URL para que QA pueda compartir escenarios reproducibles.

Documentos clave:

- `docs/technical-architecture.md`
- `docs/database-schema.md`
- `docs/phase-2-technical-setup.md`
- `docs/phase-3-data-persistence.md`

## Estado Implementado

Ya existe:

- home inicial;
- `/catalog`;
- `/product/[slug]`;
- `/cart`;
- `/checkout`;
- `/orders/[orderNumber]`;
- componentes reutilizables:
  - `SiteHeader`;
  - `ProductCard`;
  - `ProductFilters`;
  - `VehicleSearchPanel`;
  - `StockBadge`;
- mock products enriquecidos con slug, categoria, compatibilidad, stock, descripcion y detalles tecnicos;
- seed inicial de categorias, productos, compatibilidad e inventario;
- capa de datos para catalogo desde Prisma/PostgreSQL;
- fallback mock si PostgreSQL no responde o esta vacio;
- filtros por busqueda, categoria, marca, disponibilidad y vehiculo;
- carrito invitado con cookie;
- checkout invitado con retiro en bodega/envio local;
- pago simulado mediante `PaymentProvider`;
- orden en estado `PAID_PENDING_SHIPMENT`;
- registro `Payment` y evento inicial `PaymentEvent`;
- admin básico de órdenes en `/admin/orders`;
- detalle admin en `/admin/orders/[orderNumber]`;
- cambio operativo de estado de orden;
- login temporal admin en `/admin/login`;
- protección de rutas/admin actions mediante cookie firmada `httpOnly`;
- admin de productos en `/admin/products`;
- creación/edición manual de productos en `/admin/products/new` y `/admin/products/[slug]/edit`;
- ajuste manual de inventario para la bodega principal `MAIN`;
- ajustes admin de retiro/zona en `/admin/settings`;
- checkout lee zonas de envío desde `DeliveryZone`;
- tests unitarios de dinero y helpers de producto.

Documentos clave:

- `docs/phase-3-catalog-product.md`
- `docs/phase-3-data-persistence.md`
- `docs/phase-4-cart.md`
- `docs/phase-5-checkout-orders.md`
- `docs/phase-6-payments.md`
- `docs/phase-7-admin-orders.md`
- `docs/phase-7-admin-products-inventory.md`
- `docs/phase-7-admin-fulfillment-settings.md`

## GitHub

Repo:

- `https://github.com/EliezerCast1llo/castillo-auto-parts`

Deploy key:

- configurada y funcionando para push por SSH.

PRs previos:

- project foundation mergeado.
- catalog/product foundation mergeado.
- QA/design workflow mergeado.

Rama actual de trabajo:

- `codex/admin-access-guard`.

Notas actuales:

- Docker Desktop fue instalado por el usuario para correr PostgreSQL local.

## Verificaciones Habituales

Antes de cerrar cambios:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npx prisma validate`
- `npm run build` si toca app/render
- `npm audit`

## Pendientes Importantes

Negocio:

- definir nombre final de marca;
- hablar con contador sobre DTE semiautomatico;
- iniciar validacion con talleres;
- contactar proveedores;
- reautorizar Canva.

Tecnico:

- preparar mapa/pin;
- reemplazar login temporal admin por auth real con roles antes de producción.
- reemplazar pago mock por proveedor local real cuando haya onboarding/credenciales.
- la compatibilidad vehicular debe vivir como datos estructurados; el texto solo debe ser presentacion o busqueda secundaria.
- checkout no debe confiar en ciudad/departamento escritos por el cliente; debe resolver la zona de entrega desde un identificador controlado por servidor.
- las cookies de carrito deben aceptar solo SKUs/cantidades normalizadas para evitar payloads basura o cantidades fuera de rango.
- los cambios de admin deben quedar auditados desde el MVP para rastrear inventario, ordenes y ajustes aunque el login temporal todavia no tenga usuarios nominales.

QA:

- usar `docs/qa-checklists.md` para cada feature;
- crear casos Gherkin por flujo critico;
- agregar Playwright cuando haya flujo navegable.

## Principios Aprendidos

- No comprar inventario fuerte solo por intuicion o busquedas publicas.
- No usar marca publica sin validacion legal/comercial.
- No construir todo de una vez.
- Mock data es aceptable mientras se valida inventario real.
- Las decisiones de pagos, DTE, inventario y mapa son riesgos grandes y deben aislarse con adaptadores.
- WhatsApp debe ser soporte, no reemplazo total del checkout.
- El admin debe ser operativo y sobrio.
- Mobile es obligatorio desde el inicio.
- Los checklists QA son parte central del workflow, no un extra.
