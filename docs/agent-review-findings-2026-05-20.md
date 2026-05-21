# Agent Review Findings - 2026-05-20

Revisiones paralelas solicitadas para documentacion, backend/logica, seguridad y QA.

## Aplicado en esta rama

- `docs/mvp-current-status.md` como fuente rapida de estado actual del MVP.
- README actualizado con estado real, Docker/PostgreSQL y Playwright.
- `roadmap.md`, `database-schema.md` y `security-hardening-plan.md` ajustados para no contradecir lo implementado.
- Stock alerts operativos: filtro, metricas, cambio de estado y auditoria.
- Stock alerts con deduplicacion por producto/contacto cuando hay solicitud `OPEN`.
- Rate limit basico para crear avisos de stock.
- `EmailLog` ya no persiste texto con token de acceso a orden sin redaccion.
- Cancelar/reembolsar una orden `PAID_PENDING_SHIPMENT` desde admin restaura inventario de la bodega principal.
- El admin no puede reabrir ordenes terminales (`CANCELLED`/`REFUNDED`) desde el panel actual.
- El servidor valida coordenadas contra rangos aproximados para zonas conocidas.
- PR template exige `npm run test:e2e`.
- E2E ampliado para checkout local y admin de stock alerts.

## P0 Que Requiere Decision o Fase Propia

- Pagos reales: webhook verificado, idempotencia, reserva/descuento de inventario y manejo de `PENDING`.
- Admin auth final: usuarios, roles, MFA o proveedor externo; el login de contraseña unica no es produccion.
- DTE manual MVP: definir proceso fiscal minimo antes de ventas reales.
- Reembolsos reales: definir como se sincronizan con proveedor de pago cuando deje de ser mock.

## P1 Backlog Tecnico

- Filtrar stock por bodega/default location en catalogo y checkout antes de multi-bodega.
- Agregar constraints/validaciones para inventario no negativo y reservas.
- Agregar CSP con dominios de mapa/proveedor final.
- Agregar actor/IP/user-agent a auditoria cuando exista auth real.
- Crear DB aislada para E2E completo de checkout sin consumir inventario local real.

## P2 Backlog

- Convertir strings operativos (`Shipment.status`, `EmailLog.status`, `StockAlertRequest.status`) a enums o parsers centralizados.
- Agregar coverage report para `src/lib/**` y `src/data/**`.
- Agregar tests de componentes para `QuantityStepper` y `CheckoutLocationPicker`.
- Refrescar `phase-1-mvp-backlog.md` o marcarlo como historico.
