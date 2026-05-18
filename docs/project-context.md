# Project Context - Repuestos Castillo / e-commerce automotriz

## Proposito

Este documento es el contexto maestro del proyecto. Debe permitir que cualquier IA o colaborador entienda rapidamente que se esta construyendo, por que, que decisiones ya se tomaron y que reglas no deben romperse.

Actualizar este archivo cuando cambien decisiones importantes.

## Vision

Crear una plataforma web e-commerce para vender repuestos automotrices propios en El Salvador, empezando por San Salvador y Santa Tecla, con experiencia moderna, busqueda intuitiva, checkout confiable, pagos en linea, facturacion DTE y operacion admin clara.

El sitio debe sentirse moderno y facil de usar, mas cercano a un retail digital como Siman que a catalogos antiguos y torpes. La prioridad no es una demo rapida, sino un MVP robusto en aproximadamente 3 meses.

## Rol del humano

El humano sera QA / Product Owner tecnico.

Responsabilidades:

- aprobar o rechazar entregables;
- revisar alcance;
- validar UX;
- crear o aprobar casos de prueba;
- priorizar features;
- proteger el proyecto contra cambios innecesarios;
- actuar como cliente final del producto.

## Decisiones tomadas

- Inventario: propio.
- Mercado inicial: El Salvador.
- Zonas iniciales: San Salvador y Santa Tecla.
- Moneda: USD.
- IVA: 13%, precios visibles con IVA incluido.
- Pago MVP: pago completo en linea.
- Proveedor de pago objetivo: Wompi SV.
- Fallback de pago: BAC Compra Click.
- Stripe: no es prioridad inicial.
- Facturacion: DTE semiautomatico inicial, preparando datos para integracion futura.
- Entrega inicial: equipo propio.
- Entrega futura: tercerizada para cobertura departamental.
- Retiro en bodega: gratis, con horarios/dias definidos.
- Envio Santa Tecla: tarifa inicial de referencia USD 2.
- Envio San Salvador: tarifa inicial de referencia USD 3 a USD 5.
- Direccion: debe usar mapa, ubicacion actual y pin manual.
- Compra guest: obligatoria desde MVP.
- Admin MVP: usuario admin con todos los permisos.
- Idioma: espanol principal, opcion/base para ingles.
- Inventario inicial: se definira por estudio de mercado.
- Compatibilidad inicial: marca, modelo y anio.
- Variantes: una sola variante por producto en MVP.
- Bodega: una bodega inicial, modelo preparado para mas.
- Data inicial: mock data mientras se valida inventario real.
- Marca: `Castillo Auto Parts` queda como codename/propuesta provisional; no esta aprobada como marca publica por coincidencias encontradas.
- Repo: se inicio rama local `codex/project-foundation`.

## Reglas criticas

- No almacenar datos de tarjeta.
- No permitir comprar sin stock.
- Validar stock antes de checkout y antes de pago.
- Descontar inventario solo despues de pago confirmado.
- Procesar webhooks de forma idempotente.
- No descontar inventario dos veces por webhook duplicado.
- No guardar solo coordenadas: guardar tambien direccion legible.
- Si no hay stock en checkout, solicitar email o telefono para aviso.
- Cada orden pagada debe tener estado fiscal claro.
- Rutas admin deben estar protegidas.
- Los cambios deben ser pequenos, revisables y documentados.

## MVP esperado

El MVP debe permitir:

- ver home funcional;
- buscar productos;
- filtrar productos;
- ver detalle de producto;
- revisar compatibilidad simple;
- agregar al carrito;
- comprar como invitado;
- comprar como usuario registrado;
- elegir retiro en bodega o envio local;
- seleccionar direccion con mapa/pin;
- pagar en linea con proveedor local;
- crear orden;
- recibir confirmacion;
- descontar inventario;
- ver orden en admin;
- gestionar productos e inventario manualmente;
- preparar estado fiscal DTE.

## Equipo de agentes

- Product Agent: requisitos, alcance y criterios.
- Market Research Agent: demanda, categorias y SKUs.
- Marketing/SEO Agent: marca, SEO, copy y posicionamiento.
- UX/UI Agent: pantallas, flujos, responsive y sistema visual.
- Frontend Agent: componentes, paginas y estados.
- Backend Agent: DB, reglas, pagos, inventario y DTE.
- QA Agent: checklist, Gherkin, pruebas y regresion.
- Security / Compliance Agent: seguridad, privacidad, pagos, webhooks, admin y despliegue.
- Procurement / Supply Chain Agent: proveedores, cotizaciones, MOQ, landed cost y calidad.
- Codex: orquestador, implementador e integrador.

## Documentos relacionados

- `docs/product-requirements.md`
- `docs/technical-architecture.md`
- `docs/database-schema.md`
- `docs/agent-workflow.md`
- `docs/qa-strategy.md`
- `docs/market-research-plan.md`
- `docs/roadmap.md`
- `docs/project-tracking.md`
- `docs/learning-file.md`
- `docs/phase-1-kickoff.md`
- `docs/phase-1-market-research-report.md`
- `docs/phase-1-payments-dte-analysis.md`
- `docs/phase-1-brand-ux-direction.md`
- `docs/phase-1-mvp-backlog.md`
- `docs/phase-1-name-clearance.md`
- `docs/phase-1-market-validation-protocol.md`
- `docs/phase-1-sourcing-plan.md`
- `docs/phase-2-technical-setup.md`
- `docs/phase-3-catalog-product.md`
- `docs/reused-agent-patterns.md`
- `docs/commercial-validation-workflow.md`
- `docs/templates/supplier-outreach.md`
- `docs/templates/workshop-interview.md`
- `docs/templates/sku-scorecard.csv`
- `docs/templates/provider-scorecard.csv`

## Recomendaciones actuales de Fase 1

- Inventario: iniciar con filtros, frenos, bujias, escobillas, focos y fluidos.
- Vehiculos foco: Corolla, Sentra, Hilux, Rogue, Accent, Elantra, Civic, Frontier, Forte, Soul, Rio, Versa, Yaris, Tacoma y Mirage.
- Pagos: Wompi SV como primera opcion tecnica; BAC Compra Click como fallback operativo; Pagadito como alternativa regional.
- DTE: modo semiautomatico inicial; preparar integracion con proveedor API para fase posterior.
- Marca: no aprobar todavia `Castillo Auto Parts` ni `Repuestos Castillo` como nombre publico por coincidencias encontradas.
- UX: fitment-first, con busqueda por vehiculo como elemento principal.

## Preguntas pendientes

- Nombre final de marca.
- Direccion, horario y dias de retiro en bodega.
- Tabla final de tarifas por zonas.
- Proveedor de mapas.
- Alcance exacto de contenido en ingles.
- Tamano final del inventario inicial.
- GitHub remoto y Project.
