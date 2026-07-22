# Auditoría MVP sin pagos reales — Castillo Auto Parts

> **Fecha:** 2026-06-24
> **Alcance:** auditoría de solo lectura enfocada en áreas que **no** dependen de pagos reales (UX, flujo cliente, admin, inventario, emails, SEO, accesibilidad, performance, testing, documentación y seguridad no relacionada con dinero real). No se modificó código.
> **Regla aplicada:** no se tocó la integración de pagos reales (Wompi, webhook, firma, idempotencia, conciliación, reembolsos, DTE). El flujo mock se revisó solo para confirmar que no confunde al cliente ni rompe QA.
> **Base documental:** `docs/non-payment-mvp-audit-brief.md`, `docs/mvp-current-status.md`, `docs/learning-file.md`, `docs/project-file-map.md`, `docs/product-requirements.md`, `docs/roadmap.md`, `docs/plan-de-trabajo.md`, `docs/auditoria.md`, `docs/phase-5-quality-performance-seo.md`, `docs/production-operations-checklist.md`.
> **Plan accionable:** [docs/non-payment-mvp-work-plan.md](non-payment-mvp-work-plan.md).

---

## Resumen ejecutivo (para QA)

El MVP está **sólido en su núcleo transaccional**: la reserva/confirmación/liberación de inventario es atómica, los precios se recalculan en el servidor, el carrito guest va firmado, las órdenes guest usan token con hash, y la mayoría de los hallazgos de la auditoría previa (`docs/auditoria.md`) **ya se cerraron** (índices de BD, búsqueda en BD, CSP en `Report-Only`, migraciones versionadas, verificación de rol en endpoints de imágenes, revalidación de `isActive`/rol en admin). El flujo de pago **mock** está correctamente bloqueado en producción, claramente etiquetado como entorno de desarrollo, valida el `returnTo` y es idempotente: **no confunde a QA ni deja la puerta abierta en producción.**

Dentro del alcance "sin pagos reales", **no hay hallazgos P0** (los P0 conocidos —DTE real y webhook Wompi como fuente de verdad— están congelados por decisión, fuera de este alcance). Sí hay dos **P1** y un grupo de **P2** que conviene cerrar antes de exponer la tienda y antes de sumar más usuarios admin:

1. **Bloqueo de admin por gestión de usuarios (P1, NP-001).** Un `ADMIN` puede desactivarse a sí mismo o desactivar/degradar al último `ADMIN`. Como el panel revalida `isActive`/rol en cada request, el negocio puede quedarse **sin acceso admin** sin recuperación dentro de la app.
2. **La auditoría no registra quién hizo el cambio (P1, NP-002).** Las columnas `adminUserId`/`adminUserEmail` existen, pero las acciones de órdenes, productos, inventario, ajustes y avisos de stock **no las llenan**. Hoy se sabe *qué* cambió pero no *quién* — justo lo que el MVP pedía rastrear.
3. **Comunicación post-compra incompleta (P2).** Solo existe el email de confirmación de orden. No hay emails de cambio de estado (enviado/entregado/cancelado) ni notificación automática de "vuelve a haber stock", aunque sí se recolectan los contactos.
4. **Fricciones de fulfillment y de cliente (P2).** Los clientes con sesión y sin teléfono guardado terminan con `customerPhone = "00000000"`; el detalle de orden del admin no muestra notas de entrega ni ubicación; el mapa/pin no es operable por teclado y las coordenadas son obligatorias para envío local.
5. **Inconsistencias de admin y consistencia visual (P2).** El rol `MARKETING` ve controles de producto/inventario que fallan en silencio; la lista de órdenes no tiene búsqueda ni paginación; y conviven **dos sistemas de tokens visuales** que hacen que las páginas post-compra se vean distintas al catálogo.

**Recomendación principal:** cerrar NP-001 y NP-002 de inmediato (esfuerzo bajo, alto impacto en confianza/operación), luego la tanda P2 de cliente/admin/emails que mueve la aguja de conversión y operación. Lo demás es performance, QA y polish que puede ir en paralelo. **Nada de esto requiere tocar pagos reales.**

---

## Estado respecto a la auditoría previa (`docs/auditoria.md`)

Para que QA no re-trabaje, esto **ya se resolvió** desde la auditoría del 2026-06-11 y se confirmó en este pase (no son hallazgos nuevos):

| Hallazgo previo | Estado confirmado | Evidencia |
|---|---|---|
| H-001 / H-018 — endpoints de imágenes sin rol/auditoría | **Resuelto** | `getAdminUserForHandler("ADMIN","MARKETING")` + `writeAdminAuditLog` en [upload-image](src/app/api/admin/upload-image/route.ts) y [delete-image](src/app/api/admin/delete-image/route.ts) |
| H-002 — rol/`isActive` no revalidados (admin) | **Resuelto (admin)** | `getSessionAdminUser` revalida contra BD en cada request — [admin-auth.ts:96](src/lib/admin-auth.ts) |
| H-006 — `db push` sin migraciones | **Resuelto** | `prisma/migrations/**` versionadas; CI usa `db:migrate:deploy` |
| H-010 — sin CSP | **Resuelto (Report-Only)** | nonce + CSP en [middleware.ts:59](middleware.ts) |
| H-011 — faltan índices | **Resuelto** | migración `20260624090000_phase5_indexes` |
| H-012 — IVA inconsistente | **Resuelto** | `calculateOrderTaxCents` suma IVA por línea + IVA del envío — [checkout.ts:98](src/lib/checkout.ts) |
| H-014 — `/api/search` carga todo | **Resuelto** | `searchCatalogProducts` con `select/take` — [products.ts:59](src/data/products.ts) |
| H-019 — `buildR2Key` débil / MIME no verificado | **Resuelto** | `isValidProductId` + `hasValidImageMagicBytes` en upload |

> Los bloqueantes de producción **H-004 (DTE)** y **H-007 (webhook Wompi como fuente de verdad)** quedan **fuera de alcance** por la regla del brief (pagos congelados). Se mencionan solo como pendientes de preproducción en el plan.

---

## Lista priorizada de hallazgos

