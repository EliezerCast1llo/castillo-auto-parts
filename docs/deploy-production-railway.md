# Producción en Railway

Fecha: 22 octubre 2026. Implementación del issue #88; Prisma permanece en 6.
Esta guía prepara la configuración. El dueño crea los servicios, contrata el
plan, carga los secretos y autoriza cualquier despliegue. No ejecutar estas
instrucciones contra producción durante la revisión del PR.

## 1. Preparación y servicios

1. Confirmar que #87 está fusionado y que `quality` y `e2e` pasan para el commit
   elegido. Producción debe desplegar únicamente commits revisados de `main`.
2. En Railway, crear un proyecto y un ambiente **production**, separado de demos
   y previews. Desactivar despliegue automático mientras se configura.
3. Añadir **PostgreSQL**, con volumen persistente y un plan que cubra la política
   de backups de la sección 6. Registrar versión mayor y capacidad contratada.
   Esta guía usa herramientas PostgreSQL 16; si el servidor es más nuevo, usar
   clientes de esa misma versión mayor y restaurar a una versión compatible.
4. Añadir el servicio **web** desde este repositorio, con Node.js 22, configuración
   `railway.json` y rama `main`. Instalar dependencias de desarrollo durante el build (incluye TypeScript).
   Prisma CLI y tsx se mantienen como dependencias de producción para las
   migraciones del predeploy y el alta inicial del administrador, incluso si la
   imagen final omite dependencias de desarrollo.
5. Añadir otro servicio **reservation-cron**, desde el mismo repo y commit, con
   Node.js 22. En Settings → Config-as-code, fijar **`/railway.cron.json`**.
   No añadir dominio ni volumen al cron. Si Railway permite añadir el servicio
   inicialmente sin desplegar, mantenerlo así hasta configurar variables.
6. En web, fijar `PORT=8080`. Generar el dominio Railway apuntando a **8080**, no
   a 3000. No hace falta dominio propio para este ticket. Configurar las URL de
   abajo antes del build: las variables `NEXT_PUBLIC_*` quedan compiladas.

La referencia `${{Postgres.DATABASE_URL}}` supone que el servicio se llama
`Postgres`; cambiar el nombre de la referencia si se eligió otro. Usar la red
privada de Railway para conexiones web → PostgreSQL, no el proxy público.

## 2. Variables web: antes del primer build

Configurar en Variables de **web**. Los marcadores siguientes son instrucciones,
no valores utilizables. Nunca guardar credenciales en Git ni pegarlas en issues.

| Variable | Configuración |
| --- | --- |
| `RAILPACK_NODE_VERSION` | `22`, también en reservation-cron |
| `NODE_ENV` | `production` |
| `PORT` | `8080`, mismo puerto que el dominio |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}`; conexión privada runtime, añadir `connect_timeout=5&pool_timeout=5` conservando parámetros existentes |
| `DIRECT_DATABASE_URL` | `${{Postgres.DATABASE_URL}}`; conexión directa para Migrate, no un pooler transaccional |
| `NEXT_PUBLIC_SITE_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `NEXTAUTH_URL` | La misma URL HTTPS pública |
| `AUTH_TRUST_HOST` | `1`, confiar en el proxy Railway de este servicio |
| `NEXTAUTH_SECRET` | Aleatorio, ≥32 caracteres; se admite `AUTH_SECRET` como alias preferente |
| `ADMIN_ACCESS_SECRET` | Otro secreto aleatorio ≥32 caracteres |
| `GUEST_CART_SECRET` | Otro secreto aleatorio ≥32 caracteres, distinto del secreto admin |
| `RESERVATION_CRON_SECRET` | Otro secreto aleatorio ≥32 caracteres; compartir solo con reservation-cron |
| `PAYMENT_PROVIDER` | `wompi` |
| `WOMPI_ENVIRONMENT` | `production` |
| `WOMPI_APP_ID`, `WOMPI_API_SECRET` | Credenciales reales del aplicativo Wompi aprobadas por el dueño |
| `WOMPI_WEBHOOK_URL` | `https://<dominio-railway>/api/webhooks/wompi` |
| `WOMPI_WEBHOOK_SECRET` | Si se define, la llave HMAC del aplicativo; si queda vacía se usa `WOMPI_API_SECRET` |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | Clave real con permiso de envío |
| `EMAIL_FROM` | Remitente aprobado/verificado en Resend, nunca el remitente `.local` de demo |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Backend Redis REST para límites compartidos; URL HTTPS |
| `DTE_MODE` | `manual` |

