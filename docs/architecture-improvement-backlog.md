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

Implementado en `codex/vehicle-compatibility-structure`:

- `CatalogProduct` ahora expone `vehicleCompatibilities` estructurado.
- Los filtros de vehiculo usan marca, modelo y rango de anios desde datos estructurados.
- Los textos `compatibleVehicles` quedan para busqueda/presentacion, no para logica critica.
- Los productos universales no aparecen por filtro vehicular hasta que exista una regla explicita de compatibilidad.

## P1

- Separar estado interno de inventario de label publico.
- Agregar `aria-label` a links visuales de producto.

Completado en `codex/vehicle-compatibility-structure`:

- Validar acciones de carrito con helper dedicado.
- Limpiar o ignorar SKUs invalidos al leer carrito.
- Limitar cantidad maxima por linea de carrito.
- Resolver zona de entrega por `deliveryZoneSlug` en servidor para no confiar en municipio/departamento enviados por el cliente.

Completado en `codex/ui-brand-foundation`:

- Convertir busqueda del header en formulario real hacia `/catalog`.
- Agregar `aria-label` a links visuales de producto.

## P2

- Agregar auditoria admin para cambios operativos.
- Extraer componentes repetibles: `PageIntro`, `Notice`, `SummaryRow`, `TrustBadge`.
- Mover filtros de catalogo a DB/paginacion cuando el volumen crezca.
- Mover colores de `ProductVisual` a tokens del tema.

Completado en `codex/vehicle-compatibility-structure`:

- Modelo `AdminAuditLog` para eventos operativos.
- Helper `writeAdminAuditLog` para acciones admin.
- Registro de cambios en productos, inventario, ordenes, retiro en bodega y zonas de entrega.
- Vista `/admin/audit` con los ultimos eventos.

### Emails transaccionales

Implementado en `codex/vehicle-compatibility-structure`:

- Proveedor de email `console/mock` para MVP sin credenciales reales.
- Plantilla de confirmacion de orden.
- Registro `EmailLog` con estado `SENT` o `FAILED`.
- Envio de confirmacion despues de crear una orden pagada simulada.

## PRs sugeridos

1. `codex/catalog-production-fallback`.
2. `codex/cart-action-validation`.
3. `codex/vehicle-compatibility-structure`.
4. `codex/shared-page-components`.