### NP-001 · Gestión de usuarios permite el auto-bloqueo / bloqueo del último ADMIN
- **Severidad:** P1 (bordea P0 por bloqueo operativo del panel)
- **Área:** admin / seguridad
- **Ubicación:** [src/app/admin/users/actions.ts:69](src/app/admin/users/actions.ts) (`updateAdminUserAction`), [src/lib/admin-user.ts:142](src/lib/admin-user.ts) (`updateAdminUser`), revalidación en [src/lib/admin-auth.ts:96](src/lib/admin-auth.ts).
- **Evidencia:** `updateAdminUserAction` recibe `isActive` y `role` del formulario y los aplica sin ninguna validación de que el usuario editado sea uno mismo, ni de que exista al menos otro `ADMIN` activo. Como `getSessionAdminUser` ahora revalida `isActive` y rol contra la BD en **cada** request del panel, el cambio surte efecto en el siguiente request.
- **Por qué importa:** un administrador puede, por error o sin querer, desactivarse a sí mismo o bajarse de rol; o desactivar/degradar al **único** `ADMIN` que queda. Al ser el panel quien valida contra BD en vivo, el negocio se queda **sin nadie con permiso para gestionar usuarios, productos, ajustes ni auditoría**, sin un camino de recuperación dentro de la aplicación.
- **Riesgo:** pérdida total de acceso administrativo; recuperación solo vía acceso directo a la base de datos o re-seed (riesgoso en producción). Operación detenida.
- **Solución propuesta:** en `updateAdminUserAction`/`updateAdminUser`, (a) impedir que un usuario se desactive o se quite el rol `ADMIN` a sí mismo; (b) impedir desactivar o degradar al último `ADMIN` activo (contar `ADMIN` activos antes de aplicar). Devolver un `estado` de error claro en ambos casos.
- **Esfuerzo:** S
- **Criterios de aceptación:** intentar desactivar/degradar al último `ADMIN` activo falla con mensaje claro y no modifica nada; un `ADMIN` no puede auto-desactivarse ni quitarse su propio rol `ADMIN`; con dos `ADMIN` activos sí se puede desactivar a uno.
- **Cómo verificar:** test de integración con uno y con dos `ADMIN`; `npm test`; prueba manual en `/admin/users`.
- **Dependencias:** ninguna técnica. **Confirmar con Eliezer** la regla de negocio (es lógica de autorización).

---

### NP-002 · La auditoría admin no registra quién realizó el cambio (actor ausente)
- **Severidad:** P1
- **Área:** seguridad / admin
- **Ubicación:** [src/lib/admin-orders.ts:141](src/lib/admin-orders.ts), [src/app/admin/products/actions.ts:77](src/app/admin/products/actions.ts) (y 145, 208), [src/app/admin/settings/actions.ts:55](src/app/admin/settings/actions.ts), [src/app/admin/stock-alerts/actions.ts:42](src/app/admin/stock-alerts/actions.ts); helper en [src/lib/admin-audit.ts](src/lib/admin-audit.ts).
- **Evidencia:** `writeAdminAuditLog` acepta `adminUserId`/`adminUserEmail` como **opcionales**. Solo los endpoints de imágenes y las acciones de usuarios los pasan. Las acciones de **órdenes, productos, inventario, ajustes de retiro/zonas y avisos de stock** llaman a `writeAdminAuditLog` sin actor, aunque ya tienen el usuario en mano vía `requireAdminRole(...)` (p. ej. `updateAdminOrderStatus` descarta el retorno de `requireAdminRole`).
- **Por qué importa:** el MVP exige explícitamente que "los cambios de admin queden auditados para rastrear inventario, órdenes y ajustes" (`docs/learning-file.md`). Hoy el registro dice *qué* cambió pero no *quién* lo hizo: ante un error o abuso (precio mal puesto, stock alterado, orden cancelada) no se puede atribuir la acción.
- **Riesgo:** imposibilidad de investigar incidentes operativos; auditoría a medias que da falsa sensación de trazabilidad.
- **Solución propuesta:** capturar el `AdminSessionUser` que ya devuelve `requireAdminRole(...)` en cada acción y pasarlo (`adminUserId`, `adminUserEmail`) a `writeAdminAuditLog`. No requiere cambio de schema (las columnas ya existen).
- **Esfuerzo:** S
- **Criterios de aceptación:** toda fila nueva de `AdminAuditLog` por cambios de orden/producto/inventario/ajustes/avisos tiene `adminUserId` y `adminUserEmail`; visible en `/admin/audit`.
- **Cómo verificar:** test que ejecuta cada acción y comprueba el actor en la fila; revisión en `/admin/audit`; `npm test`.
- **Dependencias:** ninguna. Combinar con NP-016 (vista de auditoría).

---

### NP-003 · Clientes con sesión y sin teléfono terminan con `customerPhone = "00000000"`
- **Severidad:** P2 (escala a P1 en órdenes de envío local)
- **Área:** cliente / admin / fulfillment
- **Ubicación:** [src/app/checkout/actions.ts:14](src/app/checkout/actions.ts) (rellena `"00000000"`), [src/app/checkout/page.tsx:185](src/app/checkout/page.tsx) (teléfono **readonly** para usuarios con sesión).
- **Evidencia:** para un usuario con sesión, el checkout muestra nombre/email/teléfono como solo lectura; si el teléfono del perfil está vacío muestra "Sin datos". `createGuestOrder` luego hace `formData.set("customerPhone", user.phone ?? "00000000")` para pasar la validación Zod (`min(8)`). El teléfono es opcional al registrarse ([register/actions.ts:21](src/app/auth/register/actions.ts)).
- **Por qué importa:** un cliente registrado sin teléfono **no tiene forma de ingresarlo en el checkout** (campo readonly) y la orden queda con un teléfono falso. Para envío local, el repartidor no puede contactarlo; el admin ve "00000000" en el detalle de orden y en la lista.
- **Riesgo:** entregas fallidas, retrabajo manual, mala experiencia en pedidos pagados; datos sucios en la base.
- **Solución propuesta:** si el usuario con sesión no tiene teléfono, permitir capturarlo en el checkout (campo editable que se guarda en el perfil) y exigirlo cuando el método es envío local. Nunca inyectar un teléfono placeholder.
- **Esfuerzo:** M
- **Criterios de aceptación:** un usuario con sesión sin teléfono puede ingresarlo en el checkout; el envío local exige teléfono válido; no se crea ninguna orden con `customerPhone = "00000000"`.
- **Cómo verificar:** E2E de checkout de usuario registrado sin teléfono (pickup y envío local); inspección de la orden creada; `npm run test:e2e`.
- **Dependencias:** **Confirmar con Eliezer** si el teléfono es obligatorio para envío local (regla de negocio). Relacionado con NP-019.

