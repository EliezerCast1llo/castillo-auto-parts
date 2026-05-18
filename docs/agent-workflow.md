# Agent Workflow - Equipo de IA y QA humano

## Objetivo

Organizar el trabajo de los agentes de IA como un equipo pequeno y disciplinado, con Codex como orquestador y el humano como QA/Product Owner tecnico.

La meta no es producir muchas ideas, sino entregar features pequenas, revisables y aprobables.

## Roles

## Product Agent

Responsabilidades:

- Convertir ideas en requerimientos.
- Definir alcance de MVP.
- Escribir criterios de aceptacion.
- Separar must-have, should-have y later.
- Mantener decisiones del producto.

Entregables:

- feature brief;
- user stories;
- criterios de aceptacion;
- preguntas abiertas.

## Data / Market Research Agent

Responsabilidades:

- Investigar demanda de repuestos.
- Comparar terminos en Google Trends en la misma grafica.
- Revisar senales publicas: competidores visibles, marketplaces, SEO, grupos, talleres.
- Proponer inventario inicial basado en evidencia.

Entregables:

- matriz de demanda;
- ranking de categorias/SKUs;
- supuestos y nivel de confianza;
- riesgos de inventario.

## Marketing / SEO Agent

Responsabilidades:

- Proponer nombre, voz de marca y posicionamiento.
- Definir categorias SEO.
- Proponer contenido para home, categoria y producto.
- Investigar keywords con intencion comercial.

Entregables:

- propuesta de marca;
- estructura SEO;
- copy base;
- lista de keywords.

## UX/UI Agent

Responsabilidades:

- Proponer layout y flujos.
- Definir sistema visual.
- Asegurar mobile-first.
- Definir estados vacios, errores, carga y feedback.

Entregables:

- mapa de pantallas;
- componentes clave;
- recomendaciones responsive;
- criterios visuales para QA.

## Frontend Agent

Responsabilidades:

- Implementar pantallas, componentes y estados.
- Integrar formularios y validaciones.
- Conectar UI con APIs/server actions.
- Mantener accesibilidad y responsive.

Entregables:

- componentes;
- paginas;
- pruebas UI cuando aplique;
- notas de verificacion.

## Backend Agent

Responsabilidades:

- Implementar modelos, endpoints, servicios y reglas de negocio.
- Gestionar Prisma, PostgreSQL, ordenes, inventario, pagos y DTE.
- Proteger integraciones externas.

Entregables:

- schema/migraciones;
- servicios de dominio;
- handlers de webhook;
- tests de reglas criticas.

## QA Agent

Responsabilidades:

- Crear checklist.
- Crear escenarios Gherkin.
- Probar flujos felices y edge cases.
- Sugerir tests automatizados.
- Validar regresiones.

Entregables:

- plan de prueba por feature;
- reporte de bugs;
- criterios de salida;
- matriz de regresion.

## Security / Compliance Agent

Responsabilidades:

- Revisar riesgos de seguridad en auth, admin, pagos, webhooks, DTE y datos personales.
- Definir controles minimos.
- Revisar manejo de secretos.
- Proponer pruebas de seguridad.
- Revisar dependencias y configuracion.
- Asegurar que no se almacenen tarjetas.
- Revisar permisos por rol.

Entregables:

- threat model;
- checklist OWASP;
- checklist de secretos/env vars;
- matriz de riesgos;
- criterios de salida antes de produccion.

Debe participar obligatoriamente en:

- auth;
- admin;
- checkout;
- pagos;
- webhooks;
- DTE;
- despliegue.

## Procurement / Supply Chain Agent

Responsabilidades:

- Buscar proveedores locales e internacionales.
- Comparar cotizaciones.
- Validar MOQ.
- Calcular landed cost.
- Revisar certificaciones.
- Preparar preguntas para proveedores.
- Advertir riesgos de falsificacion, garantia y compatibilidad.

Entregables:

- matriz de proveedores;
- matriz de costo total;
- recomendacion de compra piloto;
- checklist de importacion.

## Codex Orchestrator

Responsabilidades:

- Dividir trabajo en fases pequenas.
- Ejecutar cambios en el repo.
- Coordinar agentes cuando se requiera.
- Mantener documentacion actualizada.
- Entregar al humano algo verificable.

Reglas:

- No implementar todo de una vez.
- No agregar dependencias innecesarias.
- No asumir integraciones reales sin credenciales/proveedor aprobado.
- No mover alcance sin aprobacion.
- Priorizar un MVP funcional.

## Flujo por feature

1. Feature brief
   - problema;
   - usuario;
   - alcance;
   - fuera de alcance;
   - criterios de aceptacion.

2. Diseno funcional
   - flujo;
   - pantallas;
   - estados;
   - datos necesarios.

3. Diseno tecnico
   - modelo;
   - APIs/server actions;
   - validaciones;
   - riesgos.

4. Implementacion
   - cambio pequeno;
   - sin refactors no relacionados;
   - datos seed si aplica.

5. QA
   - checklist;
   - casos Gherkin;
   - pruebas manuales;
   - pruebas automaticas si aplica.

6. Aprobacion humana
   - aprobado;
   - cambios solicitados;
   - rechazado.

## Definition of Ready

Una feature esta lista para implementar cuando tiene:

- usuario objetivo;
- resultado esperado;
- criterios de aceptacion;
- datos necesarios;
- edge cases conocidos;
- impacto en DB o integraciones identificado.

## Definition of Done

Una feature esta terminada cuando:

- cumple criterios de aceptacion;
- no rompe rutas existentes;
- maneja loading/error/empty states;
- pasa pruebas definidas;
- funciona en movil;
- no introduce dependencias innecesarias;
- documenta decisiones relevantes;
- QA humano puede validarla.

## Cadencia sugerida

- Fase 0: documentos y decisiones base.
- Fase 1: investigacion de mercado e inventario inicial.
- Fase 2: setup tecnico.
- Fase 3: catalogo y producto.
- Fase 4: carrito y checkout.
- Fase 5: pagos y ordenes.
- Fase 6: admin e inventario.
- Fase 7: DTE, email y endurecimiento.

## Formato de ticket/feature

```md
# Feature

## Objetivo

## Usuario

## Alcance

## Fuera de alcance

## Criterios de aceptacion

## Datos necesarios

## Riesgos

## Casos QA
```

## Politica de cambios

- Si el cambio afecta pagos, inventario, impuestos o ordenes, requiere QA reforzado.
- Si el cambio afecta UX mobile, requiere screenshot/revision visual.
- Si el cambio cambia base de datos, requiere migracion clara y seed si aplica.
- Si el cambio toca proveedor externo, debe tener modo mock/sandbox.
