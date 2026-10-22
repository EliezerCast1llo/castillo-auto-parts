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
   Prisma CLI se mantiene como dependencia de producción para las migraciones
   del predeploy, incluso si la imagen final omite dependencias de desarrollo.
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
el servicio. Este modo solo hace upsert del administrador y no crea productos ni
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

No asumir que crear Postgres habilita backups ni que un snapshot en el mismo
proyecto cubre borrado de cuenta. Antes de ventas, el dueño configura un trabajo
de respaldo fuera del contenedor web (scheduler del operador o servicio dedicado)
y almacenamiento cifrado con control de acceso, verifica un éxito diario y
alerta si pasan 24 h sin copia. Ese servicio/plan se contrata manualmente; el cron
de reservas **no hace backups**. Registrar fecha, versión PG, tamaño, checksum,
commit de aplicación y resultado, sin credenciales. Las copias contienen datos
personales: no ponerlas en Git ni en artefactos públicos de CI.

### Backup lógico reproducible

Desde una máquina administrativa con `pg_dump`, `pg_restore`, `psql` y espacio
suficiente, todos de versión compatible con el servidor:

1. Habilitar temporalmente el proxy TCP de Postgres en Railway → Networking y
   obtener host/puerto de acceso público. La URL `.railway.internal` no resuelve
   fuera del proyecto. Conservar la conexión privada en web.
2. Crear un archivo de servicios libpq **fuera del checkout**, con permisos 600,
   y una sección `castillo-production`. Completar localmente host, port, dbname,
   user y password usando los datos de la cuenta. Fijar `connect_timeout=5` y
   `sslmode` según las capacidades del endpoint contratado; usar verificación
   TLS cuando el proveedor entregue certificado. No desactivar TLS sin evaluar
   el transporte. El archivo es secreto y no se comparte ni se imprime.
   Formato del archivo (sustituir marcadores solo en el archivo local privado):

```ini
[castillo-production]
host=<host-del-proxy>
port=<puerto-del-proxy>
dbname=<nombre-de-base>
user=<usuario>
password=<contraseña>
connect_timeout=5
sslmode=<modo-TLS-confirmado-con-el-proveedor>
```

3. Definir rutas privadas, por ejemplo `export PGSERVICEFILE="$HOME/.config/castillo/pg_service.conf"`
   y `export BACKUP_DIR="$HOME/backups/castillo"`, fuera del checkout y sobre disco
   cifrado. Crear el directorio de configuración con permisos 700 y el archivo
   anterior con permisos 600 (`chmod 600 "$PGSERVICEFILE"`). Luego ejecutar:

```sh
umask 077
mkdir -p "$BACKUP_DIR"
backup_file="$BACKUP_DIR/castillo-$(date -u +%Y%m%dT%H%M%SZ).dump"
pg_dump --dbname=service=castillo-production --format=custom --no-owner \
  --no-privileges --file="$backup_file"
pg_restore --list "$backup_file" > "$backup_file.list"
(cd "$BACKUP_DIR" && sha256sum "$(basename "$backup_file")" > "$(basename "$backup_file").sha256")
```

4. Solo si los comandos terminan en 0, copiar dump/checksum al almacenamiento
   cifrado independiente, verificar checksum de destino y registrar evidencia.
   Aplicar las retenciones anteriores sin borrar la última copia verificada.
5. Cerrar el proxy público si no se requiere. Un scheduler externo necesita un
   acceso autorizado estable; si se cierra, coordinar su reapertura o ejecutar
   ese scheduler desde la red privada. No exponer la base solo para la app web.

`pg_dump` toma un snapshot lógico consistente sin detener escrituras. No copia
roles globales, configuración Railway ni objetos R2: conservar configuración y
rotación de secretos por separado, y respaldar imágenes con su propia política.

## 7. Restauración y simulacro mensual

