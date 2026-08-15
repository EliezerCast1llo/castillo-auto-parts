# Despliegue en Railway (entorno de demo)

Guía para levantar el proyecto en [Railway](https://railway.com) con un enlace
público, pensada para validación comercial: catálogo de prueba, pagos en modo
`mock` y correo por consola. **No es una configuración de producción real** —
al final se listan las diferencias.

## 1. Servicios

En un proyecto de Railway, dos servicios:

1. **PostgreSQL** — desde `New → Database → Add PostgreSQL`.
2. **La app** — desde `New → GitHub Repo`, apuntando a este repositorio.

`railway.json` ya define el build, las migraciones y el arranque, así que no
hay que configurar comandos a mano:

| | |
|---|---|
| Build | `npm run build` |
| Antes de desplegar | `npm run db:migrate:deploy` |
| Arranque | `npm run start` |

Next escucha en la variable `PORT`, que Railway inyecta sola.

## 2. Variables

En el servicio de la app, `Variables`. Las de Railway se referencian con
`${{...}}`; el resto se pegan a mano.

> **Ponlas todas antes del primer despliegue.** No basta con tenerlas en
> ejecución: `src/lib/auth.ts` valida el secreto al cargar el módulo, y Next
> evalúa los módulos durante el build. Sin `NEXTAUTH_SECRET` válido el build
> falla, no solo el arranque.

### Base de datos

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### URL pública

`RAILWAY_PUBLIC_DOMAIN` la genera Railway al asignar dominio. Las `NEXT_PUBLIC_*`
**se congelan en el build**, así que tienen que estar antes de desplegar.

```
NEXT_PUBLIC_SITE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
AUTH_TRUST_HOST=1
```

### Secretos

Uno distinto para cada variable, generados con `openssl rand -base64 32`:

```
NEXTAUTH_SECRET=<generar>
ADMIN_ACCESS_SECRET=<generar>
GUEST_CART_SECRET=<generar>
RESERVATION_CRON_SECRET=<generar>
```

`NEXTAUTH_SECRET` debe tener 32 caracteres o más: la app se niega a arrancar en
producción si es más corto o si contiene `replace-with`.

### Admin semilla

Este usuario queda accesible desde internet. Contraseña larga y única, nunca la
de desarrollo:

```
ADMIN_SEED_EMAIL=<tu-correo>
ADMIN_SEED_PASSWORD=<contraseña fuerte>
```

### Limitador de peticiones

```
ALLOW_IN_MEMORY_RATE_LIMIT=true
```

Por defecto la app exige Upstash Redis en producción, porque en serverless cada
request puede caer en una instancia distinta y un contador en memoria no
limitaría nada. En Railway hay **un solo contenedor de larga vida**, así que el
contador en memoria sí limita de verdad y este escape es correcto.

**Deja de serlo en cuanto haya más de una instancia**: cada réplica llevaría su
propia cuenta y el límite se multiplicaría. Si escalas horizontalmente, quita
esta variable y configura Upstash.

### Modo demo

```
PAYMENT_PROVIDER=mock
EMAIL_PROVIDER=console
EMAIL_FROM=Castillo Auto Parts <no-reply@castilloautoparts.local>
NEXT_PUBLIC_APP_NAME=Castillo Auto Parts
NEXT_PUBLIC_DEFAULT_LOCALE=es
DTE_MODE=simulated
```

Con `PAYMENT_PROVIDER=mock` no hacen falta credenciales de Wompi, y con
`EMAIL_PROVIDER=console` no hace falta Resend: los correos se escriben en los
logs del servicio.

### Opcionales

```
NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER=<número>   # muestra el CTA de asesoría
CLOUDFLARE_R2_PUBLIC_URL=<url pública del bucket>
```

`CLOUDFLARE_R2_PUBLIC_URL` solo hace falta si quieres que carguen las fotos de
producto alojadas en R2: en producción `next.config.ts` solo autoriza imágenes
remotas de ese dominio, y deriva el host de esta variable **en tiempo de build**.
Sin ella, los productos con foto caen al marcador gris.

## 3. Sembrar el catálogo de demo

Las migraciones corren solas antes de cada despliegue. La siembra es manual y se
lanza **desde tu máquina** contra la base de Railway, para no depender de
dependencias de desarrollo en el contenedor.

### La base es privada por defecto

`DATABASE_URL` apunta a `postgres.railway.internal`, un nombre que solo resuelve
dentro de la red de Railway. Desde fuera no existe, así que
`railway run npm run db:seed` falla con `Can't reach database server`. Hay que
abrir un acceso público temporal:

1. Servicio **Postgres** → `Settings` → `Networking` → activar **Public Access**.
   Railway crea un proxy TCP y genera `DATABASE_PUBLIC_URL`.
2. Copiar ese valor desde la pestaña `Variables` del mismo servicio.

### Sembrar

```bash
DATABASE_URL="<DATABASE_PUBLIC_URL>" \
DIRECT_DATABASE_URL="<DATABASE_PUBLIC_URL>" \
npm run db:seed
```

No hace falta `railway run`: al declarar la variable en la misma línea gana sobre
la del `.env` local, porque Prisma carga ese archivo pero no pisa lo que ya está
en el entorno.

**Verifica en el sitio desplegado, no en local.** Con una URL equivocada el
comando podría sembrar tu base local y reportar éxito igualmente.

Si falla con «tabla no existe», las migraciones no llegaron a correr: lanza
`DATABASE_URL="<DATABASE_PUBLIC_URL>" npm run db:migrate:deploy` y repite.

El seed hace upsert, así que repetirlo es inofensivo.

### Cerrar el acceso

El proxy TCP genera cargos por tráfico de salida. Terminada la siembra se puede
desactivar **Public Access** desde el mismo menú: la app no se ve afectada porque
usa la red interna.

## 4. Comprobaciones tras el primer despliegue

- La home carga y los carruseles avanzan.
- **Iniciar sesión** en `/admin/login` con el admin semilla. Es la prueba que
  ejercita el limitador: si `ALLOW_IN_MEMORY_RATE_LIMIT` faltara, aquí saldría
  la pantalla de error.
- Agregar un producto al carrito y llegar hasta el checkout con pago `mock`.
- `/design` debe devolver 404: está bloqueada en producción a propósito.

## Diferencias con una producción real

| | Demo | Producción |
|---|---|---|
| Pagos | `mock` | Wompi con credenciales reales |
| Correo | consola | Resend |
| Limitador | memoria, una instancia | Upstash Redis |
| Catálogo | datos de prueba (`MOCK-*`) | inventario real |
| Base de datos | plan gratuito, sin copias | plan con respaldo |

Antes de abrir a clientes reales, revisar además
[`production-operations-checklist.md`](production-operations-checklist.md) y
[`auth-secrets-rotation.md`](auth-secrets-rotation.md).
