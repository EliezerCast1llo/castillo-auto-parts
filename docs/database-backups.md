# Backups PostgreSQL en Railway y restauración

Este procedimiento usa el servicio cron definido por `railway.backup.json`,
`ops/database-backup/Dockerfile` y `scripts/database-backup.mjs`. El dueño crea
los recursos y custodia las claves. No requiere un scheduler externo ni un plan
con snapshots nativos. Los snapshots de Railway pueden complementar estas copias.

## 1. Preparar el destino independiente

1. Confirmar la versión **mayor** de Postgres en Railway. La imagen incluida usa
   **PostgreSQL 16** y Node 22. Si la base usa otra versión, ajustar
   `POSTGRES_MAJOR` del Dockerfile y repetir la prueba de restauración antes de
   habilitar el servicio. `pg_dump` falla si el servidor es más nuevo que el cliente.
2. Crear un bucket **privado** en almacenamiento S3 fuera del proyecto/volumen
   Railway, preferiblemente en otra cuenta administrativa. Ejemplo concreto:
   Cloudflare R2 → Create bucket → ubicación elegida → no habilitar acceso público.
   No reutilizar el bucket de imágenes. Mantener versionado/Object Lock y reglas
   de expiración deshabilitados: la retención la administra este script y no
   limpia versiones históricas de un bucket versionado.
3. Crear un token R2 limitado a **ese bucket**, con lectura y escritura de objetos
   (incluida eliminación y listado). En S3, autorizar ListBucket para el prefijo y
   GetObject/PutObject/DeleteObject en sus objetos. No habilitar permisos públicos.
4. Obtener el endpoint S3 HTTPS de R2, región `auto`, nombre del bucket y las dos
   credenciales del token. El endpoint es el origen
   `https://<account-id>.r2.cloudflarestorage.com`, sin rutas ni credenciales.
   Otro proveedor S3 debe admitir Content-MD5 y metadata de objetos.
5. Generar una clave AES de 32 bytes con `openssl rand -hex 32` en una máquina
   administrativa. Guardarla en un gestor de secretos **y una copia de recuperación
   fuera de Railway**; no en Git ni en logs. Asignarle un identificador no secreto,
   por ejemplo `production-2026-01`. Perder la clave hace irrecuperables las copias.

## 2. Crear el servicio cron

1. Railway → mismo proyecto y entorno de Postgres → New → GitHub Repo → este repo.
   Nombrarlo `DatabaseBackup`. No crear dominio, volumen persistente ni healthcheck.
2. En Settings → configuración como código, fijar **Config File Path** a
   `/railway.backup.json`. Usar Root Directory `/`. Confirmar builder Dockerfile,
   ruta `ops/database-backup/Dockerfile`, comando `node /app/database-backup.mjs backup`,
   sin pre-deploy y reinicio `NEVER`. **No ejecutar Prisma Migrate ni seed aquí.**
3. Agregar las siguientes variables **solo a DatabaseBackup**. Todas están vacías
   en `.env.example`; el servicio web no las necesita:

| Variable | Valor a configurar por el dueño |
| --- | --- |
| `BACKUP_DATABASE_URL` | URL **directa** privada de Postgres; referencia Railway `${{Postgres.DATABASE_URL}}` con `?sslmode=require` si aún no tiene query. Sustituir `Postgres` por el nombre real del servicio. No usar pooler ni `schema=` de Prisma. |
| `BACKUP_S3_ENDPOINT` | Origen HTTPS S3 del paso 1 |
| `BACKUP_S3_REGION` | `auto` en R2; región contratada en S3 |
| `BACKUP_S3_BUCKET` | Bucket privado dedicado |
| `BACKUP_S3_PREFIX` | Prefijo exclusivo estable, por ejemplo `castillo-production/postgres` |
| `BACKUP_S3_ACCESS_KEY_ID` | Identificador del token limitado al bucket |
| `BACKUP_S3_SECRET_ACCESS_KEY` | Secreto de ese token |
| `BACKUP_ENCRYPTION_KEY` | Los 64 caracteres hexadecimales de la clave AES |
| `BACKUP_KEY_ID` | Identificador de la clave custodiada fuera de Railway |

   Si la URL ya tiene query, añadir `&sslmode=require` o reemplazar el valor
   existente, sin duplicarlo. Confirmar TLS con el servicio contratado; para CA
   propia usar `sslmode=verify-full&sslrootcert=<ruta-montada>`. El script admite
   `sslcert`/`sslkey`. Solo una red privada de confianza puede usar `sslmode=disable`
   si ese servidor no ofrece TLS; no usarlo para el proxy público. No se transmite
   la URL en los argumentos de `pg_dump` ni se registra su salida de error.
