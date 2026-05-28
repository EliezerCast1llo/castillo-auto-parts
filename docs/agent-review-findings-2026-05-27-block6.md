# Agent Review — Block 6: Cloudflare R2 Image Uploads

Fecha: 2026-05-27
Rama: `claude/block-6-r2-images`

## Resumen del bloque

Integración completa de imágenes de producto usando Cloudflare R2 (almacenamiento S3-compatible).
Cubre carga y eliminación desde el admin, almacenamiento en DB y visualización en el catálogo público.

## Archivos nuevos

- **`src/lib/r2.ts`** — Cliente S3 apuntando a R2 con lazy singleton, funciones de upload/delete/key y MIME type guard.
- **`src/app/api/admin/upload-image/route.ts`** — POST handler autenticado: valida archivo, sube a R2, crea `ProductImage` en DB.
- **`src/app/api/admin/delete-image/route.ts`** — DELETE handler autenticado: borra de DB primero (transacción), luego de R2.
- **`src/components/admin/product-image-manager.tsx`** — Client Component que lista imágenes existentes, permite subir y eliminar con estado optimista.

## Archivos modificados

- **`src/data/products.ts`** — `productInclude` incluye `images` con `orderBy`; `mapDbProduct` expone `primaryImageUrl`.
- **`src/data/mock-products.ts`** — `MockProduct` tiene campo `primaryImageUrl: string | null`; todos los mocks usan `null`.
- **`src/components/product/product-card.tsx`** — Muestra `<Image>` de next/image cuando `primaryImageUrl` existe, `<ProductVisual>` como fallback.
- **`src/app/product/[slug]/page.tsx`** — Vista detalle muestra imagen real en panel principal y thumbnail; fallback a `<ProductVisual>`.
- **`src/app/admin/products/[slug]/edit/page.tsx`** — Agrega `images` al include de DB y renderiza `<ProductImageManager>` debajo del formulario.
- **`next.config.ts`** — `remotePatterns` incluye el hostname de R2 extraído dinámicamente de `R2_PUBLIC_URL`.
- **`.env`** — Variables R2 agregadas (no committear; ya en `.gitignore`).
- **`.env.example`** — Sección R2 con placeholders y comentarios de setup.

## Decisiones técnicas

### Consistencia DB-R2
Orden: eliminar de DB primero (transacción), luego de R2. Si R2 falla, el objeto queda huérfano en storage pero sin referencia en DB — el estado más seguro. Lo inverso (R2 primero) dejaría una referencia DB apuntando a nada.

### Rollback en upload
Si la escritura en DB falla después de subir a R2, el handler intenta borrar el objeto de R2 para evitar huérfanos. Si ese borrado también falla, se loguea para limpieza manual.

### `as const` eliminado de `productInclude`
Prisma espera arrays mutables en `orderBy`. El `as const` externo hacía los arrays `readonly`, rompiendo el tipado. Los literales `"desc" as const` / `"asc" as const` inline preservan el narrowing sin la restricción readonly.

### `ProductImageManager` fuera del `<form>`
`AdminProductForm` es un Server Component. `ProductImageManager` es un Client Component que gestiona sus propias peticiones fetch. Se integra en la página de edición (Server Component), no dentro del formulario, evitando mezclar Server/Client boundaries innecesariamente.

### Hostname R2 dinámico en `next.config.ts`
Se lee `R2_PUBLIC_URL` en tiempo de build y se extrae el hostname con `new URL()`. Si la variable no está definida (ej. CI sin R2), el patrón se omite silenciosamente.
No hardcodear hosts `pub-*.r2.dev`; para producción usar preferiblemente un dominio propio en `CLOUDFLARE_R2_PUBLIC_URL`.

### `isAdminAuthenticated()` en Route Handlers
`requireAdminAccess()` lanza un `redirect()` de Next.js, apropiado para Server Components/Actions pero no para Route Handlers (donde se necesita devolver `NextResponse`). Los Route Handlers usan `isAdminAuthenticated()` que retorna `boolean`.

## Riesgos y pendientes

- **Objetos huérfanos en R2**: si el rollback del upload falla, quedan objetos sin referencia. Considerar un cron de limpieza futura.
- **Sin set de imágenes múltiples en UI pública**: el detail page muestra solo la imagen primaria. La galería con thumbnails de imágenes adicionales queda como mejora futura.
- **Sin reordenamiento drag-and-drop**: el orden de imágenes se establece por `sortOrder` en DB pero no hay UI para cambiar ese orden.
- **Sin compresión/redimensionado en servidor**: las imágenes se suben tal como las envía el usuario (máx 5 MB). `next/image` optimiza en servido, no en origen.

## Validaciones post-bloque

- `npm run typecheck` — sin errores.
- `npm run lint` — sin errores.