Generar cada secreto por separado fuera del repo con `openssl rand -base64 32`.
No usar los valores `replace-with` de ejemplos. La validación agrupa los errores
por nombre de variable, sin imprimir sus valores. Se ejecuta desde el hook
`src/instrumentation.ts` al arrancar la instancia Node.js de Next, no esperando
al primer pago o inicio de sesión. También comprobará credenciales y proveedores.

**No arrancará** con `PAYMENT_PROVIDER=mock`, `EMAIL_PROVIDER=console`, Wompi
sandbox, URL crítica inválida o variable crítica ausente. La excepción E2E exige
ambas banderas de pruebas y que las dos URL de base apunten al mismo esquema
`e2e_*`; no configurar `E2E_ISOLATED_DATABASE` ni `ALLOW_MOCK_PAYMENT_IN_E2E` en
Railway. No hay excepción pública de demo en producción.

Para una sola réplica y un único proceso se admite explícitamente
`ALLOW_IN_MEMORY_RATE_LIMIT=true` en lugar de Upstash. Reiniciar pierde los
contadores; antes de escalar a más de una réplica o proceso, quitarlo y configurar
Redis. La guía recomienda Redis desde el inicio.

Opcionales: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_DEFAULT_LOCALE=es`, WhatsApp,
Google OAuth y Cloudflare R2 según `.env.example`. Para imágenes R2, configurar
`CLOUDFLARE_R2_PUBLIC_URL` **antes del build**; sin un host autorizado las imágenes
remotas de producto no se servirán. Para subir desde admin configurar además
cuenta, bucket y claves R2. No se cambian DNS ni correo aquí (B3): si todavía no
hay remitente verificado o credenciales Wompi reales, el lanzamiento queda
bloqueado; no sustituirlos por mock/consola.

## 3. Build, migraciones, arranque y primer administrador

`railway.json` define:

1. Build: `npm run prisma:generate && npm run build` (conservar lockfile y Node 22).
2. Predeploy: `npm run db:migrate:deploy` usando `DIRECT_DATABASE_URL`. Nunca
   `migrate dev`, `db push` ni reset contra producción.
3. Inicio: `npm run start`; Next escucha `PORT` en la interfaz del contenedor.
4. Healthcheck: `/api/health`, timeout de despliegue 60 s. Railway debe permitir
   su hostname de healthcheck; este endpoint no requiere sesión ni idioma.

Configurar **todas** las variables antes del build; Auth.js ya evalúa su secreto
durante compilación. Las migraciones deben terminar antes de servir tráfico.
Un predeploy fallido no se corrige arrancando una aplicación contra un esquema
incompatible. Verificar el estado y conservar logs sin secretos.

El healthcheck consulta `SELECT 1`, devuelve `200 {"ok":true}` con DB disponible y
`503 {"ok":false}` si falla, siempre `Cache-Control: no-store`. No expone filas,
versiones, hosts ni excepciones. Es readiness de DB, no prueba de Wompi/Resend ni
monitoreo continuo de Railway; agregar un monitor externo cada minuto y alerta
tras tres fallos. Los timeouts de conexión/pool de arriba evitan esperas largas.

Para crear el primer administrador, abrir Railway SSH/shell **del servicio web**
con sus variables y red privada, y ejecutar una sola vez:

```sh
NODE_ENV=production SEED_ADMIN_ONLY=true npm run db:seed
```

Antes, cargar temporalmente `ADMIN_SEED_EMAIL` y `ADMIN_SEED_PASSWORD` seguros en
el servicio. La contraseña debe tener al menos 16 caracteres y no ser un valor
de `.env.example`; el email debe ser válido y no el de ejemplo. Si falta una
variable o la credencial es inválida, el comando termina en error antes de
escribir. Este modo solo hace upsert del administrador y no crea productos ni
inventario. Comprobar login; quitar las dos variables del servicio después.
Repetir el comando con credenciales nuevas cambia la contraseña del mismo admin.
El seed de demo se rechaza con `NODE_ENV=production`. El dueño debe cargar datos
reales de bodega/catálogo desde administración antes de abrir compras.

## 4. Expiración programada de reservas

En **reservation-cron**, configurar únicamente:

| Variable | Valor |
| --- | --- |
| `APP_BASE_URL` | Origen HTTPS de web, p.ej. `${{web.NEXT_PUBLIC_SITE_URL}}` |
| `RESERVATION_CRON_SECRET` | `${{web.RESERVATION_CRON_SECRET}}` |

Cambiar `web` si se usó otro nombre. No poner el token en una URL, argumento de
comando ni cabecera impresa en logs. El script usa Node 22 `fetch` con POST y
`Authorization: Bearer …`; rechaza redirects para no reenviar credenciales a otro
host, aplica timeout de 10 s y nunca imprime cuerpos de error ni secretos.

`railway.cron.json` establece `*/5 * * * *` (UTC), arranque
`node scripts/expire-reservations.mjs`, sin predeploy/migraciones, sin healthcheck
web y sin reinicios automáticos. El build de cron solo verifica sintaxis. Si se
cambian estas opciones desde UI, recordar que Config-as-code tiene prioridad.
Tras cada ejecución el proceso termina; no usar `next start` ni un bucle infinito.

Las reservas duran 20 minutos (`src/lib/orders.ts`). Un intervalo de cinco
minutos limita normalmente el retraso adicional de liberación a <5 minutos,
excluyendo latencia del scheduler, errores o backlog. El endpoint procesa 50
órdenes por lote; el script drena hasta 10 lotes (500 órdenes, como máximo 100 s
de espera de red). Si todos se llenan, sale con error para alertar del backlog.
Revisar capacidad si se aproxima a 500 expiraciones cada cinco minutos.

Después de que web esté sano, habilitar el servicio cron y lanzar una ejecución
manual desde Railway. Debe terminar con código 0 y un conteo de liberaciones,
aunque sea cero. Confirmar dos ejecuciones automáticas separadas por cinco
minutos en el historial. Railway no ejecuta otro tick si el proceso anterior
sigue activo: alertar ante fallos o si no hay éxito durante diez minutos.
Reejecutar desde UI tras corregir red/token. El endpoint reclama cada orden de
forma transaccional: ejecuciones repetidas o simultáneas no liberan dos veces.
No crear una reserva ficticia ni alterar inventario de clientes para la prueba;
verificar reservas con fixtures solo en un entorno separado.

El commit configura el cron en el repo, pero el calendario **no existe en la
cuenta** hasta que el dueño cree/configure el segundo servicio.

## 5. Verificación antes de abrir ventas

- Revisar logs de arranque: no hay errores de configuración. Probar en staging
  una variable crítica ausente y confirmar que la instancia termina sin servir
  tráfico; nunca hacer esta prueba sobre el único servicio público activo.
- Consultar `https://<dominio>/api/health`: 200. Simular fallo de DB solo en
  staging: 503; volver a habilitarla y confirmar recuperación.