Hacer el primer simulacro **antes de ventas**, luego cada mes y después de
cambios de esquema/plan. Usar una base nueva aislada y datos restringidos; medir
el tiempo desde recuperación de copia hasta healthcheck/validación completa.

1. Elegir una copia, verificar su checksum en el mismo directorio con
   `sha256sum -c <archivo>.sha256` y revisar `pg_restore --list <archivo>`.
2. En Railway crear **PostgresRestore**, misma versión mayor y volumen con
   capacidad suficiente. No restaurar encima de la única base original.
3. Abrir su proxy TCP temporal. Añadir la sección `castillo-restore` al archivo
   libpq privado con los datos de esta base nueva, y mantener `PGSERVICEFILE`.
   La base destino debe estar vacía y pertenecer al usuario que restaurará.
4. Restaurar sin imprimir credenciales ni ejecutar seed:

```sh
pg_restore --dbname=service=castillo-restore --exit-on-error \
  --no-owner --no-privileges "$backup_file"
psql 'service=castillo-restore' --set=ON_ERROR_STOP=1 \
  --command='SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL;'
psql 'service=castillo-restore' --set=ON_ERROR_STOP=1 \
  --command='SELECT count(*) FROM "Product"; SELECT count(*) FROM "Order"; SELECT count(*) FROM "InventoryStock";'
```

5. Exigir cero migraciones incompletas y comparar conteos/órdenes de control con
   los registros de la copia. Si algo falla, conservar evidencia y crear otra
   base vacía para repetir; no usar restauraciones parciales.
6. En un **web de recuperación aislado**, referenciar las URL privadas de
   PostgresRestore, ejecutar `npm run db:migrate:status` y luego
   `npm run db:migrate:deploy` para el commit seleccionado. Un dump antiguo
   requiere migraciones posteriores; si una migración es incompatible, usar el
   commit compatible y planear la recuperación, no borrar la historia Prisma.
7. Validar `/api/health`, login cliente/admin, catálogo, stock y estados de órdenes.
   Mantener el cron pausado y aislar correo/pagos de operaciones reales durante
   el simulacro; no usar proveedores mock en un servidor público de producción.
   Para ensayos funcionales con simulación usar el runner E2E y otra base.
8. En una recuperación real, antes de cambiar tráfico **detener cron y escrituras
   de web** (detener su deployment desde Railway), anunciar mantenimiento y
   registrar la última transacción. Reconciliar pedidos/pagos/webhooks ocurridos
   después del backup con Wompi: restaurar la BD no revierte pagos externos.
9. Cambiar `DATABASE_URL` y `DIRECT_DATABASE_URL` del web real a PostgresRestore,
   validar migraciones, desplegar el commit autorizado y exigir healthcheck 200.
   Verificar login, lectura y un flujo controlado; después reactivar cron,
   revisar reservas vencidas y monitorizar los siguientes ticks. No apuntar el
   cron a un entorno de recuperación por accidente.
10. Mantener la base anterior sin escrituras hasta confirmar recuperación. Cerrar
    proxies temporales, recuperar la política de backups sobre la nueva base y
    registrar fecha de copia, RPO/RTO medidos, responsable e incidencias.

Si se elige restauración nativa de Railway en vez del dump, seguir su panel de
Backups para el volumen y fecha elegidos, confirmar el servicio afectado y el
parón requerido. No asumir restauración a una base distinta o PITR si el plan no
lo ofrece. La ruta lógica anterior es el procedimiento independiente de esas
capacidades. Un botón de backup habilitado sin una restauración probada no basta.

## Límites pendientes de operación

El repo no crea infraestructura, tareas de backup, cuentas, DNS ni credenciales;
el dueño debe completar esos pasos. Un healthcheck 200 no demuestra entregas de
correo ni pagos reales. Las migraciones actuales no implementan rollback
automático y los backups no eliminan la necesidad de reconciliar pagos externos.
Consultar también [checklist de producción](production-operations-checklist.md)
y [rotación de secretos](auth-secrets-rotation.md).
