# Project File Map

Fecha: 2026-05-27 (actualizado Bloque 6).

Este mapa ayuda a cualquier agente o colaborador a ubicarse rapido en el repo. No reemplaza leer el codigo antes de editar; sirve como indice operativo.

## Archivos Raiz

| Archivo | Responsabilidad |
| --- | --- |
| `README.md` | Entrada rapida del proyecto, setup local y documentos clave. |
| `middleware.ts` | Edge Middleware: CSP con nonce, ruteo de idiomas y proteccion de `/admin/**` con HMAC-SHA256 via Web Crypto API. |
| `package.json` | Scripts, dependencias y seed Prisma. |
| `next.config.ts` | Configuracion Next.js y headers de seguridad base. |
| `playwright.config.ts` | Configuracion E2E y servidor local para Playwright. |
| `vitest.config.ts` | Configuracion de pruebas unitarias. |
| `docker-compose.yml` | PostgreSQL local para desarrollo. |
| `scripts/run-e2e.ts` | Runner E2E: crea schema PostgreSQL temporal, prepara DB, corre Playwright y limpia el schema. |
| `.env.example` | Variables de entorno esperadas sin secretos reales. |
| `.github/workflows/ci.yml` | CI obligatorio sugerido para PRs y pushes a `main`. |
| `.github/pull_request_template.md` | Checklist de PR y evidencia QA. |

## Documentacion Maestra

| Archivo | Responsabilidad |
| --- | --- |
| `docs/project-context.md` | Contexto general del negocio y producto. |
| `docs/learning-file.md` | Memoria viva de decisiones, aprendizajes y estado. |
| `docs/mvp-current-status.md` | Fuente rapida del estado operativo actual del MVP. |
| `docs/roadmap.md` | Fases del proyecto y avance por fase. |
| `docs/product-requirements.md` | Requerimientos funcionales y reglas base. |
| `docs/technical-architecture.md` | Arquitectura tecnica, proveedores y separacion por dominios. |
| `docs/database-schema.md` | Modelo de datos y decisiones de persistencia. |
| `docs/qa-strategy.md` | Estrategia QA, niveles de prueba y flujos criticos. |
| `docs/qa-checklists.md` | Checklists manuales por feature/pantalla. |
| `docs/project-tracking.md` | Forma recomendada de manejar issues, PRs y tablero visual. |
| `docs/ci-cd-quality-gates.md` | Como funciona CI y como bloquear merges sin pruebas. |
| `docs/database-migrations.md` | Flujo seguro de baseline, desarrollo y deploy de migraciones Prisma. |
| `docs/auth-secrets-rotation.md` | Operacion de secretos Auth.js/admin: origen, generacion, rotacion y verificacion. |
| `docs/project-file-map.md` | Este mapa de archivos. |

## Hallazgos Y Backlogs

| Archivo | Responsabilidad |
| --- | --- |
| `docs/agent-review-findings-2026-05-20.md` | Hallazgos de agentes revisores y acciones ya aplicadas. |
| `docs/agent-review-findings-2026-05-21.md` | Consolidado actualizado con CI, documentacion y proximos riesgos. |
| `docs/agent-review-findings-2026-05-26.md` | Bloque 1 (middleware, helpers, randomBytes, cache, /design, autocomplete) y Bloque 2 (rate limiter Redis). |
| `docs/agent-review-findings-2026-05-26-block3.md` | Bloque 3: formateadores centralizados y maquina de estados de orden. |
| `docs/agent-review-findings-2026-05-26-block4.md` | Bloque 4: busqueda en tiempo real con autocomplete y Route Handler. |
| `docs/agent-review-findings-2026-05-27-block5.md` | Bloque 5: filtros a nivel DB y paginacion offset en el catalogo. |
| `docs/agent-review-findings-2026-05-27-block6.md` | Bloque 6: imágenes de producto con Cloudflare R2. |
| `docs/security-hardening-plan.md` | Riesgos de seguridad, controles y gates antes de produccion. |
| `docs/architecture-improvement-backlog.md` | Oportunidades de arquitectura y deuda tecnica. |
| `docs/ui-ux-page-opportunities.md` | Oportunidades UI/UX por pagina. |

## Fases

