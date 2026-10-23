# Seguimiento del proyecto — GitHub Issues y PR

Actualizado: **23 de octubre de 2026**. Decisión del plan del 21–22 de octubre:
la coordinación se realiza en [GitHub Issues](https://github.com/EliezerCast1llo/castillo-auto-parts/issues)
y pull requests. Meta del MVP: **20 de diciembre de 2026**. El propietario es
QA/Product Owner y aprueba las entregas, decisiones comerciales y despliegues.

El [estado actual](mvp-current-status.md) resume capacidades y bloqueos; el
[roadmap](roadmap.md) enlaza B2–B10 y #87 con estados verificados. Estos documentos
son una foto fechada; el issue y su PR mantienen el seguimiento posterior.

## Estados de trabajo

| Estado | Evidencia necesaria |
| --- | --- |
| Pendiente | Issue abierto, objetivo, alcance y criterios de aceptación definidos. |
| Bloqueado | Issue abierto con dependencia concreta: credenciales, sociedad/contador, datos o decisión del propietario. Indicar qué desarrollo puede continuar con simuladores. |
| En curso | Rama `codex/<slug>` y trabajo vinculado al issue; no desarrollar directamente en `main`. |
| Listo para revisión | PR con resumen, alcance final, evidencia de verificaciones y límites conocidos; checks `quality` y `e2e` aprobados. |
| Cambios solicitados | QA del propietario pendiente de resolver en el mismo PR; repetir los checks afectados. |
| Entrega técnica cerrada | Aprobación del propietario, merge y cierre del issue. Las tareas de configuración o prueba real que sigan pendientes deben quedar explícitas. |
| Validado para lanzamiento | Evidencia operativa de integraciones reales y B10; aprobación expresa del propietario para abrir ventas. No se deduce de un issue técnico cerrado. |

Los estados son convenciones de seguimiento: no afirman que exista un tablero,
campo o automatización ya configurada en GitHub Projects. Puede añadirse un
Project como vista de los mismos issues, sin duplicar la cola. Las alternativas
Trello/Linear/Notion del plan antiguo no son decisiones actuales de migración.

## Flujo de cada incidencia

1. Leer el issue, comentarios y dependencias; comprobar `main` y el estado real
   de los PR relacionados antes de repetir trabajo ya fusionado.
2. Implementar en la rama indicada por el issue. Si falta un acceso externo,
   documentar el bloqueo; desarrollar/verificar con simuladores cuando el alcance
   lo permita, sin afirmar que la integración real ya fue probada.
3. Abrir PR hacia `main`, vinculado al issue. Incluir problema y comportamiento
   final, validación, cambios de configuración y defectos/limitaciones conocidos.
4. Ejecutar los checks requeridos: `npm run lint`, `npm run typecheck`, `npm test`,
   `npm run test:e2e` y `npm run build` (el runner E2E también construye producción).
   Las credenciales de CI son sintéticas; no acreditan servicios comerciales.
5. Propietario revisa y solicita cambios o aprueba. CI verde es necesario, pero
   no sustituye su aprobación de merge. No se despliega por el mero cierre del PR.
6. Actualizar el seguimiento y registrar los pendientes operativos. Antes del
   lanzamiento completar B10 y la [lista de operación](production-operations-checklist.md).

Para una modificación exclusivamente documental como B12/#97, no inventar
comportamiento de aplicación ni editar código para agregar tests ajenos al cambio:
verificar enlaces, fuentes, fechas y alcance documental; mantener la suite
existente y el CI obligatorio como evidencia de regresión.

## Contenido mínimo de un issue y su PR

- Objetivo, alcance y exclusiones; criterios comprobables.
- Dependencias técnicas y decisiones/datos del propietario, por separado.
- Rama y PR asociados; evidencia de pruebas y estado de CI.
- Resultado de QA y límites que permanezcan después de la entrega.
- Si cambia el alcance del MVP, registrar la decisión aprobada y actualizar
  [Estado actual](mvp-current-status.md) y [Roadmap](roadmap.md).

Nunca incluir credenciales, tokens, datos de tarjetas ni información personal en
issues, logs de evidencia o PR. El propietario configura cuentas, DNS y secretos
en los servicios correspondientes. Crear cuentas de pago, emitir una compra
real, fusionar o desplegar requiere su autorización para esa acción.

La protección efectiva de `main`/rulesets debe comprobarse en GitHub; este archivo
no demuestra que esté habilitada. Referencia: [CI y merge gates](ci-cd-quality-gates.md).
