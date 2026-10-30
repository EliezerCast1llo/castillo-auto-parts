# Contexto del proyecto — Castillo Auto Parts

## Actualización vigente — 30 oct 2026 / #115

#115 prepara envío nacional con dirección, referencia, paquetes, proveedor asíncrono, promoción y snapshot. Con SHIPPING_PROVIDER vacío solo se puede pagar retiro; nacional ofrece WhatsApp. Boxful real sigue bloqueado por #91 (IDs, credenciales, guías, rastreo y saldo). La migración es aditiva y los históricos siguen legibles. No se autoriza merge/despliegue. Ver [contrato y operación del envío nacional](national-shipping.md).


Actualizado: **23 de octubre de 2026**. Fuente de estado y decisiones vigentes:
[Estado actual del MVP](mvp-current-status.md); cola aprobada:
[Roadmap e issues](roadmap.md). Meta: **compra real posible el 20 de diciembre de
2026**. Las guías de fases de mayo/junio son [históricas](historical-phases.md).

## Visión y alcance aprobado

E-commerce de repuestos propios para consumidor final en El Salvador. Catálogo
con compatibilidad por marca/modelo/año, compra como invitado o con cuenta,
precios en USD con IVA del 13% incluido y una bodega inicial. Retiro gratuito y
**envíos nacionales con Boxful por API desde el día 1**: esta cobertura es el
requisito aprobado, todavía no la capacidad de las tarifas locales actuales.

Decisiones del 21–22 de octubre recogidas en #97 y el backlog del 22:

- **Marca definitiva:** Castillo Auto Parts. La decisión de nombre no acredita
  registro legal ni compra del dominio.
- **Pago completo en línea desde el día 1:** Wompi SV previsto, con validación de
  credenciales reales y reconciliación pendientes en B4/#90.
- **Railway:** web, PostgreSQL, cron y backups; preparación en código fusionada,
  configuración y operación real pendientes de acreditar.
- **Boxful por API:** cotización en checkout, creación de guías y rastreo nacional
  en B5/#91. El equipo propio y las tarifas San Salvador/Santa Tecla del plan
  antiguo no definen el alcance nacional aprobado.
- **DTE manual inicial para consumidor final:** el contador define los datos y
  tratamiento fiscal; el flujo de registro por pedido de B6/#92 está pendiente.
- **GitHub Issues y PR:** coordinación y aceptación del trabajo. La configuración
  de un GitHub Project es opcional y no se da por realizada.

No volver a elegir marca, plataforma o proveedor sin una nueva decisión del
propietario. Las alternativas del estudio inicial son contexto histórico.

## Estado de implementación y bloqueos

Catálogo, búsqueda, compatibilidad, carrito, checkout invitado, cuentas, pedidos,
admin con roles, retiro, SEO e i18n es/en están implementados y probados en CI.
También existen importación CSV, preparación de Railway/backups y monitoreo
opcional. Ver evidencia y límites en [Estado actual](mvp-current-status.md).

No confundir eso con autorización de ventas reales. Quedan por resolver dominio
y correo verificado (B3), validación/reconciliación Wompi (B4), Boxful (B5), DTE
(B6), textos/páginas de políticas (B7), carga y validación del catálogo real y QA
contra producción (B10). Sociedad, contador, acceso a proveedores y aprobación de
políticas/datos corresponden al propietario. Este corte no verifica sus paneles
externos ni un despliegue público real.

## Rol del propietario y forma de trabajo

El propietario actúa como QA/Product Owner: prioriza, aprueba el alcance,
responde decisiones de negocio, revisa PR y autoriza merge y despliegue. Codex
implementa tareas en ramas `codex/<slug>` y presenta cambios revisables con
pruebas y límites conocidos. Referencia: [Seguimiento](project-tracking.md).

Las especialidades de producto, diseño, backend, frontend y QA del plan inicial
sirven para organizar trabajo; no implican un equipo de agentes ejecutándose ni
un permiso para publicar o contactar proveedores.

## Reglas críticas

- No almacenar tarjetas ni publicar secretos o datos personales en Git/issues.
- Recalcular importes y comprobar stock en servidor; reservar inventario para el
  pago pendiente y confirmar/descontar una sola vez al confirmar el pago.
- Procesar eventos de pago y cambios de inventario de forma idempotente.
- Guardar dirección legible además de coordenadas cuando hay envío.
- Proteger admin por autenticación y roles; auditar cambios sensibles.
- Cada pedido pagado debe tener un estado fiscal claro al completar B6; la
  existencia del modelo DTE no prueba emisión ni cumplimiento fiscal.
- No usar mock de pagos, correo console ni datos de demostración como evidencia
  comercial. No eludir la validación de entorno productivo con banderas E2E.
- CI `quality` y `e2e` aprobados, revisión y aprobación del propietario antes de
  merge. No desplegar ni ejecutar una compra real sin su autorización.

## Referencias operativas

- [Despliegue de producción Railway](deploy-production-railway.md).
- [Backups y restauración](database-backups.md).
- [Monitoreo y alertas](observability.md).
- [Carga CSV del catálogo](catalog-csv-import.md).
- [Checklist operativo](production-operations-checklist.md).
- [CI y merge gates](ci-cd-quality-gates.md).
- [Diseño histórico del DTE manual](phase-4-dte-manual-bridge.md), referencia para
  el issue vigente B6/#92, no prueba de implementación.
