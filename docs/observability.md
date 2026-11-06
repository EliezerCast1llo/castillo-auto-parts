# Monitoreo opcional y alertas de producción

Propuesta para #95: **Sentry, plan Developer gratuito**, sujeto a disponibilidad,
cuotas y condiciones vigentes en https://sentry.io/pricing/. El propietario debe
aprobar y crear la cuenta/proyecto. Este cambio no crea cuentas, recursos,
suscripciones ni despliega nada. No habilitar cobro por exceso de cuota.

## Activación y desactivación

1. Tras aprobación, crear un proyecto de errores en Sentry (Other/Node; no instalar
   el snippet/SDK sugerido). Un proyecto separado por entorno evita mezclar alertas.
2. Copiar su DSN HTTPS a `SENTRY_DSN` **solo en el servicio web de Railway**.
   Se admiten DSN de Sentry SaaS con clave pública hexadecimal de 32 caracteres,
   proyecto numérico y hosts `oNUMERO.ingest[.REGION].sentry.io`. Un DSN inválido
   desactiva el envío y genera una advertencia local `INVALID_SENTRY_DSN` al arrancar,
   sin imprimir su valor ni contactar al proveedor. Un DSN vacío no genera advertencias.
   No se admiten hosts arbitrarios o Sentry autohospedado.
3. Opcionalmente fijar `NEXT_PUBLIC_ERROR_MONITORING_ENABLED=true` y reconstruir
   el frontend para capturar errores del navegador. El DSN nunca se publica en
   `NEXT_PUBLIC_*`. El navegador envía únicamente un código fijo al relay del
   mismo origen `/api/monitoring`; no requiere abrir CSP a dominios externos.
4. Dejar ambas variables vacías para desactivar todo envío. Sin DSN tampoco se
   consulta el backlog adicional. Si solo hay DSN se monitorea únicamente servidor.
   Si solo se activa el flag cliente, el relay responde 204 sin leer ni registrar
   su cuerpo ni contactar Sentry. Rebuild necesario al cambiar el flag público.
5. Configurar en Railway el cron de reservas cada cinco minutos según
   [deploy-production-railway.md](deploy-production-railway.md). Es necesario para
   detectar pagos pendientes antiguos; una alerta de errores no reemplaza la
   vigilancia de que el scheduler efectivamente se ejecute.

## Datos, correlación y límites

`logger.ts` aplica una **lista permitida** antes de consola y del transporte:
`level`, `timestamp`, `context` (operación conocida), `outcome` (resultado conocido)
y `correlationId` (UUID aleatorio). Solo en consola se agregan los códigos genéricos
fijos `TYPE_ERROR`, `DATABASE_REQUEST_ERROR`, `INTERNAL_ERROR`, etc. No se copia
libremente `error.name`, que también puede contener datos sensibles.

Desde #119, los errores conocidos de integración usan `OperationalError` con un
catálogo cerrado. Su `errorCode` llega tanto al log como al tag `error_code` de
Sentry (y al fingerprint); los códigos genéricos siguen siendo solo locales:

| Código | Diagnóstico |
| --- | --- |
| `CONFIG_MISSING` | Falta configuración requerida de Wompi, Resend, Upstash o R2. |
| `CONFIG_INVALID` | Configuración inválida o proveedor de prueba prohibido. |
| `PROVIDER_UNAVAILABLE` | Error de red, lectura de respuesta o HTTP 5xx del proveedor. |
| `PROVIDER_REJECTED` | Rechazo HTTP 4xx, error explícito del SDK o respuesta inválida. |
| `WEBHOOK_SIGNATURE_INVALID` | Firma Wompi rechazada; solo info local, sin envío de evento. |
| `SHIPPING_RATE_UNAVAILABLE` | Error o timeout al consultar tarifas; la respuesta sigue siendo `[]`. |

