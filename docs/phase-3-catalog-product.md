# Phase 3 Catalog and Product

## Estado

- Fecha: 2026-05-18.
- Rama local actual: `codex/prisma-seed-catalog`.
- Estado: primera base de catalogo y detalle de producto creada; catalogo conectado a capa de datos con fallback mock.

## Cambios incluidos

- Ruta `/catalog`.
- Ruta `/product/[slug]`.
- Generacion de params de producto desde la capa de datos.
- Componentes reutilizables:
  - `SiteHeader`;
  - `ProductCard`;
  - `ProductFilters`;
  - `VehicleSearchPanel`;
  - `StockBadge`.
- Mock data enriquecida con:
  - `slug`;
  - categoria;
  - descripcion;
  - compatibilidades;
  - detalles tecnicos;
  - stock.
- Capa `src/data/products.ts` para leer desde Prisma/PostgreSQL con fallback mock.
- Capa `src/data/catalog-filters.ts` para filtros por query params.
- Seed Prisma inicial para categorias, productos, compatibilidad e inventario.
- Paginas dinamicas para evitar stock congelado en build.
- Filtros funcionales por busqueda, categoria, marca, disponibilidad y vehiculo.
- Tests unitarios para helpers de productos.

## Alcance

Esta fase ya prepara la persistencia real con Prisma/PostgreSQL, pero conserva fallback mock para no bloquear desarrollo cuando la base local no esta disponible.

La conexion real con PostgreSQL queda pendiente de validacion local completa porque Docker no esta instalado en la Mac actual.

## Verificaciones ejecutadas

- `npm run typecheck`: OK.
- `npm run lint`: OK.
- `npm test`: OK, 4 pruebas.
- `npx prisma validate`: OK.
- `npm run build`: OK.

## Rutas a revisar

- `/`
- `/catalog`
- `/catalog?q=sentra`
- `/catalog?category=Filtros`
- `/catalog?vehicleMake=Toyota&vehicleModel=Corolla&vehicleYear=2015`
- `/product/filtro-aceite-toyota-18l`
- `/product/pastillas-delanteras-nissan-sentra`

## Pendientes siguientes

1. Ejecutar `db:migrate:deploy` y `db:seed` cuando Docker/PostgreSQL este disponible.
2. Crear carrito inicial.
3. Agregar pruebas E2E cuando el flujo tenga navegacion completa.