- Inicio/cierre de sesión cliente y admin, catálogo real, stock y pedido controlado.
- Credenciales reales Wompi y webhook HTTPS/HMAC verificados; reconciliar pago
  contra el proveedor. Resend confirma entrega del remitente autorizado.
- Cron termina correctamente y hay historial programado; alerta de fallos activa.
- Backup inicial fuera del volumen original y prueba de restauración aprobada.
- Verificar que ningún SKU `MOCK-*` del seed demo se presenta como inventario real.
- Activar despliegues automáticos solo tras la aprobación del dueño y con los
  checks GitHub `quality` y `e2e` requeridos para cambios a `main`.

## 6. Política de backups

Responsable: dueño/operador designado. Objetivos iniciales **RPO ≤24 h** y
**RTO ≤4 h**, pendientes de demostrar con un simulacro; no son garantías de Railway.

| Copia | Frecuencia | Retención mínima |
| --- | --- | --- |
| Lógica PostgreSQL, cifrada fuera del volumen/proyecto original | Diaria y antes de cada migración | 7 diarias |
| Copia semanal | Semanal | 4 semanales |
| Copia mensual | Mensual | 3 mensuales |
| Snapshot nativo del volumen, si el plan lo admite | Habilitar diario/semanal/mensual en Railway | Verificar retención real en UI; complementar si es inferior |

