# PostgreSQL pooling y migraciones

Fecha: 2026-06-24.

Este documento cubre `T-041`.

## Regla

En producción serverless, la app no debe usar una conexión directa de PostgreSQL para tráfico normal.

- `DATABASE_URL`: URL pooled para runtime de Next.js/Vercel.
- `DIRECT_DATABASE_URL`: URL directa para Prisma Migrate, Prisma Studio e introspección.

En local, CI y E2E pueden ser iguales mientras no exista proveedor gestionado.

## Por qué importa

Vercel puede levantar varias instancias serverless. Aunque `src/lib/db.ts` use singleton por instancia caliente, eso no comparte conexiones entre instancias. Sin pooler, PostgreSQL puede agotar conexiones bajo tráfico o durante checkout.

## Configuración esperada

```env
DATABASE_URL="postgresql://USER:PASSWORD@pooled-host:6543/db?pgbouncer=true&connection_limit=1"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@direct-host:5432/db"
```

La forma exacta depende del proveedor:

- Neon/Supabase: suelen entregar URL pooled y URL directa.
- Prisma Accelerate: usa su connection string para runtime; revisar si `directUrl` sigue siendo necesario según proveedor.
- PostgreSQL propio: usar PgBouncer o pooler equivalente.

## Verificación

1. En Vercel Preview, configurar ambas variables.
2. Ejecutar `npm run db:migrate:deploy`.
3. Ejecutar `npm run build`.
4. Probar checkout completo.
5. Revisar métricas del proveedor:
   - conexiones activas;
   - conexiones máximas;
   - errores `too many connections`;
   - latencia de queries.

## Nota Prisma v7

El proyecto usa Prisma 6.19. En Prisma 6, `directUrl` puede vivir en `schema.prisma`. Prisma 7 mueve esta configuración hacia `prisma.config.ts`; cuando se actualice Prisma, esta parte debe migrarse con cuidado.