4. Desplegar y revisar el cron: **`0 8 * * *`**, UTC, diariamente a las **02:00 de
   El Salvador**. Railway debe mostrar el servicio terminado, sin réplicas web.
   No modificar el cron de reservas; son dos servicios distintos.
5. Usar **Run now** en el cron para la copia inicial. Exigir exit 0 y un log JSON
   con `operation`, rutas de objetos, tamaño, SHA-256 del ciphertext, `keyId` y
   cantidad eliminada. No basta con un deployment construido: verificar que el
   comando se ejecutó. Si la UI dispara el primer cron al desplegar, verificarlo
   antes de solicitar otra ejecución. Evitar ejecuciones simultáneas.
6. Verificar el objeto privado `.../daily/YYYY-MM-DD.dump.enc` y ejecutar el
   simulacro del apartado 4. Habilitar notificaciones de fallo del servicio en
   Railway → Project Settings → Notifications; el responsable revisa cada día
   hora y éxito del último cron y alerta si supera 24 h. Antes de ventas, registrar
   el responsable y probar la notificación con un servicio de ensayo. La fecha
   del último deployment no demuestra que haya un backup nuevo.

### Retención y comportamiento

- Cada ejecución genera un dump custom consistente, comprueba `pg_restore --list`,
  lo cifra con **AES-256-GCM**, nonce aleatorio de 12 bytes y etiqueta de 16 bytes.
  Formato versionado: `CAPBAK01`, nonce, ciphertext y etiqueta autenticada.
- Siempre escribe `daily/YYYY-MM-DD.dump.enc`. Los domingos también
  `weekly/YYYY-MM-DD.dump.enc`; el día 1 de cada mes también
  `monthly/YYYY-MM-01.dump.enc`. Las fechas y clases usan UTC; a las 08:00 UTC
  coinciden con el día calendario de El Salvador. Es un único snapshot copiado
  en cada clase que corresponda, no varias consultas inconsistentes.
- Conserva las **7 fechas diarias, 4 domingos y 3 primeros de mes** más recientes.
  Hasta completar esas ventanas habrá menos copias; no se inventa historial.
  Reejecutar un día reemplaza solo la copia de esa fecha, sin consumir otra
  posición de retención. Una ejecución omitida conserva las copias anteriores.
- Solo tras subir y verificar **todas** las clases del día (tamaño, metadata y
  Content-MD5 en transporte) lista y elimina objetos anteriores. Un fallo de dump,
  cifrado, subida o verificación termina en error y no ejecuta retención.
  Ignora objetos manuales, nombres desconocidos, otras rutas y fechas futuras.
- El bucket contiene datos personales cifrados: acceso limitado y credenciales
  separadas de las imágenes. Retener las claves antiguas mientras existan copias
  con su `keyId`. Al rotar, generar nueva clave e ID, actualizar el cron y probar
  descarga/restauración nueva y antigua; nunca reutilizar un ID con otra clave.
- Requiere disco temporal para dump + ciphertext (aproximadamente dos veces el
  dump comprimido) y limita cada objeto a **5 GiB**. Dump con timeout de 10 minutos
  y espera de locks de 30 segundos. Para bases mayores, diseñar multipart y ajustar
  recursos/tiempos antes de llegar al límite. Alertar sobre crecimiento y fallos.