---

### NP-004 · El detalle de orden del admin omite notas de entrega y ubicación del cliente
- **Severidad:** P2
- **Área:** admin / fulfillment
- **Ubicación:** [src/app/admin/orders/[orderNumber]/page.tsx:135](src/app/admin/orders/%5BorderNumber%5D/page.tsx) (sección "Entrega"). Datos disponibles pero no mostrados: `order.shipment.notes` y `order.notes` (escritos en [orders.ts:179](src/lib/orders.ts)), `order.address.latitude/longitude/deliveryNotes`.
- **Evidencia:** la sección "Entrega" muestra método, estado, zona, cliente, dirección formateada y teléfono, pero **no** las notas de entrega (`shipment.notes`), ni las notas de la orden, ni las coordenadas o un enlace de mapa para el pin que el cliente marcó.
- **Por qué importa:** el cliente puede dejar instrucciones ("entregar en recepción", referencias) y marca un pin exacto, pero el admin/repartidor no los ve. La dirección formateada de envío local puede ser imprecisa sin el pin.
- **Riesgo:** entregas con información insuficiente; se pierde el valor del mapa/pin capturado en checkout.
- **Solución propuesta:** mostrar en el detalle de orden las notas de entrega, las notas de la orden y un enlace a mapa (`https://www.google.com/maps?q=lat,lng`) cuando haya coordenadas. Solo presentación; los datos ya están en la BD.
- **Esfuerzo:** S
- **Criterios de aceptación:** una orden de envío local con notas y coordenadas muestra ambas y un enlace de mapa clickeable en `/admin/orders/[orderNumber]`.
- **Cómo verificar:** crear orden local con notas/pin y revisar el detalle; revisión visual.
- **Dependencias:** ninguna.

---

### NP-005 · El rol MARKETING ve controles de producto/inventario que fallan en silencio
- **Severidad:** P2
- **Área:** admin / seguridad
- **Ubicación:** lista accesible a `["ADMIN","MARKETING"]` en [middleware.ts:33](middleware.ts) y [admin/products/page.tsx:29](src/app/admin/products/page.tsx); pero edición y mutaciones son **solo ADMIN**: [admin/products/[slug]/edit/page.tsx:37](src/app/admin/products/%5Bslug%5D/edit/page.tsx), `createAdminProduct`/`updateAdminProduct`/`updateAdminProductInventory` en [admin/products/actions.ts:41](src/app/admin/products/actions.ts); endpoints de imágenes sí permiten MARKETING.
- **Evidencia:** un usuario `MARKETING` puede abrir `/admin/products` y ve los botones "Nuevo producto", "Editar" y el formulario inline "Guardar" de stock. Al usarlos, `requireAdminRole("ADMIN")` lo **redirige en silencio** a su home (`/admin/products`) sin mensaje. En cambio, sí puede subir/borrar imágenes (los handlers permiten MARKETING).
- **Por qué importa:** la matriz de roles es contradictoria: el acceso de página y de imágenes dice "MARKETING gestiona productos", pero toda mutación de producto/inventario lo excluye y falla sin feedback. El usuario no entiende por qué "Guardar" no hace nada.
- **Riesgo:** confusión operativa, tickets de soporte, percepción de bug; ambigüedad de permisos difícil de auditar.
- **Solución propuesta:** decidir una sola postura y aplicarla de forma consistente: o (a) MARKETING gestiona productos (alinear acciones de producto/inventario a `["ADMIN","MARKETING"]`), o (b) MARKETING no gestiona productos (ocultar controles de mutación y el botón "Editar" para no-ADMIN, y limitar los endpoints de imágenes a ADMIN). En cualquier caso, mostrar "no tienes permiso" en vez de redirigir mudo.
- **Esfuerzo:** M
- **Criterios de aceptación:** la matriz de roles para productos/imágenes/inventario es consistente entre middleware, páginas, acciones y endpoints; los controles no autorizados no se muestran o devuelven un mensaje explícito.
- **Cómo verificar:** E2E de rol `MARKETING` sobre `/admin/products` (ver/editar/guardar/imagen) según la decisión; `npm run test:e2e`.
- **Dependencias:** **Requiere decisión de Eliezer** sobre los permisos de MARKETING (autorización).

---

### NP-006 · La lista de órdenes no tiene búsqueda ni paginación
- **Severidad:** P2
- **Área:** admin
- **Ubicación:** [src/app/admin/orders/page.tsx:38](src/app/admin/orders/page.tsx) (`take: 50`, único filtro por estado).
- **Evidencia:** la lista solo permite filtrar por estado y trae las últimas 50 órdenes sin paginar ni buscar. No hay búsqueda por número de orden, nombre, email o teléfono, ni filtro por fecha. (La lista de **productos** sí tiene búsqueda — [products/page.tsx:175](src/app/admin/products/page.tsx).)
- **Por qué importa:** ante un cliente que llama por su orden, el admin no puede localizarla por número/nombre; al pasar de 50 órdenes, las antiguas se vuelven inaccesibles desde la UI.
- **Riesgo:** operación lenta y frustrante; órdenes "invisibles"; mala atención al cliente.
- **Solución propuesta:** agregar búsqueda por `orderNumber`/`customerName`/`customerEmail`/`customerPhone` (patrón ya existente en productos) y paginación URL-first (reutilizar el patrón de `CatalogPagination`).
- **Esfuerzo:** M
- **Criterios de aceptación:** se puede buscar una orden por número/nombre/email y navegar páginas; los filtros se preservan en la URL.
- **Cómo verificar:** prueba manual con >50 órdenes sembradas; E2E opcional.
- **Dependencias:** ninguna.

---

