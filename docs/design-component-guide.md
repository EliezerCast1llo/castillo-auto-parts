# Design component guide

Fecha: 2026-05-20.

## Dirección

El candidato 1 de Canva queda como base visual para extender el sistema de componentes de Castillo Auto Parts.

Regla de producto:

- Home no tiene filtros.
- Catálogo concentra búsqueda por vehículo, filtros, chips activos y comparación.
- Producto prioriza compatibilidad antes que descripción larga.
- Carrito prioriza stock, cantidad, subtotal y confirmación antes de checkout.

## Principios UX

- En autopartes el usuario compra compatibilidad, no solo un producto.
- Las cards deben tener altura consistente y CTA alineado.
- El stock se comunica en español: `Disponible`, `Últimas unidades`, `No disponible`.
- Los filtros aplicados deben ser visibles, removibles y reproducibles por URL.
- Mobile debe conservar imagen, precio, stock, compatibilidad y CTA sin saturar.
- Contraste, foco visible y targets táctiles son parte del diseño, no ajustes finales.

## Componentes MVP

### Home

- `HomeHero`: mensaje claro, CTA `Ver catálogo`, CTA secundario `Buscar por vehículo`.
- `PopularSearches`: atajos como `Amortiguadores`, `Pastillas de freno`, `Filtro de aceite`, `Toyota Corolla`.
- `CategoryRail`: categorías visuales iniciales, sin comportamiento de filtro lateral.
- `TrustBand`: retiro en bodega, envío local, compra invitada y pago en línea.

### Catálogo

- `VehicleSelector`: marca, modelo y año, solo en `/catalog`.
- `FilterSidebar`: filtros desktop.
- `FilterDrawer`: filtros mobile.
- `AppliedFilterChips`: filtros activos removibles.
- `ProductCard`: imagen, categoría, nombre, marca, SKU, compatibilidad, stock, precio y CTA.
- `CatalogEmptyState`: sugerencias y limpiar filtros.

### Producto

- `ProductDetailHero`: galería, nombre, precio, stock, cantidad y CTA.
- `FitmentTable`: compatibilidad por marca, modelo, año y motor/versión cuando exista.
- `TechnicalSpecs`: tabla de detalles técnicos.
- `AssistanceCta`: `¿No estás seguro?` para chat o contacto futuro.
- `RelatedProducts`: repuestos relacionados o compatibles.

### Carrito

- `CartLineItem`: producto, SKU, stock, cantidad editable, subtotal y eliminar.
- `CartSummary`: productos, envío, total y nota `Precios incluyen IVA`.
- `StockChangeNotice`: alerta si un producto cambia de stock.
- `CheckoutReadiness`: disponibilidad, pago en línea y entrega.

## Responsive

- Desktop: catálogo con filtros a la izquierda y grid de 3 columnas.
- Tablet: filtros en bloque superior colapsable o sidebar reducido.
- Mobile: botón sticky `Filtrar`, drawer completo, chips horizontales y cards de 1 columna.
- Producto mobile: CTA sticky inferior con precio y `Agregar`.
- Carrito mobile: resumen debajo y CTA visible al terminar revisión.

## Prioridad

MVP:

- Home sin filtros.
- Catálogo con filtros fuertes.
- Cards uniformes.
- Producto con compatibilidad clara.
- Carrito con stock, cantidad y total.

Futuro:

- `Mi vehículo`.
- VIN o placa si aplica.
- Comparación de productos.
- Recomendaciones compatibles.
- Historial de compras.
- Chat contextual por producto.

## Fuentes

- Baymard Applied Filters: https://baymard.com/blog/how-to-design-applied-filters
- Baymard Search UX 2026: https://baymard.com/blog/ecommerce-search-query-types
- Baymard Mobile Search Results: https://baymard.com/mcommerce-usability/benchmark/mobile-page-types/search-results
- Auto Care ACES/PIES: https://www.autocare.org/aces/
- WCAG 2.2: https://w3c.github.io/wcag/guidelines/22/