El logger deriva el código del error tipado; no acepta códigos arbitrarios del
contexto ni mensajes de SDK. Redis mantiene su fallback en memoria, pero sin
imprimir errores crudos. R2, Resend y Wompi descartan causas/cuerpos del proveedor.
Se descartan todos los demás campos. No se serializan mensajes, nombres, stacks o causas de errores, cuerpos, URLs,
parámetros, cabeceras, cookies, firmas, emails, nombres, IDs de usuarios/pedidos,
importes, tarjetas, tokens ni claves. No hay SDK con enriquecimiento automático,
tracing, session replay, sourcemaps, perfiles o breadcrumbs. Sentry recibe un
mensaje fijo operación/resultado y esos tags; ve la IP de salida del **servidor**,
no la IP del navegador. El relay usa `credentials: omit` y `no-referrer` en cliente.

Esto reduce detalle diagnóstico a propósito: buscar el UUID en logs estructurados
y revisar el pedido dentro del admin con acceso autorizado, sin pegar información
del pedido en Sentry. El filtro cubre esta canalización; los logs propios de Next,
Prisma, infraestructura y el proveedor de correo en modo console quedan fuera y
requieren su política de acceso/retención. No habilitar EMAIL_PROVIDER=console en
producción. No copiar logs crudos a un colector externo sin revisión específica.

`observeOperation` conserva UUID mediante AsyncLocalStorage, aislado entre
peticiones concurrentes. Checkout y actualización manual de estado del admin
(`reconciliation`) comparten UUID con sus logs internos. Las validaciones esperadas
`AdminOrderStatusError` mantienen su redirección de negocio y solo generan un
resultado informativo `rejected`; no son fallos ni producen envíos a Sentry.
Wompi genera su propio UUID (ignora IDs suministrados por terceros), que devuelve en `x-correlation-id`,
también en errores 401/400/404/422/503. El cron genera un UUID por ejecución y lo
propaga entre lotes; el endpoint solo lo acepta tras autenticar Bearer y validar
su formato. No se registran el Bearer, identificadores del proveedor o payloads.
Las firmas inválidas conservan su 401 y solo generan logs info locales; incluso
un flood no consume el cupo de eventos de error del servidor. Una firma válida
seguida de un fallo real sí produce el evento correspondiente.

Errores no controlados del servidor: hook Next `onRequestError`; errores fatales
Node: `uncaughtExceptionMonitor` sin sustituir el cierre normal. Cliente: eventos
`error`, `unhandledrejection`, boundary de storefront y boundary raíz. No se
suprime el comportamiento normal de errores de Node o del navegador.

El transporte tiene **dos cupos independientes por proceso**: uno para
`client_unhandled` (relay público) y otro para los eventos del servidor. Cada uno
permite **20 intentos/minuto y dos envíos simultáneos** (máximo combinado de 40
intentos/minuto y cuatro en vuelo). Tanto los contadores de volumen como los de
concurrencia están separados: saturar el relay no consume los puestos del servidor.
Cada envío tiene un segundo de timeout, sin reintentos ni redirects. Solo
warn/error salen del servidor; info queda en consola. El relay exige Origin del mismo origen, JSON con
un único código permitido, un máximo de 128 bytes y 20 peticiones/minuto/proceso.
No es autenticación: un cliente puede falsificar Origin o consumir el cupo del
cliente, sin gastar el del servidor. La cuota remota del proyecto Sentry sigue
siendo la que permita el proveedor.
El límite es local a cada proceso, no global al despliegue; mantener cuotas del
proveedor, revisar volumen y contemplar un límite distribuido al escalar. Eventos
pueden perderse por cuota, concurrencia, caída del proveedor o terminación del
proceso; los logs sanitizados siguen disponibles. Nunca depende un pago del éxito
del envío. No hay comprobación de entrega/almacenamiento remoto sin DSN real.

## Alertas mínimas (configurar por el propietario)

En Sentry: proyecto → Alerts → Create Alert → Issues. Crear reglas para nuevos
eventos y eventos que reaparecen; condiciones de tags indicadas abajo; acción
“Send a notification” al propietario/equipo verificado, frecuencia como máximo una
por cinco minutos. La interfaz/acciones disponibles dependen del plan vigente;
si el plan no permite condiciones por tags, usar la búsqueda guardada en Issues
con estas mismas expresiones y notificaciones de nuevos issues del proyecto.