### NP-007 · No hay emails de cambio de estado de orden
- **Severidad:** P2
- **Área:** emails / comunicación
- **Ubicación:** único email transaccional en [src/lib/email/transactional.ts:12](src/lib/email/transactional.ts) (`sendOrderConfirmationEmail`), disparado solo al confirmar pago en [payment-events.ts:162](src/lib/payment-events.ts). `updateOrderStatusForAdmin` no envía correo.
- **Evidencia:** cuando el admin cambia una orden a `SHIPPED`, `DELIVERED`, `CANCELLED` o `REFUNDED`, el cliente no recibe ninguna notificación. El roadmap (Fase 9) y el PRD contemplan "email de estado de orden".
- **Por qué importa:** el cliente paga y queda a ciegas sobre el avance de su pedido; aumenta la carga de soporte y reduce confianza.
- **Riesgo:** percepción de abandono post-compra; más consultas manuales por WhatsApp/teléfono.
- **Solución propuesta:** plantillas y envío para los estados clave (al menos `SHIPPED` y `DELIVERED`, idealmente `CANCELLED`/`REFUNDED`), reutilizando el patrón de `transactional.ts` + `EmailLog`. Disparar desde `updateOrderStatusForAdmin`. Sin cambios de schema.
- **Esfuerzo:** M
- **Criterios de aceptación:** cada transición notificable genera un email registrado en `EmailLog`; el contenido incluye número de orden y enlace con token; el provider `console` se usa en dev/E2E.
- **Cómo verificar:** test de plantillas + envío; cambiar estado en E2E/local y revisar `EmailLog`/consola.
- **Dependencias:** NP-002 (mismo punto de cambio de estado). Coordinar copy con negocio.

---

### NP-008 · No se notifica automáticamente cuando un producto vuelve a tener stock
- **Severidad:** P2
- **Área:** emails / inventario
- **Ubicación:** creación de avisos en [src/lib/stock-alerts.ts:48](src/lib/stock-alerts.ts); cambio de estado manual sin email en [admin/stock-alerts/actions.ts:17](src/app/admin/stock-alerts/actions.ts); reabastecimiento en [admin/products/actions.ts:171](src/app/admin/products/actions.ts).
- **Evidencia:** el cliente deja email/teléfono en "Avisarme"; se crea `StockAlertRequest` con estado `OPEN`. El admin puede cambiar el estado a `NOTIFIED` manualmente, pero **no se envía ningún correo**. Tampoco se dispara nada cuando `updateAdminProductInventory` vuelve a poner stock. El propio `learning-file.md` lista esto como pendiente ("deben disparar notificaciones cuando inventario vuelva a disponibilidad").
- **Por qué importa:** la función promete "te avisamos cuando haya disponibilidad" pero nunca cumple automáticamente; se recolectan contactos sin entregar valor ni cerrar la venta.
- **Riesgo:** ventas perdidas; promesa incumplida al cliente; lista de avisos que crece sin uso.
- **Solución propuesta:** al reabastecer (cuando un producto con avisos `OPEN` pasa a disponible), enviar email a los contactos y marcar el aviso `NOTIFIED`. Mínimo: una acción admin "Notificar disponibilidad" que envíe el correo y actualice estado de forma atómica.
- **Esfuerzo:** M
- **Criterios de aceptación:** al reabastecer un producto con avisos abiertos, los contactos reciben email (registrado en `EmailLog`) y el aviso queda `NOTIFIED`; no se duplican envíos.
- **Cómo verificar:** test del flujo reabastecer→notificar; E2E con provider `console`.
- **Dependencias:** NP-007 (infraestructura de plantillas/envío).

---

### NP-009 · El selector de mapa/pin no es operable por teclado y bloquea el envío local a usuarios de teclado/AT
- **Severidad:** P2
- **Área:** UX / accesibilidad
- **Ubicación:** [src/components/checkout/checkout-location-picker.tsx:143](src/components/checkout/checkout-location-picker.tsx) (`<div role="button" tabIndex={0} onClick=...>` sin `onKeyDown`).
- **Evidencia:** el mapa es un `div` con `role="button"` y `tabIndex={0}`, pero solo responde a `onClick` con coordenadas de ratón; no hay manejo de teclado para colocar/mover el pin. Las coordenadas (`latitude`/`longitude`) son **obligatorias** para envío local ([checkout.ts:54](src/lib/checkout.ts)). El único camino accesible es "Usar mi ubicación" (geolocalización).
- **Por qué importa:** un usuario que navega con teclado o lector de pantalla no puede fijar el punto de entrega; si la geolocalización está denegada o no disponible, **no puede completar un pedido de envío local**.
- **Riesgo:** exclusión de accesibilidad; conversión perdida en envío local; posible incumplimiento de buenas prácticas WCAG.
- **Solución propuesta:** ofrecer una ruta accesible para fijar coordenadas sin ratón (p. ej. campos de lat/lng editables, búsqueda de dirección con resultado seleccionable, o controles de teclado sobre el mapa) y asegurar foco visible. Mantener el clic como atajo.
- **Esfuerzo:** M
- **Criterios de aceptación:** se puede establecer una ubicación válida solo con teclado; el envío local se puede completar sin geolocalización del navegador; foco visible en el control.
- **Cómo verificar:** prueba manual con teclado/lector de pantalla; E2E que fije coordenadas sin `evaluate` directo.
- **Dependencias:** se cruza con la decisión de proveedor de mapas final (preproducción).

---

### NP-010 · Conviven dos sistemas de tokens visuales (inconsistencia de marca/UX)
- **Severidad:** P2
- **Área:** UX
- **Ubicación:** tokens `ca-*` en catálogo/producto/carrito/checkout (p. ej. [catalog/page.tsx](src/app/catalog/page.tsx), [cart/page.tsx](src/app/cart/page.tsx)); tokens estilo shadcn (`bg-card`, `text-primary`, `border-border`, `rounded-md`) en home, confirmación de orden, cuenta y todo el admin (p. ej. [orders/[orderNumber]/page.tsx](src/app/orders/%5BorderNumber%5D/page.tsx), [account/page.tsx](src/app/account/page.tsx)). Reparto observado ≈ 30 vs 29 archivos.
- **Evidencia:** el storefront de compra (catálogo→carrito→checkout) usa el sistema "Taller Técnico Moderno" (`ca-*`), pero la página de **confirmación de orden** y la **cuenta** —que el cliente ve justo después de comprar— usan el otro sistema y se ven con otra tipografía/espaciado/colores. El brief y `learning-file.md` piden consistencia de componentes y "base blanca consistente".
- **Por qué importa:** la ruptura visual entre el carrito/checkout (cuidado) y la confirmación/cuenta (genérica) baja la sensación de confianza justo en el momento de mayor sensibilidad (post-pago).
- **Riesgo:** percepción de producto inacabado; menor confianza; mantenimiento duplicado de estilos.
- **Solución propuesta:** unificar gradualmente hacia un solo sistema de tokens (priorizar las páginas de cara al cliente: confirmación de orden y cuenta primero). No es un rediseño grande; es alinear tokens/clases existentes.
- **Esfuerzo:** L (por extensión) — se puede fasear por pantalla (S/M cada una).
- **Criterios de aceptación:** confirmación de orden y cuenta usan el mismo sistema de tokens que el carrito/checkout; sin regresiones de responsive (smoke E2E verde).
- **Cómo verificar:** revisión visual lado a lado; `npm run test:e2e` (responsive smoke).
- **Dependencias:** ninguna técnica. No emprender rediseño visual grande sin aprobación (regla del brief).

