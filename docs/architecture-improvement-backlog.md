# Architecture improvement backlog

Fecha: 2026-05-20.

## P0

### Fallback mock data

Problema: `src/data/products.ts` usa mock data cuando la base de datos falla. Esto ayuda en desarrollo, pero en produccion podria mostrar inventario no real.

Decision sugerida: agregar `ENABLE_MOCK_CATALOG_FALLBACK`, permitirlo por defecto en desarrollo y desactivarlo en produccion.

Implementado en `codex/catalog-production-fallback`:

- Mock catalog fallback solo fuera de produccion.
- Catálogo muestra estado `Catálogo temporalmente no disponible` si falla DB en produccion.
- Home no muestra productos mock si la DB falla en produccion.

### Compatibilidad vehicular estructurada

Problema: filtros de vehiculo dependen de strings como `Toyota Corolla 2009-2022`.

Decision sugerida: introducir datos estructurados para marca, modelo, anio inicial, anio final, motor/version y notas. Mantener texto solo como presentacion.

## P1

- Separar estado interno de inventario de label publico.
- Validar acciones de carrito con helper dedicado.
- Limpiar o ignorar SKUs invalidos al leer carrito.
- Agregar `aria-label` a links visuales de producto.

Completado en `codex/ui-brand-foundation`:

- Convertir busqueda del header en formulario real hacia `/catalog`.
- Agregar `aria-label` a links visuales de producto.

## P2

- Extraer componentes repetibles: `PageIntro`, `Notice`, `SummaryRow`, `TrustBadge`.
- Mover filtros de catalogo a DB/paginacion cuando el volumen crezca.
- Mover colores de `ProductVisual` a tokens del tema.

## PRs sugeridos

1. `codex/catalog-production-fallback`.
2. `codex/cart-action-validation`.
3. `codex/vehicle-compatibility-structure`.
4. `codex/shared-page-components`.