| Regla | Filtro en Issues / condición de tags | Umbral inicial y respuesta |
| --- | --- | --- |
| Wompi falla | `operation:wompi_webhook outcome:failed` | Primer evento: revisar disponibilidad de app/DB/proveedor y UUID; no reintentar cobros manualmente. |
| Webhook rechazado | `operation:wompi_webhook outcome:rejected` (otra regla para `invalid_signature`) | Primera aparición y reaparición; revisar configuración/firmas y monto en admin. Firmas inválidas pueden ser tráfico hostil. |
| Pago tardío | `operation:wompi_webhook outcome:manual_review` | Primer evento: pago recibido después de liberar reserva; revisión humana de inventario/orden. |
| Pagos pendientes >30 min | `operation:reservation_cron outcome:pending_overdue` | El cron consulta **antes** de expirar: al menos una orden PAYMENT_PROCESSING con createdAt anterior a 30 min. Revisar scheduler, pago y reserva. |
| Cron/reconciliación fallan | `operation:reservation_cron outcome:failed` y regla separada `operation:reconciliation outcome:failed` | Primer evento: revisar logs por UUID y estado real del pedido. |
| Checkout falla | `operation:checkout outcome:failed` | Primer evento: revisar DB y proveedor. |
| Creación de guía falla (B5) | `operation:boxful_label outcome:failed` | Primer evento: revisar proveedor, dirección/paquete en admin y guía existente antes de reintentar. Implementado en #91; ver `boxful-shipping.md`. |
| Webhook Boxful (B5) | `operation:boxful_webhook outcome:failed` | Primer evento; verificar token y consulta de estado. Implementado en #91. |

El umbral N actual es **30 minutos**, constante
`PENDING_PAYMENT_ALERT_MINUTES` en `pending-payment-monitoring.ts`. No altera el
tiempo de reserva del negocio. Con cron funcionando las reservas normalmente
expiran antes; esta alerta detecta atrasos. Se necesita una alerta externa de
scheduler/uptime (por ejemplo alerta de servicio/cron de Railway disponible en el
plan) si no hay ejecución completada en 10 min: un cron detenido no puede emitir
su propia alerta. Sin ese control, silencio no significa ausencia de pendientes.

## Verificación y operación

- Sin variables: pruebas garantizan cero fetch desde logger/cliente/relay y cero
  consulta extra de backlog. La suite completa verifica checkout/pagos existentes.
- Con configuración de staging aprobada: verificar un evento fijo con
  `logError({context: "server_unhandled", outcome: "failed"})` en una ejecución
  controlada del servidor; no crear un endpoint público que provoque errores.
  Buscarlo por operación y UUID en Issues; probar la acción de notificación.
- En staging, un webhook de prueba con firma inválida debe devolver 401 con UUID y
  generar un warning `invalid_signature` sin copiar la firma/payload. Nunca
  reproducir webhooks reales ni insertar tarjetas/emails reales para probar esto.
- Las pruebas de transporte usan fetch simulado y datos sensibles sintéticos;
  comprueban el sobre Sentry, aislamiento de correlación y de cupos/concurrencia,
  códigos solo locales, validaciones de negocio sin alertas, advertencias de DSN, fallos de
  red, autorización y tamaño del relay y errores reales del handler de Wompi.
- Desactivar: vaciar DSN; vaciar flag y reconstruir para detener también los POST
  del navegador. No se cambia el resultado comercial de checkout/webhooks.

## Límites conocidos / integración futura

#91 implementa `boxful_label` y `boxful_webhook` con correlación y diagnóstico
sanitizado. El webhook rechaza tokens inválidos antes de crear eventos de error;
los estados aceptados se consultan por API. La outbox de alertas y las creaciones
inciertas viven en PostgreSQL y el cron las recupera tras la respuesta principal.
Los eventos Sentry siguen siendo best-effort y pueden perderse si el proceso
termina abruptamente; la outbox de correo/Telegram es independiente. La entrega
exactamente una vez de Telegram no puede garantizarse si hay una caída entre
el envío y el guardado de éxito. Pruebas HTTP simuladas no equivalen a validar
cuenta/guías reales de QA; ver `boxful-shipping.md` para la activación pendiente.