---

### NP-011 · El carrito carga todo el catálogo en cada vista y en cada add/update
- **Severidad:** P2
- **Área:** performance
- **Ubicación:** [src/lib/cart.ts:36](src/lib/cart.ts) (`getGuestCart` llama `getCatalogProducts()`), [cart.ts:163](src/lib/cart.ts) (`findProductBySku` también), usados por add/update/remove y por la página de carrito.
- **Evidencia:** `getCatalogProducts()` ejecuta `findDbProducts()` que trae **todos** los productos activos con **todas** sus relaciones (`category`, `compatibilities`, `inventoryStocks`, `images`). El carrito solo necesita los SKUs presentes. `React.cache` deduplica dentro de un mismo render, pero cada `addCartItem`/`updateCartItem` es un request nuevo. (El contador del header sí usa la versión barata `getGuestCartItemCount`, que solo lee la cookie.)
- **Por qué importa:** es el mismo antipatrón que ya se corrigió en `/api/search` (H-014), pero persiste en el carrito. Con catálogo creciente, cada agregar/ver carrito carga toda la tabla y sus relaciones.
- **Riesgo:** latencia y consumo crecientes en una ruta de alta frecuencia (cada add-to-cart); peor en serverless.
- **Solución propuesta:** consultar solo los productos cuyos SKUs están en el carrito (`where: { sku: { in: [...] } }`) con `select` mínimo, en lugar de cargar el catálogo completo.
- **Esfuerzo:** M
- **Criterios de aceptación:** ver/modificar el carrito consulta solo los SKUs del carrito; resultados equivalentes en los tests existentes de carrito.
- **Cómo verificar:** `npm test` (tests de `cart-state`/carrito); revisión de queries; opcional `EXPLAIN`.
- **Dependencias:** ninguna.

---

### NP-012 · El ajuste manual de inventario ignora `quantityReserved`
- **Severidad:** P2
- **Área:** inventario
- **Ubicación:** [src/app/admin/products/actions.ts:171](src/app/admin/products/actions.ts) (`updateAdminProductInventory` → `upsertInventoryStock`), normalización en [src/lib/admin-products.ts](src/lib/admin-products.ts) (`normalizeAdminInventoryStatus`).
- **Evidencia:** el formulario rápido de stock fija `quantityOnHand` a un valor absoluto y deja `quantityReserved` intacto; el estado se normaliza solo desde `quantityOnHand`. No hay validación de que `quantityOnHand >= quantityReserved`. La disponibilidad mostrada al cliente es `max(onHand - reserved, 0)` ([products.ts:410](src/data/products.ts)).
- **Por qué importa:** si hay reservas activas (órdenes en `PAYMENT_PROCESSING`) y el admin baja `quantityOnHand` por debajo de lo reservado, la disponibilidad efectiva queda negativa (se clampa a 0) y el estado puede quedar inconsistente con las reservas, sin ninguna advertencia.
- **Riesgo:** estados de inventario inconsistentes; posible sobre/sub-disponibilidad confusa para el admin; difícil de diagnosticar.
- **Solución propuesta:** mostrar `quantityReserved` en el formulario y validar/advertir cuando el nuevo `quantityOnHand` quede por debajo de lo reservado; calcular el estado a partir de la disponibilidad (`onHand - reserved`).
- **Esfuerzo:** S
- **Criterios de aceptación:** el admin ve las unidades reservadas; fijar `onHand < reserved` se bloquea o advierte; el estado refleja la disponibilidad real.
- **Cómo verificar:** test con stock reservado; prueba manual con una orden en proceso.
- **Dependencias:** **toca reglas de inventario → requiere aprobación de Eliezer** (regla del brief). No cambia el descuento atómico, solo el ajuste manual.

---

### NP-013 · Las zonas de entrega creadas por el admin no validan coordenadas (cobertura desactivada en silencio)
- **Severidad:** P2
- **Área:** inventario / fulfillment
- **Ubicación:** [src/lib/fulfillment.ts:163](src/lib/fulfillment.ts) (`isCoordinateInsideDeliveryZone` → `if (!bounds) return true;`), bounds fijos solo para `san-salvador`/`santa-tecla` en [fulfillment.ts:199](src/lib/fulfillment.ts); creación de zonas en [admin/settings/actions.ts:78](src/app/admin/settings/actions.ts).
- **Evidencia:** la validación de que el pin caiga dentro de la zona usa un mapa de rangos codificado solo para dos slugs. Para cualquier zona con otro slug (las que crea el admin en `/admin/settings`), no hay bounds y la función **acepta cualquier coordenada**.
- **Por qué importa:** apenas el admin agrega una zona nueva, la validación de cobertura por pin deja de aplicar para esa zona; un cliente podría fijar un pin fuera del área y el sistema lo aceptaría. (El `learning-file.md` ya anticipa que "la validación de mapa empieza con rangos por zona y debe evolucionar a polígonos/proveedor final".)
- **Riesgo:** pedidos de envío local fuera de cobertura aceptados; el control de cobertura es parcial y no evidente para el admin.
- **Solución propuesta (interina, sin schema):** documentar y hacer explícito que sin bounds no hay validación; idealmente permitir definir bounds/polígono por zona. La solución completa (polígonos por zona) implica **cambio de schema → requiere aprobación**.
- **Esfuerzo:** M (interino S; completo L)
- **Criterios de aceptación:** o bien las zonas nuevas exigen definir un área y se validan, o el comportamiento "sin bounds = sin validación" queda documentado y advertido en el admin.
- **Cómo verificar:** test de `isCoordinateInsideDeliveryZone` con una zona sin bounds; revisión del flujo de creación de zona.
- **Dependencias:** la versión con bounds/polígono por zona **requiere aprobación de Eliezer** (schema Prisma). Se cruza con NP-009 y el proveedor de mapas final.

