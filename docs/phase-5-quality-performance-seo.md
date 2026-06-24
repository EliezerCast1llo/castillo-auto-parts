# Fase 5 - Calidad, performance, testing y SEO

Fecha: 2026-06-24.

## Alcance

Esta fase cubre las tareas `T-050` a `T-054` del plan:

- `T-050`: índices de base de datos para filtros, relaciones y rutas críticas.
- `T-051`: búsqueda `/api/search` consultando DB con `select/take` mínimo y rate limit por IP.
- `T-052`: email provider endurecido y reset de contraseña protegido contra abuso.
- `T-053`: E2E de autorización por rol en admin.
- `T-054`: limpieza SEO en sitemap, robots y metadatos noindex.

## Cambios principales

### Índices

Se agregó la migración `20260624090000_phase5_indexes` con índices para:

- `Product.categoryId`;
- `Product.brand`;
- `Product.isActive + Product.isFeatured`;
- `Product.isActive + Product.brand`;
- `ProductImage.productId`;
- `VehicleCompatibility.productId`;
- `CartItem.productId`;
- `OrderItem.orderId`;
- `OrderItem.productId`.

Verificación recomendada con datos reales:

```sql
EXPLAIN ANALYZE
SELECT "id", "name", "slug", "sku", "priceCents"
FROM "Product"
WHERE "isActive" = true AND "brand" = 'WIX'
ORDER BY "isFeatured" DESC, "name" ASC
LIMIT 12;
```

### Búsqueda

`GET /api/search` ya no llama `getCatalogProducts()` ni carga el catálogo completo.

Ahora:

- valida tamaño de query;
- aplica rate limit por IP;
- llama `searchCatalogProducts(q, 6)`;
- selecciona solo campos mínimos para el autocomplete;
- conserva fallback mock solo fuera de producción si la DB está vacía/no disponible.

### Email

`getEmailProvider()` ahora falla explícitamente si:

- producción intenta usar `EMAIL_PROVIDER=console`;
- `EMAIL_PROVIDER` tiene un valor desconocido.

El provider `console` sigue permitido en desarrollo y E2E aislado.

### Admin roles

Playwright ahora cubre regresiones de autorización:

- `ADMIN` abre páginas owner-only;
- `MARKETING` puede usar productos pero no usuarios;
- `SUPPORT` puede usar avisos pero no settings;
- `ACCOUNTING` puede usar órdenes pero no productos.

### SEO

- `/auth/` queda bloqueado en `robots.txt`.
- Login/register/forgot/reset/admin login tienen `robots: noindex`.
- `sitemap.xml` ya no incluye login ni registro.

### Limpieza de calidad

- Se eliminaron warnings de lint heredados en checkout por código sin uso.

## Validación ejecutada

- `DIRECT_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/castillo_auto_parts" npx prisma validate`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run test:e2e`

## Pendientes

- Ejecutar `EXPLAIN ANALYZE` con inventario real o al menos un seed grande.
- Revisar métricas reales de `/api/search` en preview.