| Archivo | Responsabilidad |
| --- | --- |
| `docs/phase-1-kickoff.md` | Kickoff de fase inicial. |
| `docs/phase-1-market-research-report.md` | Investigacion de mercado inicial. |
| `docs/phase-1-market-validation-protocol.md` | Protocolo para subir confianza de inventario. |
| `docs/phase-1-name-clearance.md` | Riesgos de marca/nombre comercial. |
| `docs/phase-1-payments-dte-analysis.md` | Evaluacion de pagos locales y DTE. |
| `docs/phase-1-sourcing-plan.md` | Plan de proveedores y sourcing. |
| `docs/phase-1-mvp-backlog.md` | Backlog historico de MVP. |
| `docs/phase-2-technical-setup.md` | Setup tecnico inicial. |
| `docs/phase-3-catalog-product.md` | Catalogo y detalle de producto. |
| `docs/phase-3-data-persistence.md` | Persistencia con Prisma/PostgreSQL. |
| `docs/phase-3-iva-consistency.md` | Regla interna de IVA incluido y redondeo por linea. |
| `docs/phase-4-cart.md` | Carrito guest y reglas de stock. |
| `docs/phase-4-production-readiness.md` | Resumen de Fase 4: pooling, CSP, operaciones y DTE manual. |
| `docs/phase-4-dte-manual-bridge.md` | Puente manual DTE hasta contar con contador/proveedor/sandbox. |
| `docs/phase-5-checkout-orders.md` | Checkout, ordenes y fulfillment inicial. |
| `docs/phase-5-quality-performance-seo.md` | Fase 5: índices, search DB, email, E2E admin y SEO. |
| `docs/phase-6-payments.md` | Capa de pagos mock/reemplazable. |
| `docs/phase-7-admin-orders.md` | Admin de ordenes. |
| `docs/phase-7-admin-products-inventory.md` | Admin de productos e inventario. |
| `docs/phase-7-admin-fulfillment-settings.md` | Admin de retiro, zonas y tarifas. |
| `docs/phase-8-fulfillment-stock-qa.md` | Mapa, cobertura, avisos de stock y QA. |
| `docs/non-payment-mvp-audit-brief.md` | Brief para auditar y planificar mejoras del MVP sin pagos reales. |
| `docs/database-pooling.md` | Regla `DATABASE_URL` pooled + `DIRECT_DATABASE_URL` directa. |
| `docs/production-operations-checklist.md` | Checklist manual de Vercel, R2, Resend/DNS, BD, DTE y CSP. |

## App Router

| Ruta de archivo | Responsabilidad |
| --- | --- |
| `src/app/(storefront)/[locale]/layout.tsx` | Root layout del storefront: `<html lang>`, fuentes, provider de next-intl y metadata con hreflang. |
| `src/app/(admin)/layout.tsx` | Root layout del panel admin, sin prefijo de idioma y fijado a espanol. |
| `src/app/not-found.tsx` | 404 global fuera de los route groups; importa `globals.css` porque Next lo monta con un layout builtin. |
| `src/app/page.tsx` | Home. No debe tener filtros avanzados; esos viven en catalogo. |
| `src/app/catalog/page.tsx` | Catalogo, query params, filtros y estados vacios. |
| `src/app/product/[slug]/page.tsx` | Detalle de producto, compatibilidad y agregar al carrito. |
| `src/app/cart/page.tsx` | Carrito guest, cantidades, totales y avisos de stock. |
| `src/app/cart/actions.ts` | Server actions de carrito y avisos de stock. |
| `src/app/checkout/page.tsx` | Checkout guest con retiro/envio local y mapa. |
| `src/app/checkout/actions.ts` | Server action de checkout. |
| `src/app/ayuda/page.tsx` | Ayuda, FAQ y contacto para soporte/compras sin tocar pagos reales. |
| `src/app/orders/[orderNumber]/page.tsx` | Vista publica de orden guest protegida por token. |
| `src/app/design/page.tsx` | Ruta interna para materializar direccion visual. |

## Admin

| Ruta de archivo | Responsabilidad |
| --- | --- |
| `src/app/admin/login/page.tsx` | Pantalla de login temporal admin. |
| `src/app/admin/login/actions.ts` | Login temporal, cookie admin y rate limit. |
| `src/app/admin/orders/page.tsx` | Listado y filtros de ordenes. |
| `src/app/admin/orders/[orderNumber]/page.tsx` | Detalle admin de orden. |
| `src/app/admin/orders/[orderNumber]/actions.ts` | Cambios de estado, auditoria y restauracion de stock. |
| `src/app/admin/products/page.tsx` | Listado admin de productos. |
| `src/app/admin/products/new/page.tsx` | Alta manual de producto. |
| `src/app/admin/products/[slug]/edit/page.tsx` | Edicion manual de producto. |
| `src/app/admin/products/actions.ts` | Server actions de producto e inventario. |
| `src/app/admin/settings/page.tsx` | Ajustes de retiro, zonas y tarifas. |
| `src/app/admin/settings/actions.ts` | Server actions de ajustes operativos. |
| `src/app/admin/audit/page.tsx` | Vista de eventos auditados. |
| `src/app/admin/stock-alerts/page.tsx` | Solicitudes de aviso por falta de stock. |
| `src/app/admin/stock-alerts/actions.ts` | Cambios de estado de avisos de stock. |