---

### NP-014 · El email de recuperación de contraseña no pasa por la capa transaccional ni se registra
- **Severidad:** P3
- **Área:** emails
- **Ubicación:** [src/app/auth/forgot-password/actions.ts:52](src/app/auth/forgot-password/actions.ts) (construye y envía el email inline con `provider.sendEmail`), vs. [src/lib/email/transactional.ts](src/lib/email/transactional.ts) (que sí registra en `EmailLog` y redacta tokens).
- **Evidencia:** el email de reset se arma y envía directamente en la acción, sin pasar por `transactional.ts`, por lo que **no se registra en `EmailLog`** (no hay rastro de entrega/fallo) y no usa el wrapper de redacción. Además construye el enlace con `NEXTAUTH_URL`, mientras los emails de orden usan `NEXT_PUBLIC_SITE_URL`/`APP_URL` ([templates.ts:42](src/lib/email/templates.ts)).
- **Por qué importa:** inconsistencia operativa: no se puede auditar si el reset salió; riesgo de enlaces con base URL distinta si solo una variable está configurada en producción.
- **Riesgo:** soporte a ciegas ante "no me llegó el correo"; enlaces de reset potencialmente mal formados según el entorno.
- **Solución propuesta:** mover el envío de reset a `transactional.ts` (registrar en `EmailLog`, redactar token en el log) y unificar la base URL con `buildAbsoluteAppUrl`.
- **Esfuerzo:** S
- **Criterios de aceptación:** el reset se registra en `EmailLog`; el enlace usa la misma base URL que los demás emails; token redactado en el log.
- **Cómo verificar:** test de la acción; revisión de `EmailLog` tras un reset en dev.
- **Dependencias:** ninguna.

---

### NP-015 · El email de confirmación de orden es mínimo (sin ítems ni datos de entrega)
- **Severidad:** P3
- **Área:** emails / UX
- **Ubicación:** [src/lib/email/templates.ts:13](src/lib/email/templates.ts) (`buildOrderConfirmationEmail`).
- **Evidencia:** el correo incluye nombre, número de orden, total y un enlace. No lista los productos comprados, ni el método de entrega, ni instrucciones de retiro/dirección. El PRD pide "confirmación de orden y comprobante".
- **Por qué importa:** un comprobante sin detalle de compra ni instrucciones (p. ej. "presenta tu número de orden en bodega", horarios) es poco útil y resta confianza.
- **Riesgo:** más consultas post-compra; comprobante percibido como incompleto.
- **Solución propuesta:** enriquecer la plantilla con líneas de producto, método de entrega y, para retiro, dirección/horario/instrucciones de bodega (datos ya disponibles).
- **Esfuerzo:** S
- **Criterios de aceptación:** el email incluye ítems, total, método de entrega y datos de retiro cuando aplica; tests de plantilla actualizados.
- **Cómo verificar:** `npm test` (`templates.test.ts`); revisión del HTML/texto generado.
- **Dependencias:** coordinar copy con negocio.

---

### NP-016 · La vista de auditoría no tiene filtros, búsqueda ni paginación
- **Severidad:** P3
- **Área:** admin / docs
- **Ubicación:** [src/app/admin/audit/page.tsx:16](src/app/admin/audit/page.tsx) (`take: 100`, sin filtros).
- **Evidencia:** la página muestra los últimos 100 eventos sin filtro por acción/entidad/fecha ni búsqueda ni paginación.
- **Por qué importa:** con uso real el historial supera 100 eventos y se vuelve imposible localizar quién/qué/cuándo de un caso puntual (sobre todo una vez resuelto NP-002 y haya actor que filtrar).
- **Riesgo:** auditoría poco usable para investigar incidentes.
- **Solución propuesta:** filtros por `entityType`/`action`/rango de fecha/actor y paginación URL-first.
- **Esfuerzo:** M
- **Criterios de aceptación:** se puede filtrar por entidad/acción/fecha y paginar.
- **Cómo verificar:** prueba manual con muchos eventos sembrados.
- **Dependencias:** NP-002 (para filtrar por actor).

---

### NP-017 · La creación/edición de usuarios admin no es atómica con su auditoría
- **Severidad:** P3
- **Área:** admin
- **Ubicación:** [src/app/admin/users/actions.ts:49](src/app/admin/users/actions.ts) (crea el usuario y luego abre **otra** `db.$transaction` solo para el audit log; igual en update, línea 95-111).
- **Evidencia:** a diferencia de productos/órdenes/ajustes (que hacen mutación + auditoría en la misma transacción), las acciones de usuario ejecutan la mutación fuera de la transacción de auditoría. Si el audit log falla, el usuario igual quedó creado/modificado sin registro.
- **Por qué importa:** rompe la garantía "todo cambio admin queda auditado" justo en la gestión de usuarios, que es sensible.
- **Riesgo:** cambios de usuario sin rastro ante un fallo parcial.
- **Solución propuesta:** ejecutar la mutación y el `writeAdminAuditLog` dentro de la misma transacción (mover `createAdminUser`/`updateAdminUser` a recibir el `tx`).
- **Esfuerzo:** S
- **Criterios de aceptación:** crear/editar usuario y su auditoría ocurren atómicamente; si falla la auditoría, no persiste el cambio.
- **Cómo verificar:** test simulando fallo de auditoría; `npm test`.
- **Dependencias:** combinar con NP-002.

---

### NP-018 · CI no ejecuta `npm audit` (sin puerta de vulnerabilidades de dependencias)
- **Severidad:** P3
- **Área:** QA / CI
- **Ubicación:** [.github/workflows/ci.yml](.github/workflows/ci.yml) (job `quality`: install, prisma, seed, lint, typecheck, test, build — sin `npm audit`).
- **Evidencia:** `docs/learning-file.md` lista `npm audit` como verificación habitual antes de cerrar cambios, pero el CI no lo corre, así que no hay puerta automática ante una dependencia vulnerable nueva.
- **Por qué importa:** las vulnerabilidades de dependencias se cuelan sin alerta entre auditorías manuales.
- **Riesgo:** dependencia vulnerable mergeada sin detección.
- **Solución propuesta:** añadir un paso `npm audit --omit=dev --audit-level=high` (no bloqueante al inicio si se prefiere, luego bloqueante) en el job `quality`.
- **Esfuerzo:** S
- **Criterios de aceptación:** CI ejecuta `npm audit` y reporta hallazgos de severidad alta.
- **Cómo verificar:** correr el workflow en un PR.
- **Dependencias:** ninguna.