- Antes de una migración, ejecutar una copia **manual**: Railway → SSH al servicio
  de backup mientras esté activo → `node /app/database-backup.mjs backup --manual`,
  o usar la imagen local con la URL pública temporal y el archivo privado de
  variables del apartado siguiente. Un cron normalmente está detenido, por lo
  que la alternativa local es el procedimiento disponible siempre. Los objetos
  `manual/<timestamp>-<uuid>.dump.enc` no se purgan automáticamente: el dueño debe
  registrar y eliminar los obsoletos después de verificar la migración.

### Copia manual previa a una migración

En la máquina administrativa, construir la imagen y preparar el archivo privado
Docker de variables del apartado 3. Agregar temporalmente `BACKUP_DATABASE_URL`
con la URL del **proxy público de producción** y `sslmode=require` (abrir el proxy
en Railway → Postgres → Networking). No usar `.railway.internal` fuera de Railway.
Después de comprobar host/base y la clave custodiada, ejecutar:

```sh
docker run --rm --env-file "$BACKUP_ENV_FILE" castillo-backup:restore \
  node /app/database-backup.mjs backup --manual
```

Exigir exit 0 y guardar la ruta `manual/...` del log. No ejecutar la migración si
falla. Retirar la URL del archivo y cerrar el proxy cuando ya no se necesite.
La copia queda fuera de la purga programada; documentar su eliminación posterior.

## 3. Descargar y autenticar una copia

En una máquina administrativa con Docker, espacio libre y directorio sobre disco
cifrado. No poner dumps en el checkout. No usar artefactos públicos de CI:

```sh
git checkout <commit-autorizado>
docker build -f ops/database-backup/Dockerfile -t castillo-backup:restore .
export BACKUP_RESTORE_DIR="$HOME/backups/castillo-restore"
export BACKUP_ENV_FILE="$HOME/.config/castillo/backup-restore.env"
umask 077
mkdir -p "$BACKUP_RESTORE_DIR" "$(dirname "$BACKUP_ENV_FILE")"
chmod 700 "$BACKUP_RESTORE_DIR"
```

Crear `BACKUP_ENV_FILE` localmente con permisos 600 y formato Docker `NOMBRE=valor`,
**sin comillas, export ni sustituciones de shell**. Copiar las variables S3,
`BACKUP_KEY_ID` y `BACKUP_ENCRYPTION_KEY` del apartado 2; para descargar no hace falta
`BACKUP_DATABASE_URL`. Consultar metadata del objeto en el panel S3 para elegir la
clave correspondiente a `keyid`. No imprimir el archivo. El directorio de salida
se monta en el contenedor con el UID del usuario local:

```sh
chmod 600 "$BACKUP_ENV_FILE"
# Sustituir por la ruta exacta del objeto elegido en el bucket.
export BACKUP_OBJECT_KEY="castillo-production/postgres/daily/YYYY-MM-DD.dump.enc"
docker run --rm --user "$(id -u):$(id -g)" \
  --env-file "$BACKUP_ENV_FILE" -v "$BACKUP_RESTORE_DIR:/restore" \
  castillo-backup:restore node /app/database-backup.mjs \
  download "$BACKUP_OBJECT_KEY" /restore/database.dump
export backup_file="$BACKUP_RESTORE_DIR/database.dump"
docker run --rm --user "$(id -u):$(id -g)" \
  -v "$BACKUP_RESTORE_DIR:/restore:ro" castillo-backup:restore \
  pg_restore --list /restore/database.dump
```

