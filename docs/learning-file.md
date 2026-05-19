# Learning File - Castillo Auto Parts

## Proposito

Este archivo resume lo aprendido y decidido durante el proyecto para que cualquier IA, colaborador o agente pueda continuar sin depender del historial del chat.

Actualizar este archivo cuando cambien decisiones importantes, riesgos, arquitectura, reglas del negocio o estado de implementacion.

## Estado Actual

- Fecha de ultima actualizacion: 2026-05-19.
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

Canva:

- Plugin disponible.
- No hay brand kits configurados en Canva para esta cuenta.
- Se generaron 4 candidatos de documento visual para `Castillo Auto Parts - UI Design Direction MVP`.
- Se creo una ruta local `http://localhost:3000/design` para ver catalogo y producto materializados como UI real.
- Se agrego investigacion UX/UI y teoria de color en `docs/design-ux-research.md`.
- Tema base actualizado a `Taller Tecnico Moderno`.
- Pendiente escoger candidato y convertirlo en documento editable final.

Documentos clave:

- `docs/design-agent-brief.md`
- `docs/design-qa-checklist.md`
- `docs/design-canva-sync.md`
- `docs/design-ux-research.md`
- `docs/phase-1-brand-ux-direction.md`

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

Decisiones tecnicas:

- Prisma 6 estable por simplicidad.
- Wompi detras de `PaymentProvider`.
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
- tests unitarios de dinero y helpers de producto.

Documentos clave:

- `docs/phase-3-catalog-product.md`
- `docs/phase-3-data-persistence.md`

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

- `codex/prisma-seed-catalog`.

Notas actuales:

- Docker no esta instalado en la Mac actual; queda pendiente ejecutar `db:push` y `db:seed` contra PostgreSQL real.

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

- ejecutar seed Prisma contra PostgreSQL real cuando Docker este disponible;
- crear carrito guest;
- crear checkout guest;
- preparar mapa/pin;
- preparar admin basico.

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