El mecanismo incluido es un servicio cron de Railway independiente, definido en
`railway.backup.json`, que ejecuta `pg_dump` con PostgreSQL 16, cifra con AES-256-GCM
y sube a un bucket S3 privado externo. Ejecuta diariamente a las 08:00 UTC (02:00
El Salvador), conserva 7 fechas diarias, 4 domingos y 3 primeros de mes, y solo
purga después de verificar las subidas. El cron de reservas **no hace backups**.

Seguir [Backups PostgreSQL en Railway y restauración](database-backups.md) para
crear el servicio, configurar todas las variables `BACKUP_*` vacías de
`.env.example`, hacer la copia inicial/manual, activar avisos, descargar y
restaurar. No hay un scheduler externo implícito. El dueño configura recursos y
hace el primer ensayo antes de ventas; los snapshots nativos son complementarios.
El job CI `quality` construye la imagen y prueba dump/cifrado/descarga/restauración
con Postgres 16 y almacenamiento simulado, sin credenciales reales. Las copias
contienen datos personales: no ponerlas en Git ni en artefactos públicos de CI.

## 7. Restauración y simulacro mensual

Hacer el primer simulacro **antes de ventas**, luego cada mes y después de
cambios de esquema/plan. Usar una base nueva aislada y datos restringidos; medir
el tiempo desde recuperación de copia hasta healthcheck/validación completa.

1. Completar los apartados 3 y 4 de [la guía de backups](database-backups.md#3-descargar-y-autenticar-una-copia):
   descarga autenticada, PostgresRestore nuevo, archivo libpq privado y comandos
   Docker de restauración. No restaurar encima de la única base original ni
   ejecutar seed. Las herramientas PG compatibles están en la imagen incluida.
2. Exigir cero migraciones incompletas y comparar conteos/órdenes de control con
   los registros de la copia. Si algo falla, conservar evidencia y crear otra
   base vacía para repetir; no usar restauraciones parciales.
3. En un **web de recuperación aislado**, referenciar las URL privadas de
   PostgresRestore, ejecutar `npm run db:migrate:status` y luego
   `npm run db:migrate:deploy` para el commit seleccionado. Un dump antiguo
   requiere migraciones posteriores; si una migración es incompatible, usar el
   commit compatible y planear la recuperación, no borrar la historia Prisma.
4. Validar `/api/health`, login cliente/admin, catálogo, stock y estados de órdenes.
   Mantener el cron pausado y aislar correo/pagos de operaciones reales durante
   el simulacro; no usar proveedores mock en un servidor público de producción.
   Para ensayos funcionales con simulación usar el runner E2E y otra base.
5. En una recuperación real, antes de cambiar tráfico **detener cron y escrituras
   de web** (detener su deployment desde Railway), anunciar mantenimiento y
   registrar la última transacción. Reconciliar pedidos/pagos/webhooks ocurridos
   después del backup con Wompi: restaurar la BD no revierte pagos externos.
6. Cambiar `DATABASE_URL` y `DIRECT_DATABASE_URL` del web real a PostgresRestore,
   validar migraciones, desplegar el commit autorizado y exigir healthcheck 200.
   Verificar login, lectura y un flujo controlado; después reactivar cron,
   revisar reservas vencidas y monitorizar los siguientes ticks. No apuntar el
   cron a un entorno de recuperación por accidente.
7. Mantener la base anterior sin escrituras hasta confirmar recuperación. Cerrar
    proxies temporales, recuperar la política de backups sobre la nueva base y
    registrar fecha de copia, RPO/RTO medidos, responsable e incidencias.

Si se elige restauración nativa de Railway en vez del dump, seguir su panel de
Backups para el volumen y fecha elegidos, confirmar el servicio afectado y el
parón requerido. No asumir restauración a una base distinta o PITR si el plan no
lo ofrece. La ruta lógica anterior es el procedimiento independiente de esas
capacidades. Un botón de backup habilitado sin una restauración probada no basta.

## Límites pendientes de operación

El repo define el servicio de backup, pero no crea infraestructura, cuentas, DNS ni credenciales;
el dueño debe completar esos pasos. Un healthcheck 200 no demuestra entregas de
correo ni pagos reales. Las migraciones actuales no implementan rollback
automático y los backups no eliminan la necesidad de reconciliar pagos externos.
Consultar también [checklist de producción](production-operations-checklist.md)
y [rotación de secretos](auth-secrets-rotation.md).
