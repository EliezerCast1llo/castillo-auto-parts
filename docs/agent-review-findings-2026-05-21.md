# Agent Review Findings - 2026-05-21

Revision consolidada despues de aplicar hardening MVP y agregar CI.

## Resumen Ejecutivo

El MVP ya tiene flujo guest-first funcional, pago simulado, admin operativo, auditoria, avisos de stock, validaciones de cobertura y pruebas automatizadas iniciales.

El siguiente control importante era evitar que una rama rompa el proyecto al mergearse. Se agrego CI con GitHub Actions para ejecutar validaciones en cada PR/push a `main`.

## Hallazgos De Agentes Ya Aplicados

### QA Agent

Aplicado:

- Playwright E2E inicial para catalogo, carrito, checkout local y admin stock alerts.
- PR template actualizado para exigir evidencia de pruebas.
- CI agrega jobs `quality` y `e2e` para que las pruebas corran fuera de la Mac local.

Pendiente:

- Base E2E aislada por test/run para evitar consumo de inventario compartido.
- Cobertura responsive automatizada en mobile/tablet.
- Pruebas de componentes para `QuantityStepper` y `CheckoutLocationPicker`.

### Security / Compliance Agent

Aplicado:

- Rate limit en login admin.
- Rate limit en solicitudes de stock alert.
- Cookies admin/cart firmadas y endurecidas para produccion.
- Headers de seguridad base.
- Bloqueo de pago mock en produccion.
- Redaccion de token de acceso a orden en logs de email.
- Vista publica de orden protegida por token.

Pendiente:

- Auth admin real con usuarios, roles y posiblemente MFA.
- CSP con dominios finales de mapas, pagos e imagenes.
- Auditoria con actor real, IP y user-agent cuando exista auth final.
- Politica de retencion de PII.

### Backend Agent

Aplicado:

- Compatibilidad vehicular estructurada para filtros.
- Checkout revalida stock y descuenta en transaccion durante pago mock confirmado.
- Cancelacion/reembolso desde estado pagado restaura inventario.
- Estados terminales no se reabren desde admin actual.
- Validacion server-side de zona por `deliveryZoneSlug`.
- Validacion inicial de coordenadas por rango de zona.
- Deduplicacion de avisos de stock abiertos.

Pendiente:

- Webhook real con firma e idempotencia por evento externo.
- Reserva de inventario o manejo formal de concurrencia para pago real.
- Multi-bodega real con seleccion de bodega/default location.
- Constraints adicionales para inventario no negativo y movimientos auditados.

### Frontend / UX Agent

Aplicado:

- Home separada de catalogo; filtros avanzados viven en `/catalog`.
- Catalogo con filtros via query params, chips activos y busqueda por vehiculo.
- Cards de producto mas consistentes y labels de stock en espanol.
- Selector de cantidad tipo stepper editable.
- Direccion visual base `Taller Tecnico Moderno`.

Pendiente:

- Pruebas visuales/responsive sistematicas.
- Refinar sistema visual final cuando marca quede validada.
- Componente visual final para imagenes reales de producto.

### Documentation Agent

Aplicado:

- `docs/mvp-current-status.md` como fuente rapida de estado.
- `docs/learning-file.md` como memoria viva.
- `docs/project-file-map.md` para ubicar archivos y responsabilidades.
- `docs/ci-cd-quality-gates.md` para CI y proteccion de `main`.
- Actualizaciones de roadmap, QA, seguridad y arquitectura.

Pendiente:

- Mantener documentos historicos marcados como historicos si quedan obsoletos.
- Crear decision records cuando se elijan proveedor de pago, DTE, auth y marca final.

## Lo Que Cambio En Esta Iteracion

- Se agrego `.github/workflows/ci.yml`.
- Se documentaron quality gates en `docs/ci-cd-quality-gates.md`.
- Se agrego mapa de archivos en `docs/project-file-map.md`.
- Se actualizo la memoria del proyecto para incluir CI y estado actual.
- Se agrego este consolidado de hallazgos.
- Se reforzo el PR template con evidencia de checks CI.

## Aprendizajes Relevantes

- Las pruebas locales no bastan: el bloqueo de merge debe vivir en GitHub.
- `quality` y `e2e` separados dan feedback mas claro y permiten exigir checks independientes.
- Atender advertencias de tooling temprano evita deuda tecnica silenciosa; la migracion futura a `prisma.config.*` queda en backlog porque debe probarse sin afectar `tsc` ni Prisma CLI.
- El pago mock sirve para avanzar MVP, pero debe seguir aislado por ambiente.
- La documentacion debe apuntar a una fuente de verdad actual; los documentos de fase conservan historia.
- Un agente futuro necesita un mapa de archivos para no tocar zonas equivocadas.
- En Mac con Documents/iCloud, archivos `dataless` pueden parecer normales pero colgar comandos que intentan leerlos; esto debe tratarse como problema de entorno local, no de codigo.

## P0 Antes De Produccion Comercial

- Elegir proveedor real de pago y probar sandbox.
- Implementar webhook verificado e idempotente.
- Definir proceso fiscal DTE con contador/proveedor.
- Reemplazar login admin temporal por auth real.
- Validar marca comercial antes de dominio/campanas.
- Configurar branch protection/ruleset en GitHub para exigir `quality` y `e2e`.

## P1 Tecnico Siguiente

- Crear tests de integracion para transiciones de orden e inventario.
- Aislar base E2E por run.
- Agregar coverage report para `src/lib/**` y `src/data/**`.
- Revisar formularios admin con limites de longitud y validaciones consistentes.
- Preparar decision record para proveedor de auth.
- Migrar `package.json#prisma` a `prisma.config.*` cuando se valide el comportamiento local/CI sin cuelgues ni impacto en typecheck.

## Regla Operativa Para Nuevos PRs

Todo PR que toque flujo de venta, inventario, ordenes, admin, pagos, DTE o seguridad debe actualizar:

- tests automatizados relevantes;
- checklist QA;
- `docs/learning-file.md` si cambia una decision;
- documento de fase correspondiente si cambia alcance;
- evidencia de CI en el PR.
