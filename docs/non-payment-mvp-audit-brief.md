# Auditoria MVP sin pagos reales - Brief para Claude

Fecha: 2026-06-24.

## Proposito

Este documento define una tarea de auditoria y planificacion para robustecer el MVP de Castillo Auto Parts sin depender de pagos reales.

Los pagos reales quedan congelados hasta el gate de salida a produccion. No se debe avanzar Wompi real, credenciales sandbox, webhooks reales, conciliacion, reembolsos reales ni DTE real dentro de esta auditoria.

## Contexto actual

El MVP ya tiene:

- home, catalogo, detalle de producto, filtros y compatibilidad vehicular;
- carrito guest firmado por cookie;
- checkout guest con retiro en bodega y envio local;
- mapa/pin manual para envio local;
- pago simulado asincrono;
- orden `PAYMENT_PROCESSING`, pago `PENDING` y reserva temporal de inventario;
- procesador idempotente de eventos de pago usado por mock y webhook;
- admin de ordenes, productos, inventario, ajustes de entrega, auditoria y avisos de stock;
- emails transaccionales con provider configurable;
- CI con lint, typecheck, unit, build y E2E;
- preparacion de produccion parcial: pooling, CSP `Report-Only`, checklist operativo, DTE manual documentado;
- fase 5 de calidad/performance/SEO documentada.

## Regla principal

No tocar integracion de pagos reales.

Permitido:

- auditar UX, flujo cliente, admin, inventario, emails, fulfillment, SEO, accesibilidad, performance, testing, documentacion y seguridad no relacionada con dinero real;
- proponer mejoras de pago real solo como pendientes de preproduccion, sin implementarlas;
- revisar que el flujo mock actual no confunda al cliente ni rompa QA.

No permitido sin aprobacion explicita de Eliezer:

- cambiar `PAYMENT_PROVIDER`;
- modificar Wompi real, firma de webhook, idempotencia de pagos o conciliacion;
- agregar dependencias;
- cambiar schema Prisma;
- modificar reglas de inventario atomico;
- cambiar auth/autorizacion transversal;
- implementar DTE real;
- hacer redisenos visuales grandes;
- hacer refactors amplios sin hallazgo concreto.

## Archivos que Claude debe leer primero

Lectura obligatoria:

- `docs/mvp-current-status.md`
- `docs/learning-file.md`
- `docs/project-file-map.md`
- `docs/product-requirements.md`
- `docs/roadmap.md`
- `docs/plan-de-trabajo.md`
- `docs/auditoria.md`
- `docs/phase-5-quality-performance-seo.md`
- `docs/production-operations-checklist.md`
- `CLAUDE.md` si existe en el repo

Lectura por area:

- Cliente/catalogo/carrito/checkout:
  - `src/app/page.tsx`
  - `src/app/catalog/page.tsx`
  - `src/app/product/[slug]/page.tsx`
  - `src/app/cart/page.tsx`
  - `src/app/checkout/page.tsx`
  - `src/lib/cart-state.ts`
  - `src/lib/orders.ts`
  - `src/lib/checkout.ts`
- Admin:
  - `src/app/admin/**`
  - `src/lib/admin-auth.ts`
  - `src/lib/admin-orders.ts`
  - `src/lib/admin-products.ts`
  - `src/lib/fulfillment.ts`
  - `src/lib/stock-alerts.ts`
- Emails:
  - `src/lib/email/**`
- Tests:
  - `tests/e2e/**`
  - `src/**/*.test.ts`
  - `.github/workflows/**`

## Areas a auditar

### 1. Flujo cliente

Revisar:

- home, catalogo y detalle de producto;
- busqueda y filtros;
- carrito guest;
- checkout pickup y envio local;
- estados vacios;
- errores de stock;
- aviso de disponibilidad;
- orden creada y pagina de seguimiento;
- responsive mobile/tablet/desktop;
- copy visible en espanol.

Buscar:

- fricciones de compra;
- mensajes confusos;
- validaciones incompletas;
- estados visuales faltantes;
- problemas de accesibilidad;
- gaps de E2E.

### 2. Admin operativo

Revisar:

- ordenes;
- detalle de orden;
- productos;
- inventario;
- ajustes de entrega/retiro;
- auditoria;
- avisos de stock;
- roles y permisos ya existentes.

Buscar:

- acciones peligrosas sin confirmacion;
- cambios sin auditoria;
- errores de permisos por rol;
- vistas que no muestran suficiente contexto operativo;
- filtros faltantes;
- estados inconsistentes.

### 3. Inventario y fulfillment sin pagos reales

Revisar:

- bodega unica modelada para crecer;
- estados de stock;
- reservas;
- expiracion;
- avisos de stock;
- retiro en bodega;
- zonas de entrega local.

Buscar:

- inconsistencias de disponibilidad;
- edge cases de cantidades;
- operacion manual dificil para admin;
- falta de reportes simples para reabastecimiento.