## Componentes

| Ruta de archivo | Responsabilidad |
| --- | --- |
| `src/components/site-header.tsx` | Header y busqueda global hacia catalogo. |
| `src/components/home/home-hero.tsx` | Hero operativo de home. |
| `src/components/home/category-rail.tsx` | Accesos rapidos por categoria. |
| `src/components/product/product-card.tsx` | Card de producto en catalogo/home. |
| `src/components/product/product-filters.tsx` | Contenedor de filtros de catalogo. |
| `src/components/product/catalog-filter-form.tsx` | Formulario auto-submit de filtros. |
| `src/components/product/catalog-active-filters.tsx` | Chips de filtros activos. |
| `src/components/product/vehicle-search-panel.tsx` | Busqueda por vehiculo. |
| `src/components/product/popular-searches.tsx` | Busquedas populares para validacion comercial. |
| `src/components/product/product-visual.tsx` | Visual placeholder consistente de producto. |
| `src/components/product/quantity-stepper.tsx` | Selector editable con botones menos/mas. |
| `src/components/product/stock-badge.tsx` | Label publico de disponibilidad en espanol. |
| `src/components/product/compatibility-badge.tsx` | Badge presentacional de compatibilidad para vehiculo activo futuro. |
| `src/components/empty-state.tsx` | Estado vacio reutilizable con sugerencias y soporte. |
| `src/components/whatsapp-cta.tsx` | CTA reusable de soporte por WhatsApp con fallback a ayuda. |
| `src/components/checkout/checkout-delivery-fields.tsx` | Campos de entrega a domicilio. |
| `src/components/checkout/checkout-location-picker.tsx` | Mapa/pin para ubicacion. |
| `src/components/admin/admin-nav.tsx` | Navegacion admin. |
| `src/components/admin/admin-product-form.tsx` | Formulario reusable de producto. |
| `src/components/admin/admin-session-controls.tsx` | Controles de sesion admin. |
| `src/components/admin/product-image-manager.tsx` | Client Component para subir/eliminar imágenes de producto en el admin. |
| `src/components/catalog-pagination.tsx` | Paginacion URL-first para el catalogo. Server Component sin JS. |

## Dominio Y Librerias