---

### NP-019 · Faltan E2E de flujos críticos: checkout de usuario registrado y transiciones de orden por admin
- **Severidad:** P3
- **Área:** QA
- **Ubicación:** [tests/e2e/catalog-cart.spec.ts](tests/e2e/catalog-cart.spec.ts) (todo el checkout es **guest**); [tests/e2e/admin.spec.ts](tests/e2e/admin.spec.ts) (autorización por rol y avisos de stock, según docs).
- **Evidencia:** los E2E de checkout cubren guest pickup y guest envío local (con aserciones de stock reserva→confirma), pero **no** el checkout de usuario con sesión (donde vive el bug NP-003 del teléfono), ni el cambio de estado de orden por admin con restauración de stock (`PAID_PENDING_SHIPMENT → CANCELLED`), ni el caso "stock insuficiente a mitad de checkout". La interacción real del mapa tampoco se prueba (las coordenadas se inyectan vía `evaluate`).
- **Por qué importa:** los caminos no cubiertos incluyen justo donde aparecen hallazgos (teléfono placeholder, restauración de stock, cobertura).
- **Riesgo:** regresiones silenciosas en flujos de alto valor.
- **Solución propuesta:** agregar E2E de: (a) checkout de usuario registrado (pickup y envío local), (b) transición admin con restauración de stock, (c) stock insuficiente al confirmar.
- **Esfuerzo:** M
- **Criterios de aceptación:** existen y pasan los E2E nuevos; fallan si se rompe la restauración de stock o si reaparece el teléfono placeholder.
- **Cómo verificar:** `npm run test:e2e`.
- **Dependencias:** se apoya en NP-003 (teléfono) y NP-002.

---

### NP-020 · "Agregar al carrito" fuerza navegación a `/cart` sin opción de seguir comprando
- **Severidad:** P3
- **Área:** cliente / UX
- **Ubicación:** [src/app/cart/actions.ts:15](src/app/cart/actions.ts) (`addCartItem` siempre `redirect("/cart?estado=...")`), usado desde el detalle de producto ([product/[slug]/page.tsx:144](src/app/product/%5Bslug%5D/page.tsx)).
- **Evidencia:** cada vez que el cliente agrega un producto (incluso desde la ficha de producto), se le redirige a `/cart`, perdiendo el contexto de navegación. No hay feedback inline (toast/mini-carrito) ni botón "seguir comprando" en el momento de agregar.
- **Por qué importa:** interrumpe el descubrimiento y agrega fricción a comprar varios artículos; en retail moderno (referencia del propio proyecto) lo común es confirmar sin sacar al usuario de donde está.
- **Riesgo:** menor tamaño de carrito/ conversión; navegación más tediosa en mobile.
- **Solución propuesta:** confirmar el agregado con feedback no disruptivo (toast o actualización del contador) y permitir continuar en la página actual, dejando "ir al carrito" como opción.
- **Esfuerzo:** M
- **Criterios de aceptación:** agregar desde la ficha de producto no fuerza navegación; hay confirmación visible y el contador del carrito se actualiza.
- **Cómo verificar:** prueba manual en producto/catálogo; ajustar E2E que hoy asume el redirect a `/cart`.
- **Dependencias:** ninguna. (Es UX; evitar rediseño grande sin aprobación.)

---

## Lo que sí está bien hecho

Para que QA tenga calibrado que el núcleo es confiable:

- **Ciclo de inventario atómico y correcto:** `reserveInventory` / `confirmInventoryReservation` / `releaseInventoryReservation` usan `updateMany` condicional con verificación de `count === 1` y ordenan por `stockId`/`productId` para evitar deadlocks ([inventory-reservations.ts](src/lib/inventory-reservations.ts)). La disponibilidad pública resta lo reservado ([products.ts:410](src/data/products.ts)).
- **Flujo mock no confunde ni rompe QA:** la pantalla de pago simulado está rotulada "Entorno de desarrollo / Simulación de pago", solo aparece si `isMockPaymentAvailable()` (bloqueado en producción), valida el `returnTo` contra el origen y `/orders/`, y el procesamiento del evento es **idempotente** ([mock/actions.ts](src/app/payments/mock/%5BexternalPaymentId%5D/actions.ts), [mock-access.ts](src/lib/payments/mock-access.ts), [payment-events.ts](src/lib/payment-events.ts)).
- **Defensa en profundidad en admin:** middleware Edge por ruta/rol **y** `requireAdminRole()` en cada página/acción, con revalidación de `isActive`/rol contra BD en cada request ([admin-auth.ts:96](src/lib/admin-auth.ts), [middleware.ts](middleware.ts)).
- **Endpoints de imágenes endurecidos:** verifican rol (`ADMIN`/`MARKETING`), validan MIME + magic bytes + `productId` (cuid), y auditan subida/borrado (cierran H-001/H-018/H-019).
- **Precios recalculados en el servidor** dentro de la transacción de checkout; el cliente no puede manipular montos ([orders.ts:122](src/lib/orders.ts)).
- **Carrito guest firmado (HMAC)** con fallback sin firma solo fuera de producción y normalización de SKU/cantidad ([cart-state.ts](src/lib/cart-state.ts), [cart.ts](src/lib/cart.ts)).
- **IVA consistente:** `Order.taxCents = Σ IVA por línea + IVA del envío`, sin recalcular desde el total (cierra H-012) ([checkout.ts:98](src/lib/checkout.ts)).
- **Máquina de estados de orden declarativa** con transiciones explícitas, estados terminales y restauración de stock solo desde `PAID_PENDING_SHIPMENT` ([admin-orders.ts](src/lib/admin-orders.ts)).
- **SEO base correcto:** rutas privadas (`/cart`, `/checkout`, `/orders`, `/account`, `/admin`, `/auth`, `/api`) en `disallow` de robots y con `robots: noindex`; sitemap dinámico con productos; metadata por catálogo/producto ([robots.ts](src/app/robots.ts), [sitemap.ts](src/app/sitemap.ts), [layout.tsx](src/app/layout.tsx)). `/ayuda` existe y está en el sitemap.
- **forgot-password no enumera** (siempre responde igual) y tiene rate limit por IP **y** por email objetivo ([forgot-password/actions.ts](src/app/auth/forgot-password/actions.ts)).
- **Emails con log y redacción de tokens** para el flujo de confirmación ([transactional.ts](src/lib/email/transactional.ts)).
- **CI con `quality` + `e2e`** (lint, typecheck, unit, build, Playwright con schema PostgreSQL aislado por corrida) y E2E de checkout con aserciones de inventario.

