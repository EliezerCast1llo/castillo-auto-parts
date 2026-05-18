# Phase 1 Kickoff - Investigacion y decisiones criticas

## Objetivo

Antes de escribir codigo, reducir los riesgos principales del negocio y del MVP:

- saber que repuestos conviene vender primero;
- definir una propuesta inicial de marca;
- elegir candidatos reales de proveedor de pago local;
- definir estrategia inicial para DTE;
- preparar backlog visual para ejecucion.

## Resultado esperado

Al terminar esta fase, el QA/PO debe poder aprobar:

- categorias iniciales;
- propuesta de 50 a 80 SKUs para catalogo;
- propuesta de 25 a 40 SKUs para inventario fisico inicial;
- nombre/marca candidata;
- proveedor de pago a integrar primero;
- estrategia DTE inicial;
- backlog MVP priorizado.

## Entregables creados

- `docs/phase-1-market-research-report.md`
- `docs/phase-1-payments-dte-analysis.md`
- `docs/phase-1-brand-ux-direction.md`
- `docs/phase-1-mvp-backlog.md`

## Duracion sugerida

1 a 2 semanas.

No debe alargarse demasiado: el objetivo es tomar decisiones suficientemente buenas para empezar, no buscar certeza perfecta.

## Workstreams

## 1. Market Research

Responsable: Data / Market Research Agent.

Tareas:

- comparar categorias en Google Trends usando los mismos graficos;
- revisar competidores visibles;
- revisar marketplaces/publicaciones publicas;
- identificar modelos de vehiculo prioritarios;
- proponer categorias con mejor combinacion de demanda, rotacion y riesgo.

Entregables:

- ranking de categorias;
- matriz de scoring;
- propuesta de inventario inicial;
- supuestos y riesgos.

## 2. Marca y posicionamiento

Responsable: Marketing / SEO Agent.

Tareas:

- proponer 5 a 10 nombres;
- revisar claridad, recordacion y tono;
- proponer estilo visual;
- proponer estructura SEO inicial;
- definir tono de comunicacion.

Entregables:

- shortlist de marca;
- tono visual recomendado;
- keywords iniciales;
- categorias SEO.

## 3. Pagos locales

Responsable: Backend Agent + Product Agent.

Tareas:

- comparar Wompi, Pagadito y otros candidatos locales;
- revisar requisitos de onboarding;
- revisar soporte de API/webhook;
- revisar tarifas y tiempos de liquidacion;
- definir proveedor preferido para MVP.

Entregables:

- matriz comparativa;
- recomendacion tecnica;
- riesgos y preguntas para proveedor.

## 4. Facturacion DTE

Responsable: Backend Agent + Product Agent.

Tareas:

- identificar requisitos para emitir DTE;
- decidir integracion directa vs proveedor DTE;
- listar datos fiscales que deben capturarse desde el MVP;
- definir estado inicial: automatico, semiautomatico o revision manual.

Entregables:

- decision recomendada;
- datos obligatorios;
- riesgos fiscales;
- preguntas para contador/proveedor.

## 5. Tracking y backlog

Responsable: Codex Orchestrator + QA Agent.

Tareas:

- convertir roadmap en epics/features;
- preparar issues o backlog local;
- definir estados de tablero;
- definir criterios de aceptacion base.

Entregables:

- backlog MVP priorizado;
- templates de issue;
- checklist QA por feature.

## Criterios de salida

La Fase 1 termina cuando:

- hay una propuesta de inventario inicial revisable;
- el QA/PO aprueba o ajusta el enfoque de marca;
- se elige proveedor de pago para investigar/integrar primero;
- hay estrategia DTE clara para MVP;
- existe backlog priorizado para iniciar setup tecnico.

## Decision recomendada ahora

Arrancar con Market Research y Pagos/DTE en paralelo.

Razon:

- el inventario define el catalogo real;
- pagos y DTE son riesgos tecnicos/comerciales grandes;
- UI y frontend pueden esperar unos dias sin perder velocidad;
- crear codigo antes de estas decisiones puede generar retrabajo.
