# Database Migrations

Fecha: 2026-06-21.

Este documento define el flujo seguro de migraciones PostgreSQL con Prisma para Castillo Auto Parts.

## Regla operativa

- Desarrollo genera migraciones con `prisma migrate dev`.
- CI, E2E, preview y produccion aplican migraciones con `prisma migrate deploy`.
- No usar `prisma db push` sobre bases con datos reales.
- Cada cambio de `prisma/schema.prisma` debe incluir su migracion SQL en el mismo PR.
- Revisar el SQL antes de aplicar una migracion que elimine o transforme datos.

## Base nueva

Para una base vacia:

```bash
npm run db:migrate:deploy
npm run db:seed
```

La migracion inicial `20260621000000_baseline` crea el esquema completo previo a la Fase 2.

## Base existente creada con db push

No ejecutar el baseline directamente sobre una base que ya contiene las tablas. Primero:

1. Crear un backup.
2. Confirmar que `DATABASE_URL` apunta al ambiente correcto.
3. Comparar la base existente contra el datamodel:

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code
```

4. Si no hay diferencias, marcar el baseline como ya aplicado:

```bash
npx prisma migrate resolve --applied 20260621000000_baseline
npm run db:migrate:status
```

Si hay diferencias, no marcar el baseline. Revisar el drift y preparar una migracion de reconciliacion.

## Crear una migracion

Despues de editar `prisma/schema.prisma` en desarrollo:

```bash
npm run db:migrate:dev -- --name descripcion_corta
```

Antes del commit:

1. Revisar `prisma/migrations/<timestamp>_<nombre>/migration.sql`.
2. Ejecutar `npx prisma validate`.
3. Aplicar las migraciones sobre una base limpia.
4. Correr lint, typecheck, unit y E2E.

## Produccion

El deploy debe ejecutar:

```bash
npm run db:migrate:deploy
```

`migrate deploy` aplica solo migraciones pendientes y no genera migraciones nuevas. El seed no debe ejecutarse automaticamente en produccion salvo que exista una decision operativa explicita.

## Fallos y rollback

- No editar una migracion que ya fue aplicada en un ambiente compartido.
- Corregir con una migracion nueva hacia adelante.
- Si una migracion falla, detener el deploy y revisar `prisma migrate status`.
- Restaurar desde backup solo cuando la migracion haya alterado datos de forma irreversible.