---

## Lo que no pude verificar sin adivinar

Estos puntos dependen de paneles externos o de datos/entorno reales; se reflejan como verificación manual, no como hallazgos de código (ver también `docs/production-operations-checklist.md`):

- **Configuración de Vercel:** separación de variables `production`/`preview`/`development`, y si `DATABASE_URL` apunta a un pooler en producción (no hay `vercel.json` en el repo).
- **Rate limiting distribuido en producción:** los limiters en memoria (p. ej. el de avisos de stock en [cart/actions.ts:9](src/app/cart/actions.ts)) **no funcionan entre instancias serverless**; no pude confirmar si `UPSTASH_*` está configurado en producción para los limiters que sí soportan Redis.
- **Entregabilidad de email:** SPF/DKIM/DMARC del dominio y que los correos no caigan en spam (se configura en Resend/DNS, fuera del repo).
- **R2 / Cloudflare:** permiso mínimo del token, listado de objetos deshabilitado y dominio propio vs `r2.dev`.
- **Performance real de consultas:** no ejecuté `EXPLAIN ANALYZE` con inventario real ni medí el catálogo bajo carga (la Fase 5 lo deja como pendiente con datos reales).
- **CSP en navegador real:** está en `Report-Only`; no pude observar violaciones reales en un navegador con consola abierta en cada pantalla.
- **Mapa/pin en dispositivos reales:** la geolocalización, el reverse-geocoding de Nominatim (que tiene política de uso/ToS para producción) y la experiencia táctil no se pueden validar en una lectura estática.
- **Recuperación de NP-001:** no confirmé si el seed re-crea/re-activa un `ADMIN` en producción como vía de recuperación ante un bloqueo total.
- **Branch ruleset de `main`:** el repo trae el workflow, pero la activación del ruleset que exige `quality`+`e2e` antes de merge es manual en GitHub y no es verificable desde el código.

---

## Matriz de riesgo por área

| Área | Hallazgos | Severidad máx. | Riesgo residual (sin corregir) |
|---|---|---|---|
| Cliente / checkout | NP-003, NP-020 | P2 | Pedidos de envío local sin teléfono usable; fricción de compra. |
| Admin / operación | NP-001, NP-002, NP-004, NP-005, NP-006, NP-016, NP-017 | **P1** | Bloqueo de admin, auditoría sin actor, fulfillment con datos incompletos, permisos confusos. |
| Inventario / fulfillment | NP-012, NP-013 | P2 | Estados de stock inconsistentes; cobertura por pin desactivada en zonas nuevas. |
| Emails / comunicación | NP-007, NP-008, NP-014, NP-015 | P2 | Cliente sin seguimiento post-compra; avisos de stock que no avisan. |
| UX / accesibilidad | NP-009, NP-010 | P2 | Envío local inaccesible por teclado; inconsistencia visual post-compra. |
| Performance | NP-011 | P2 | Degradación del carrito al crecer el catálogo. |
| QA / CI | NP-018, NP-019 | P3 | Regresiones en flujos no cubiertos; dependencias vulnerables sin puerta. |
| Seguridad (no-dinero) | NP-001, NP-002, NP-005 | **P1** | Bloqueo/recuperación de acceso; trazabilidad incompleta; ambigüedad de permisos. |

> **Pagos / DTE:** fuera de alcance (congelados). Los bloqueantes conocidos (webhook Wompi como fuente de verdad, DTE real, conciliación, pooling de BD en producción) siguen pendientes de preproducción según `docs/auditoria.md` y `docs/production-operations-checklist.md`.

---

## Recomendaciones de prueba manual (para QA)

Flujos sugeridos para validar a mano, priorizando los hallazgos:

1. **Usuario registrado sin teléfono (NP-003):** crea cuenta sin teléfono → agrega producto → checkout con **envío local** → confirma. Revisa la orden en `/admin/orders/[n]`: ¿el teléfono es real o "00000000"? ¿pudiste ingresarlo?
2. **Bloqueo de admin (NP-001):** con dos usuarios `ADMIN`, intenta desactivar a uno (debe poder) y luego al último (debe bloquearse). Intenta auto-desactivarte. **Hazlo en un entorno desechable.**
3. **Actor de auditoría (NP-002):** cambia el estado de una orden, ajusta inventario y edita un producto con distintos usuarios; revisa en `/admin/audit` si aparece **quién** hizo cada cambio.
4. **Permisos de MARKETING (NP-005):** entra como `MARKETING` a `/admin/products`, intenta "Editar", "Guardar" stock y subir una imagen. Anota cuáles funcionan y cuáles te sacan sin mensaje.
5. **Fulfillment local (NP-004):** crea una orden de envío local con notas de entrega y pin; revisa si el admin ve notas, coordenadas o enlace de mapa.
6. **Comunicación post-compra (NP-007/NP-008):** completa una compra mock y cambia estados (enviado/entregado); revisa la consola/`EmailLog` para ver qué emails salen. Deja un "Avísame" de stock y reabastece el producto: ¿llega aviso?
7. **Accesibilidad del mapa (NP-009):** en checkout de envío local, intenta fijar la ubicación **solo con teclado** y con geolocalización denegada. ¿Puedes completar el pedido?
8. **Consistencia visual (NP-010):** compra y compara visualmente carrito/checkout vs. la página de confirmación de orden y `/account`. ¿Se ven del mismo "producto"?
9. **Búsqueda de órdenes (NP-006):** con varias órdenes, intenta encontrar una por número y por nombre de cliente desde `/admin/orders`.
10. **Responsive y estados vacíos:** repite catálogo/carrito/checkout en mobile y tablet; fuerza carrito vacío, sin resultados de filtro y producto sin stock.

> Apóyate en `docs/qa-checklists.md` por pantalla y registra evidencia (capturas/IDs de orden) en el PR correspondiente.