La descarga comprueba tamaño, SHA-256 del ciphertext, ID de clave y autenticidad
GCM **antes** de publicar el dump descifrado. No sobrescribe archivos existentes.
Si algo falla, detenerse y elegir otra copia/clave; no intentar restaurar un dump
parcial. Para repetir, usar un directorio nuevo. Si se descargó el `.enc` desde el
panel S3, montarlo y usar `decrypt /restore/copia.dump.enc /restore/database.dump`
con la misma imagen y `BACKUP_ENCRYPTION_KEY`; GCM también detecta corrupción/clave
incorrecta, aunque la descarga por script agrega la verificación de metadata.

## 4. Restaurar y verificar

1. En Railway crear **PostgresRestore**, vacío, misma versión mayor, volumen
   suficiente y sin tráfico del web/cron. Habilitar temporalmente su proxy TCP.
2. Crear fuera del checkout el archivo privado
   `$HOME/.config/castillo/pg_service.conf` con permisos 600, usando los datos de
   **PostgresRestore**, nunca los de producción. Formato:

```ini
[castillo-restore]
host=<host-del-proxy-de-PostgresRestore>
port=<puerto-del-proxy>
dbname=<base-vacia>
user=<usuario-restauracion>
password=<secreto>
connect_timeout=10
sslmode=require
```

   Usar `verify-full` y CA montada si el proveedor ofrece certificado verificable;
   no deshabilitar TLS sobre el proxy público. No imprimir el archivo ni usar URLs
   con contraseñas como argumentos. No ejecutar seed en la base restaurada.
3. Restaurar el archivo autenticado del apartado 3 con la misma imagen:

```sh
export PGSERVICEFILE="$HOME/.config/castillo/pg_service.conf"
docker run --rm --user "$(id -u):$(id -g)" \
  -e PGSERVICEFILE=/run/pg_service.conf \
  -v "$PGSERVICEFILE:/run/pg_service.conf:ro" \
  -v "$BACKUP_RESTORE_DIR:/restore:ro" castillo-backup:restore \
  pg_restore --dbname=service=castillo-restore --exit-on-error \
  --no-owner --no-privileges /restore/database.dump

docker run --rm --user "$(id -u):$(id -g)" \
  -e PGSERVICEFILE=/run/pg_service.conf \
  -v "$PGSERVICEFILE:/run/pg_service.conf:ro" castillo-backup:restore \
  psql service=castillo-restore --set=ON_ERROR_STOP=1 \
  --command='SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL; SELECT count(*) FROM "Product"; SELECT count(*) FROM "Order"; SELECT count(*) FROM "InventoryStock";'
```

4. Exigir exit 0, cero migraciones incompletas, conteos esperados y pedidos de
   control. Continuar con [el simulacro y recuperación de aplicación](deploy-production-railway.md#7-restauración-y-simulacro-mensual): migraciones compatibles,
   healthcheck, login, pedidos/stock y reconciliación Wompi antes de cambiar tráfico.
5. Registrar objeto, checksum, ID de clave (sin clave), versión PG, commit, conteos,
   fecha y duración. Objetivos RPO ≤24 h / RTO ≤4 h pendientes de demostrar con
   datos/tamaño reales. El dump no incluye roles globales, imágenes R2 ni secretos
   Railway: tienen su propia recuperación. Mantener prueba mensual y tras cambios.
6. Cerrar el proxy temporal. Eliminar copias plaintext de ensayo según el manejo
   del disco cifrado y revocar accesos temporales; conservar solo evidencia sin PII.

## Evidencia automatizada y alcance

`npm test` prueba validación, cifrado, corrupción/clave incorrecta, retención 7/4/3,
paginación, fallos antes de borrar y errores sin secretos. El job CI `quality`
construye la imagen y ejecuta `scripts/database-backup.restore.test.mjs`: crea dos
bases desechables en Postgres 16, vuelca datos con relaciones y restricciones,
cifra, sube/descarga mediante un adaptador S3 en memoria, autentica, restaura con
`pg_restore` y compara filas y restricciones. El transporte contra la cuenta S3
real y el RPO/RTO real los valida el dueño con el primer backup/simulacro. El repo
no crea servicios, buckets ni credenciales reales.