### 4. Emails y comunicacion

Revisar:

- confirmacion de orden;
- actualizaciones de estado;
- aviso de stock;
- reset de password;
- provider de email;
- templates;
- copy y datos minimos.

Buscar:

- emails necesarios para el MVP que todavia no existan;
- templates incompletos;
- falta de pruebas;
- riesgo de configurar mal proveedor en produccion.

### 5. UX, accesibilidad, SEO y performance

Revisar:

- navegacion;
- jerarquia visual;
- consistencia de componentes;
- focus states;
- labels y formularios;
- metadata publica;
- sitemap/robots;
- imagenes;
- consultas DB y cache;
- responsive smoke.

Buscar:

- problemas que afecten conversion;
- texto truncado o dificil de leer;
- acciones sin feedback;
- paginas privadas indexables;
- consultas innecesariamente pesadas.

### 6. QA y CI

Revisar:

- cobertura unit;
- cobertura E2E;
- pruebas fragiles;
- gaps de regresion;
- scripts;
- GitHub Actions.

Buscar:

- tests que pasan pero no validan comportamiento real;
- flujos criticos sin E2E;
- dependencias no documentadas para correr local;
- oportunidades de dividir smoke/regresion.

## Entregables esperados de Claude

Claude no debe implementar fixes en esta tarea. Debe entregar documentos.

Crear:

1. `docs/non-payment-mvp-audit.md`
2. `docs/non-payment-mvp-work-plan.md`

### Formato de `docs/non-payment-mvp-audit.md`

Debe incluir:

- resumen ejecutivo para QA;
- lista priorizada de hallazgos;
- seccion "Lo que si esta bien hecho";
- seccion "Lo que no pude verificar sin adivinar";
- matriz de riesgo por area;
- recomendaciones de prueba manual.

Cada hallazgo debe usar este formato:

- ID: `NP-001`, `NP-002`, etc.
- Severidad: `P0`, `P1`, `P2`, `P3`.
- Area: cliente, admin, inventario, emails, UX, SEO, performance, QA, docs, seguridad.
- Ubicacion: archivo/ruta con enlaces o paths concretos.
- Evidencia: que se observo.
- Por que importa: explicado en lenguaje claro para QA/negocio.
- Riesgo: que puede pasar si no se corrige.
- Solucion propuesta: concreta y acotada.
- Esfuerzo: `S`, `M`, `L`.
- Criterios de aceptacion.
- Como verificar.
- Dependencias.

### Formato de `docs/non-payment-mvp-work-plan.md`

Debe incluir un plan estructurado por fases, sin pagos reales:

- Fase A: quick wins seguros.
- Fase B: flujo cliente y conversion.
- Fase C: admin operativo e inventario.
- Fase D: emails, comunicacion y soporte.
- Fase E: accesibilidad, SEO y performance.
- Fase F: QA, CI y documentacion.

Cada tarea debe incluir:

- ID de tarea;
- hallazgos relacionados;
- objetivo;
- archivos probables;
- criterios de aceptacion;
- como verificar;
- dependencias;
- riesgo;
- modelo de IA recomendado;
- si requiere aprobacion previa de Eliezer.

## Severidad sugerida

- `P0`: bloquea uso seguro del MVP o puede causar perdida de datos/ordenes/inventario.
- `P1`: afecta compra, operacion admin o confianza del cliente.
- `P2`: mejora importante de UX, QA, performance o mantenibilidad.
- `P3`: polish, documentacion o mejora menor.

## Reglas de ejecucion para Claude

1. No cambiar codigo en esta tarea.
2. No crear dependencias nuevas.
3. No tocar pagos reales.
4. No inventar hechos: si algo no se puede verificar, ponerlo en "Lo que no pude verificar sin adivinar".
5. Priorizar hallazgos accionables sobre opiniones generales.
6. Citar archivos, rutas o tests concretos.
7. Mantener el plan ordenado por dependencias.
8. Separar "auditoria" de "implementacion".
9. Si encuentra un posible bloqueante de seguridad, documentarlo, pero no tocar auth transversal sin aprobacion.
10. Si sugiere cambios a schema Prisma, marcarlos como "requiere aprobacion".

## Prompt sugerido para Claude

```text
Lee `docs/non-payment-mvp-audit-brief.md` completo.

Objetivo:
Haz una auditoria del MVP de Castillo Auto Parts enfocada solamente en areas que NO dependen de pagos reales.

No implementes codigo.
No modifiques pagos reales, Wompi, webhooks, conciliacion, reembolsos ni DTE real.

Entrega:
1. `docs/non-payment-mvp-audit.md`
2. `docs/non-payment-mvp-work-plan.md`

Sigue exactamente el formato de hallazgos y plan descrito en el brief.
Prioriza hallazgos accionables, con ubicacion concreta, criterios de aceptacion y como verificar.
Si algo no se puede verificar sin acceso externo o sin adivinar, ponlo en la seccion correspondiente.
```
