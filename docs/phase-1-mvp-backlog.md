# Phase 1 MVP Backlog

## Estado

- Fecha: 2026-05-15.
- Estado: backlog inicial local.
- Herramienta futura recomendada: GitHub Projects.

## Leyenda

- Prioridad: P0 critico, P1 alto, P2 medio, P3 bajo.
- Tipo: Research, Decision, Feature, QA, Spike.
- Estado inicial: Backlog.

## Epics MVP

1. Investigacion de mercado e inventario.
2. Marca y UX.
3. Setup tecnico.
4. Catalogo y producto.
5. Carrito.
6. Checkout, envio y mapa.
7. Pagos.
8. Ordenes.
9. Admin.
10. DTE.
11. QA automatizado.

## Backlog inicial

| ID | Titulo | Tipo | Prioridad | Agente | Estado |
|---|---|---|---|---|---|
| MR-001 | Validar 60 SKUs conceptuales con talleres | Research | P0 | Market Research | Backlog |
| MR-002 | Contactar 3-5 proveedores/mayoristas | Research | P0 | Market Research | Backlog |
| MR-003 | Crear matriz de costo/margen por SKU | Research | P0 | Market Research | Backlog |
| MR-004 | Comparar Google Trends en vivo por categorias | Research | P1 | Market Research | Backlog |
| BR-001 | Elegir nombre de marca | Decision | P0 | Marketing/QA | Backlog |
| BR-002 | Validar dominio y redes sociales | Research | P1 | Marketing | Backlog |
| BR-003 | Crear moodboard UI con 2 direcciones visuales | Design | P1 | UX/UI | Backlog |
| BR-004 | Validar conflicto de nombre Castillo Auto Parts/Repuestos Castillo | Research | P0 | Marketing/Legal | Backlog |
| PAY-001 | Contactar Wompi y validar requisitos | Research | P0 | Product/Backend | Backlog |
| PAY-002 | Contactar BAC Compra Click como fallback | Research | P1 | Product | Backlog |
| PAY-003 | Validar Pagadito como alternativa | Research | P2 | Product/Backend | Backlog |
| PAY-004 | Disenar interfaz `PaymentProvider` | Spike | P0 | Backend | Backlog |
| DTE-001 | Confirmar estrategia DTE con contador | Decision | P0 | Product/Backend | Backlog |
| DTE-002 | Comparar proveedores DTE API | Research | P0 | Backend | Backlog |
| DTE-003 | Definir datos fiscales obligatorios de checkout | Decision | P0 | Product/QA | Backlog |
| TECH-001 | Crear repo GitHub | Feature | P0 | Codex | Backlog |
| TECH-002 | Crear GitHub Project | Feature | P0 | Codex | Backlog |
| TECH-003 | Setup Next.js App Router + TypeScript | Feature | P0 | Frontend | Backlog |
| TECH-004 | Setup Tailwind + shadcn/ui | Feature | P0 | Frontend | Backlog |
| TECH-005 | Setup PostgreSQL + Prisma | Feature | P0 | Backend | Backlog |
| TECH-006 | Setup lint/typecheck/test scripts | Feature | P0 | Codex | Backlog |
| CAT-001 | Crear schema catalogo/productos/categorias | Feature | P0 | Backend | Backlog |
| CAT-002 | Crear seed data inicial | Feature | P0 | Backend | Backlog |
| CAT-003 | Implementar catalogo responsive | Feature | P0 | Frontend | Backlog |
| CAT-004 | Implementar detalle de producto | Feature | P0 | Frontend | Backlog |
| CAT-005 | Implementar busqueda/filtros MVP | Feature | P0 | Frontend/Backend | Backlog |
| CART-001 | Carrito guest con cookie/session segura | Feature | P0 | Backend/Frontend | Backlog |
| CART-002 | Validar stock en carrito | Feature | P0 | Backend | Backlog |
| CART-003 | Totales con IVA incluido | Feature | P0 | Backend/QA | Backlog |
| MAP-001 | Evaluar Google Maps vs alternativas | Spike | P0 | Backend/Frontend | Backlog |
| MAP-002 | Checkout captura ubicacion actual | Feature | P0 | Frontend | Backlog |
| MAP-003 | Checkout permite mover pin manual | Feature | P0 | Frontend | Backlog |
| SHIP-001 | Definir zonas y tarifas iniciales | Decision | P0 | Product/QA | Backlog |
| SHIP-002 | Implementar retiro gratis en bodega | Feature | P0 | Backend/Frontend | Backlog |
| SHIP-003 | Implementar envio San Salvador/Santa Tecla | Feature | P0 | Backend/Frontend | Backlog |
| ORD-001 | Crear orden `PENDING_PAYMENT` | Feature | P0 | Backend | Backlog |
| ORD-002 | Cambiar a `PAID_PENDING_SHIPMENT` tras pago | Feature | P0 | Backend | Backlog |
| ORD-003 | Idempotencia de webhook | Feature | P0 | Backend/QA | Backlog |
| ADM-001 | Login admin | Feature | P0 | Backend/Frontend | Backlog |
| ADM-002 | Admin ver ordenes | Feature | P0 | Frontend/Backend | Backlog |
| ADM-003 | Admin crear/editar productos | Feature | P0 | Frontend/Backend | Backlog |
| ADM-004 | Admin actualizar stock manual | Feature | P0 | Frontend/Backend | Backlog |
| QA-001 | Checklist QA global MVP | QA | P0 | QA | Backlog |
| QA-002 | Gherkin checkout guest | QA | P0 | QA | Backlog |
| QA-003 | Tests unitarios dinero/IVA/stock | QA | P0 | QA/Backend | Backlog |
| QA-004 | Playwright flujo compra guest | QA | P0 | QA/Frontend | Backlog |
| QA-005 | Playwright responsive critico | QA | P1 | QA/Frontend | Backlog |
| SEC-001 | Crear threat model MVP | QA | P0 | Security | Backlog |
| SEC-002 | Checklist seguridad pagos/webhooks/admin | QA | P0 | Security | Backlog |
| PROC-001 | Buscar proveedores locales para 32 SKUs fisicos | Research | P0 | Procurement | Backlog |
| PROC-002 | Buscar proveedores China/Japon para categorias simples | Research | P1 | Procurement | Backlog |
| PROC-003 | Calcular landed cost por proveedor piloto | Research | P1 | Procurement | Backlog |

## Primer sprint recomendado

Duracion: 1 semana.

Objetivo:

- cerrar decisiones de riesgo antes del setup tecnico completo.

Items:

- MR-001
- MR-002
- MR-003
- PAY-001
- DTE-001
- DTE-002
- BR-001
- BR-004
- SHIP-001
- SEC-001

## Criterio de salida del primer sprint

- Inventario inicial aprobado o ajustado.
- Proveedor de pago recomendado aprobado.
- DTE con camino claro.
- Marca candidata elegida.
- Zonas/tarifas de envio definidas.
- Repo/GitHub Project listo para pasar a implementacion.