| Ruta de archivo | Responsabilidad |
| --- | --- |
| `src/lib/db.ts` | Prisma client singleton. |
| `src/lib/money.ts` | Formateo/calculos de dinero. |
| `src/lib/cart.ts` | Cookie guest firmada y lectura/escritura de carrito. |
| `src/lib/cart-state.ts` | Construccion de estado de carrito desde productos. |
| `src/lib/cart-validation.ts` | Validaciones de acciones de carrito. |
| `src/lib/checkout.ts` | Validacion de payload de checkout. |
| `src/lib/orders.ts` | Creacion de orden, stock, pagos mock y emails. |
| `src/lib/fulfillment.ts` | Retiro, zonas, tarifas y validacion de coordenadas. |
| `src/lib/admin-auth.ts` | Configuracion y validacion de acceso admin. |
| `src/lib/admin-orders.ts` | Reglas transaccionales de cambios de estado admin, auditoria y restauracion de inventario. |
| `src/lib/admin-session.ts` | Sesion admin firmada. |
| `src/lib/admin-audit.ts` | Escritura de auditoria admin. |
| `src/lib/admin-products.ts` | Validaciones/normalizaciones de productos admin. |
| `src/lib/order-access-token.ts` | Token guest para ver orden publica. |
| `src/lib/oauth-profile.ts` | Reglas puras de seguridad para perfiles OAuth, incluyendo `email_verified` de Google. |
| `src/lib/r2.ts` | Cliente Cloudflare R2 (S3-compatible). Upload/delete/key helpers, MIME guard, max 5 MB. |
| `src/lib/rate-limit.ts` | Rate limiter sincrono en memoria (logica pura, probada con Vitest). |
| `src/lib/rate-limit-redis.ts` | Rate limiter async. Usa Redis (Upstash) si hay credenciales; in-memory si no. |
| `src/lib/form-utils.ts` | Helpers centralizados para leer FormData: `formString`, `optionalFormString`, `optionalFormStringOrNull`. |
| `src/lib/url-utils.ts` | Helpers centralizados para query params: `firstValue`, `allValues`. |
| `src/lib/order-formatters.ts` | Formatters de dominio para ordenes, envios y pagos (labels en es-SV, colores de badge). |
| `src/lib/contact.ts` | Configuracion publica de contacto/WhatsApp para CTAs comerciales. |
| `src/app/api/search/route.ts` | Route Handler GET /api/search?q= para autocomplete en tiempo real. |
| `src/app/api/admin/upload-image/route.ts` | POST handler admin: valida, sube imagen a R2 y crea ProductImage en DB. |
| `src/app/api/admin/delete-image/route.ts` | DELETE handler admin: borra ProductImage de DB y objeto de R2. |
| `src/components/search/search-autocomplete.tsx` | Client Component de busqueda con debounce, dropdown y navegacion por teclado. |
| `src/lib/stock-alerts.ts` | Parseo/deduplicacion de avisos de stock. |
| `src/lib/stock-status.ts` | Identificador de estado de stock (`IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`), etiquetas y parseo con back-compat de los valores en espanol de las URLs viejas. |
| `src/lib/payments/*` | Contrato y proveedor mock de pagos. |
| `src/lib/email/*` | Contrato, provider console, plantillas y logs. |
| `src/lib/invoices/provider.ts` | Contrato futuro para DTE. |
| `src/lib/i18n/config.ts` | Base de idiomas soportados. |
| `src/lib/i18n/routing.ts` | Config de ruteo de next-intl y nombre de la cookie de idioma. |
| `src/lib/i18n/navigation.ts` | Link/redirect/usePathname con prefijo de idioma. |
| `src/lib/i18n/request.ts` | Config por request: resuelve idioma (explicito, segmento, cookie, default) y carga mensajes. |
| `src/lib/i18n/intl-locale.ts` | Mapeo a BCP-47, moneda y zona horaria de la app. |
| `src/lib/i18n/formats.ts` | Formatos compartidos de fecha y numero. |
| `src/lib/i18n/messages/*` | Catalogos por idioma, un JSON por namespace. |
| `src/lib/i18n/legacy-redirects.ts` | Traduce URLs viejas sin prefijo a su equivalente en espanol; guarda contra loop. |
| `src/lib/i18n/middleware-composition.ts` | Re-emite la respuesta de next-intl preservando los headers forwardeados (nonce de CSP). |
| `src/lib/i18n/revalidate.ts` | `revalidatePath` para rutas bajo `[locale]`. |
| `src/lib/i18n/action-locale.ts` | Idioma dentro de una server action, leido del `Referer`. |
| `src/lib/actions/*` | Server actions compartidas por componentes, fuera del arbol de rutas. |
| `src/lib/cookie-consent.ts` | Helpers puros del aviso de cookies: parseo, serializacion y versionado. |
| `src/lib/cookie-consent-server.ts` | Lectura server-side del consentimiento. |
| `src/components/consent/*` | Slot server que decide si mostrar el aviso, y el banner cliente. |

## Datos

| Ruta de archivo | Responsabilidad |
| --- | --- |
| `src/data/mock-products.ts` | Catalogo mock/seed inicial. |
| `src/data/products.ts` | Lectura de catalogo desde Prisma. `getCatalogProducts` (completo) y `getFilteredCatalogProducts` (paginado + filtrado en DB). `PAGE_SIZE = 12`. |
| `src/data/catalog-source.ts` | Decision de fallback mock por ambiente. |
| `src/data/catalog-filters.ts` | Query params, filtros en memoria y `buildPrismaWhere` para filtros en DB. |
| `prisma/schema.prisma` | Modelo de datos. |
| `prisma/seed.ts` | Seed de productos, categorias, zonas y settings. |

## Pruebas

| Ruta de archivo | Responsabilidad |
| --- | --- |
| `src/**/*.test.ts` | Pruebas unitarias Vitest de reglas de negocio. |
| `tests/e2e/admin.spec.ts` | E2E de login/admin y avisos de stock. |
| `tests/e2e/catalog-cart.spec.ts` | E2E de catalogo, carrito, checkout pickup/local completo y aviso de stock. |
| `tests/e2e/responsive.spec.ts` | E2E responsive smoke para paginas cliente/admin criticas en mobile/tablet. |

## Regla Para Agentes

Antes de editar:

1. Leer este mapa.
2. Leer el documento de fase correspondiente.
3. Leer el codigo real del archivo que se va a tocar.
4. Revisar tests existentes del mismo dominio.
5. Actualizar `docs/learning-file.md` si cambia una decision o regla del negocio.
