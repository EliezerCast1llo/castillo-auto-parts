# Agent Review Findings — 2026-05-27 Bloque 5

## Resumen

Bloque 5 implementa filtros a nivel de base de datos y paginación offset en el catálogo público.
Antes de este bloque, `getCatalogProducts()` cargaba todos los productos activos en memoria y
`filterCatalogProducts()` los filtraba en JavaScript. Con inventarios grandes esto escala mal.

## Motivación

- La carga total de productos en memoria es O(N) sin límite superior.
- El filtrado en JS impide aprovechar índices de base de datos existentes.
- Sin paginación, el catálogo muestra todos los resultados en una sola página.
- El índice `@@index([make, model, yearFrom, yearTo])` en `VehicleCompatibility` existía
  pero no se usaba porque el filtrado ocurría en memoria.

## Archivos modificados

| Archivo | Tipo | Cambio |
|---|---|---|
| `src/data/catalog-filters.ts` | Modificado | `buildPrismaWhere`, `stockStatusToPrismaStatuses` |
| `src/data/products.ts` | Modificado | `PAGE_SIZE`, `getFilteredCatalogProducts`, `buildMockPaginatedResult` |
| `src/app/catalog/page.tsx` | Modificado | Usa `getFilteredCatalogProducts` + `CatalogPagination` |
| `src/components/catalog-pagination.tsx` | Nuevo | Componente Server de paginación URL-first |
| `src/data/catalog-filters.test.ts` | Extendido | Tests de `buildPrismaWhere` y `stockStatusToPrismaStatuses` |

## Decisiones técnicas

### Paginación offset vs cursor

Se eligió **paginación offset** (`skip/take`) sobre cursor porque:
- El catálogo tiene filtros dinámicos que cambian frecuentemente entre páginas.
- El cursor requiere mantener contexto y no funciona bien cuando el usuario
  cambia filtros a mitad de paginación.
- Con los volúmenes del MVP (50–500 SKUs) el offset no tiene penalización de rendimiento.
- Si el catálogo crece a miles de productos en el futuro, se puede migrar a cursor.

### PAGE_SIZE = 12

- Múltiplo de 2, 3 y 4: encaja bien con grids de 2 y 3 columnas (`md:grid-cols-2 xl:grid-cols-3`).
- Configurable como constante exportada en `src/data/products.ts`.

### Retrocompatibilidad de getCatalogProducts()

`getCatalogProducts()` se mantiene **sin cambios** para:
- `/api/search` (autocomplete): necesita el catálogo completo para búsqueda por texto rico.
- `getCatalogFilterOptions()`: las opciones de filtro (marcas, categorías, vehículos) deben
  reflejar el universo completo, no solo la página actual.
- `React.cache()` garantiza que si ambas se llaman en el mismo render, la query a DB ocurre
  una sola vez.

### Búsqueda por texto en DB vs memoria

`buildPrismaWhere` filtra por `name`, `sku`, `partNumber` y `brand` con `mode: "insensitive"`.

Búsquedas más ricas (descripción, detalles técnicos, vehículos en texto) siguen haciéndose
en el autocomplete vía `filterCatalogProducts`, que trabaja en memoria sobre el catálogo
cacheado. Esto es correcto: el autocomplete tiene `MAX_RESULTS=6` y opera sobre todo el
catálogo, mientras el catálogo paginado solo necesita el subconjunto relevante.

### Fallback mock con paginación

`buildMockPaginatedResult` aplica `filterCatalogProducts` en memoria sobre `mockProducts`
y luego pagina con `slice`. Solo se activa en desarrollo/preview cuando PostgreSQL no
responde y `ENABLE_MOCK_CATALOG_FALLBACK` está activo.

### Componente CatalogPagination

- Server Component puro — sin estado cliente, sin JS.
- Genera `<a href>` preservando todos los searchParams actuales y solo cambiando `page`.
- `buildPageNumbers(current, total)`: muestra siempre primera, última y 2 vecinas del actual.
  Inserta "…" cuando hay saltos. Evita ventana de paginación gigante con muchas páginas.
- `aria-current="page"` en la página activa para accesibilidad.
- No se renderiza cuando `totalPages <= 1` (sin paginación innecesaria).

## Invariantes preservados

- Las rutas, searchParams y filtros existentes no cambiaron.
- El estado de "catálogo no disponible" funciona igual.
- El badge de fuente (mock/activo) se mantiene.
- El contador de productos ahora muestra el total real + "Página X de Y".

## Validaciones ejecutadas

```
npm run typecheck  → ✓ sin errores en archivos del proyecto
npm run lint       → ✓ sin warnings
npm test           → bloqueado en sandbox (rolldown ARM64 no disponible); ejecutar localmente
npm run build      → pendiente ejecutar localmente
```

## QA manual sugerido

1. Abrir `/catalog` sin filtros — verificar que aparece paginación si hay > 12 productos.
2. Filtrar por categoría → paginación debe resetear a página 1 (el formulario lo hace ya que
   los filtros son parámetros GET y no hay `page` en los inputs).
3. Cambiar de página → verificar que los filtros activos se preservan en la URL.
4. Filtrar por vehículo + paginar → resultados deben ser coherentes entre páginas.
5. Catálogo vacío → no debe aparecer paginación.
6. Verificar en mobile que la paginación no hace overflow horizontal.

## Pendientes / Riesgos

- **getFilteredCatalogProducts + getCatalogProducts en el mismo render:** Si la DB devuelve
  productos, se hacen 2 queries distintas (una paginada + filtrada, otra completa para
  opciones de filtro). `React.cache()` no ayuda aquí porque los `where` son diferentes.
  En el MVP con 50–500 SKUs esto es aceptable. Si el volumen crece, considerar cachear las
  opciones de filtro por separado (con `revalidateTag` o TTL).

- **Filtro de stock y JOIN:** `inventoryStocks: { some: { status: { in: [...] } } }` genera
  un EXISTS en SQL. Con múltiples bodegas en el futuro puede traer falsos positivos si un
  producto tiene stock en una bodega pero no en otra. Por ahora la bodega es única (MAIN).

- **Búsqueda full-text:** El filtro de texto en DB busca solo en 4 campos. Si se necesita
  búsqueda por descripción o compatibilidad en el catálogo, considerar PostgreSQL full-text
  search (`@@` con `to_tsvector`).
