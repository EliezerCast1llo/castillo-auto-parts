# Estado actual del MVP — Castillo Auto Parts

Corte: **23 de octubre de 2026**. Base revisada: `main`, commit `64c63a2`
(merge del [PR #111](https://github.com/EliezerCast1llo/castillo-auto-parts/pull/111)).
Meta aprobada: **compra real posible en producción el 20 de diciembre de 2026**.
El MVP tiene flujos funcionales y pruebas locales/CI; **todavía no está acreditado
para abrir ventas reales**. Una integración implementada o un issue cerrado no
prueban que la cuenta, credenciales o servicio externo estén operativos.

## Decisiones del 21 y 22 de octubre de 2026

El plan aprobado, recogido en [B12 / #97](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/97)
y los tickets enlazados, reemplaza el roadmap de fases de mayo/junio:

| Decisión vigente | Consecuencia para el lanzamiento |
| --- | --- |
| Venta a consumidor final | DTE manual inicial; contador y propietario definen datos del receptor y tratamiento del envío en B6. No implica emisión fiscal ya implementada. |
| Cobro completo en línea desde el día 1 | Wompi es el proveedor previsto; no basta el pago simulado. B4 debe validar pagos reales de prueba, reconciliación y reembolsos manuales. |
| Railway como alojamiento | PostgreSQL gestionado, web y cron separados; seguir la guía de producción. Vercel ya no es el destino aprobado. |
| Boxful por API desde el día 1 | Envío nacional con cotización en checkout, guía y rastreo; B5 es requisito del lanzamiento. Las tarifas locales actuales no equivalen a esta integración. |
| Marca definitiva: Castillo Auto Parts | Sustituye la decisión antigua de nombre provisional. Es una decisión de producto; esta revisión no acredita registro legal de marca ni disponibilidad/compra de dominio. |
| Coordinación por GitHub Issues y PR | El issue define alcance y aceptación; el propietario revisa y aprueba merge/despliegue. No hay evidencia aquí de un GitHub Project configurado. |

## Implementado y verificable en el repositorio

“Implementado” describe el comportamiento en código y pruebas, no una certificación
comercial o una validación de cuentas externas.

| Función | Evidencia en el repositorio |
| --- | --- |
| Catálogo y ficha de producto | Rutas `/{locale}/catalog` y `/{locale}/product/[slug]`, datos Prisma y stock; E2E `catalog-cart` y `fixtures`. Producción no debe sustituir una caída de DB por catálogo mock. |
| Compatibilidad marca/modelo/año y búsqueda | Filtros de catálogo, páginas de vehículos y búsqueda de productos; E2E `vehicle-filter`. No se promete compatibilidad por motor. |
| Carrito | Invitado firmado por cookie y carrito de cuenta, cantidades/stock validados; E2E `catalog-cart` y `auth-account`. |
| Checkout invitado y pedidos | Reserva temporal, orden `PAYMENT_PROCESSING`, acceso protegido al pedido, eventos de pago idempotentes, confirmación/liberación de stock; E2E de checkout e idempotencia con pago simulado. |
| Cuentas de clientes | Registro, login, recuperación de contraseña, perfil, direcciones e historial; E2E `auth-account`. Google OAuth requiere configuración propia. |
| Admin y retiro | Roles, pedidos, productos, inventario, auditoría, avisos de stock y ajustes de retiro/zonas. Retiro gratuito; dirección y horarios reales deben confirmarse. |
| SEO e i18n | Metadatos, sitemap/robots, español e inglés publicados con next-intl; pruebas `i18n`, accesibilidad y responsive. El dominio público definitivo sigue en B3. |
| Carga CSV y SKU | B8/#94 y ajustes #103, #107, #109 fusionados; vista previa, validación, auditoría, conservación de campos vacíos y regla SKU compartida. [Guía CSV](catalog-csv-import.md). |
| Preparación Railway | B2/#88 y #101 fusionados: validación de entorno, migraciones, healthcheck DB, seed solo-admin, cron de reservas y backups cifrados con prueba de restauración. [Guía de producción](deploy-production-railway.md). |
| Seguridad y monitoreo | #87 y #99 fusionados; CSP report-only por defecto, enforcement opcional. B9/#95 fusionado: monitoreo opcional, saneamiento, correlación y cupos separados del relay/servidor. [Observabilidad](observability.md). |

## Integraciones incompletas y bloqueos de negocio

| Área | Qué existe | Qué falta / responsable y ticket |
| --- | --- | --- |
| Wompi | Adaptador, creación de enlace, webhook HMAC, procesamiento idempotente y reservas | No hay evidencia de pruebas con credenciales reales. Propietario: sociedad/afiliación y credenciales; implementación y validación de reconciliación y reembolso manual: [B4/#90](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/90). El cambio manual de estado admin no consulta Wompi. |
| Dominio y correo | Resend y plantillas transaccionales; producción rechaza consola/remitente `.local` | Dominio propio, DNS/HTTPS y remitente verificado no acreditados; propietario configura cuentas/DNS y valida entrega real en [B3/#89](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/89). |
| Boxful y cobertura nacional | Envío actual por tarifas locales configurables; campos de peso/medidas disponibles en productos y CSV | API de cotización, guía, mapeo nacional y webhook aún pendientes. Propietario: cuenta/acceso de pruebas, límites y tarifas; desarrollo: [B5/#91](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/91). |
| DTE | Modelo `InvoiceDte`, interfaz y `DTE_MODE=manual`; diseño histórico del puente | No hay flujo que cree/registre el DTE de cada pago. Sociedad, Hacienda y definición con contador; implementación admin/checkout/pago: [B6/#92](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/92). No declarar una factura emitida por la sola existencia del modelo. |
| Catálogo real | Importador y editor listos, incluyendo medidas físicas | Propietario carga y valida datos, stock, precios, compatibilidades, imágenes y medidas de proveedores; desactivar demo siguiendo B8. Ticket técnico cerrado no significa datos reales cargados. |
| Políticas | Página de ayuda con contenido provisional | Propietario aprueba devoluciones, garantía, cancelaciones y entregas; publicar/traducir e incluir enlaces en [B7/#93](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/93). |
| Operación en producción | Configuración versionada para Railway, backups y cron | Propietario crea/configura servicios, secretos y almacenamiento externo; valida restauración, alertas, acceso admin, dirección y horario de retiro. No hay despliegue real verificado en este corte. |
| Monitoreo externo | Canalización opcional lista | Cuenta Sentry sujeta a aprobación; configurar DSN/alertas y vigilar el scheduler. Alertas de Boxful dependen de B5. Variables vacías = sin envío externo. |
| Aprobación de lanzamiento | Suites locales y CI | Regresión de integraciones reales y smoke contra URL pública en [B10/#96](https://github.com/EliezerCast1llo/castillo-auto-parts/issues/96); compra real solo con autorización expresa. |

## Próximos pasos hacia el 20 de diciembre

1. Propietario: resolver sociedad/contador, dominio y accesos Wompi/Boxful; aprobar
   textos de políticas y preparar inventario real. Los accesos se guardan como
   secretos de entorno, nunca en issues o Git.
2. Completar B3–B7 y configurar la infraestructura ya preparada en B2. La
   reconciliación Wompi puede desarrollarse con cliente simulado mientras llega
   la afiliación; no anunciar cobertura nacional hasta completar Boxful.
3. Importar/validar catálogo real, comprobar backups y alertas y registrar
   evidencia operativa. Los valores de demo no son configuración comercial.
4. Ejecutar B10 con las integraciones y URL reales. El propietario decide la
   apertura; el 20 de diciembre es la meta, no una aprobación automática.

El [roadmap vigente](roadmap.md) enumera los tickets abiertos y cerrados. El
[flujo de seguimiento](project-tracking.md) define los estados y aprobaciones.

## Evidencia y límites de la verificación

Fuentes de este corte: código de `main`, tests y estado de GitHub Issues al
23/10/2026. No se inspeccionaron paneles de Railway, DNS, Resend, Wompi, Boxful o
Hacienda; por ello su configuración real queda **pendiente de acreditar**.

Última evidencia de la base: [CI #207 del PR #111](https://github.com/EliezerCast1llo/castillo-auto-parts/actions/runs/39902576649),
con `quality` y `e2e` aprobados: 550 pruebas Vitest, 15 de scripts Node y 108 E2E;
la calidad incluye restauración PostgreSQL y build. Estas cifras son una foto de
esa revisión; no prueban cobros, correos ni envíos reales.

Los [documentos de fases](historical-phases.md) se conservan como histórico.
Sus estados, tarifas y recomendaciones antiguas no reemplazan este documento,
los issues aprobados ni las guías operativas vigentes.
