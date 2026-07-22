# Plan de trabajo — MVP sin pagos reales (Castillo Auto Parts)

> Derivado de [docs/non-payment-mvp-audit.md](non-payment-mvp-audit.md). Organizado en fases A–F. **No incluye pagos reales** (Wompi, webhook, conciliación, reembolsos, DTE): esos siguen congelados hasta el gate de preproducción.
> **Fecha:** 2026-06-24.
> Cada tarea indica: **hallazgos relacionados, objetivo, archivos probables, criterios de aceptación, cómo verificar, dependencias, riesgo, modelo de IA recomendado y si requiere aprobación de Eliezer.**

## Cómo leer este plan (para QA)

- **Orden sugerido:** Fase A (quick wins seguros) → Fase B/C/D en paralelo según prioridad de negocio → Fase E (calidad de experiencia) → Fase F (QA/CI/docs como red de seguridad). Las dependencias explícitas mandan sobre el orden de fase.
- **"Modelo recomendado"** sigue la misma regla del plan original (`docs/plan-de-trabajo.md`): **autorización transversal, reglas de inventario o decisiones de seguridad → Fable 5 / Opus 4.8**; **trabajo bien definido → Sonnet 4.6**; **mecánico/copy/config → Haiku 4.5**.
- **"Cómo verificar"** siempre incluye las puertas existentes: `npm run lint && npm run typecheck && npm test && npm run test:e2e`.
- **Regla de aprobación (del brief):** requieren visto bueno previo de Eliezer los cambios de schema Prisma, autorización transversal, reglas de inventario atómico, nuevas dependencias y cualquier cosa de pagos reales. Esas tareas están marcadas **Aprobación: Sí**.
- **No** abrir tareas de pagos/DTE en este plan. Si una mejora "toca" pagos, se documenta como pendiente de preproducción, no se implementa.

## Decisiones confirmadas por el Product Owner (2026-06-24)

Eliezer confirmó estas reglas; las tareas afectadas ya las reflejan:

1. **Teléfono obligatorio en envío local** (NPW-B1): ninguna orden de envío local se crea sin teléfono válido; el usuario con sesión puede capturarlo en el checkout.
2. **La auditoría siempre registra al actor** (NPW-A1): todo cambio admin guarda `adminUserId`/`adminUserEmail`.
3. **Solo ADMIN gestiona el catálogo** (NPW-C2): se retira `MARKETING` de productos, inventario e imágenes.
4. **Bloquear existencias por debajo de lo reservado** (NPW-C6): no se permite dejar `quantityOnHand` por debajo de `quantityReserved`.
5. **Cobertura de zonas: mitigación documentada ahora** (NPW-C7); los límites/polígonos por zona (cambio de schema) quedan para preproducción.
6. **Bloquear auto-desactivación y último ADMIN** (NPW-C1).

Único pendiente de confirmar: **NPW-E3** (asumido como unificación de tokens, no rediseño).

---

## Fase A — Quick wins seguros (alto impacto, bajo riesgo, sin aprobación)

### NPW-A1 · Registrar el actor admin en toda la auditoría
- **Hallazgos:** NP-002 (P1).
- **Objetivo:** que cada `AdminAuditLog` de órdenes, productos, inventario, ajustes y avisos de stock guarde `adminUserId`/`adminUserEmail`.
- **Archivos probables:** `src/app/admin/orders/[orderNumber]/actions.ts`, `src/app/admin/products/actions.ts`, `src/app/admin/settings/actions.ts`, `src/app/admin/stock-alerts/actions.ts` (capturar el retorno de `requireAdminRole(...)` y pasarlo a `writeAdminAuditLog`). Sin cambios en `src/lib/admin-audit.ts` ni schema (columnas ya existen).
- **Criterios de aceptación:** toda fila nueva de auditoría por estas acciones incluye actor; visible en `/admin/audit`.
- **Cómo verificar:** test por acción que valida `adminUserId`/`adminUserEmail`; `npm test`; revisión en `/admin/audit`.
- **Dependencias:** ninguna. Habilita NPW-C5 (filtro por actor).
- **Riesgo:** bajo (solo agrega datos a un registro existente).
- **Modelo recomendado:** **Sonnet 4.6** — repetitivo pero toca varias acciones; criterio claro.
- **Aprobación:** No.

### NPW-A2 · Mostrar notas de entrega y ubicación en el detalle de orden admin
- **Hallazgos:** NP-004 (P2).
- **Objetivo:** que el admin/repartidor vea notas de entrega, notas de orden y un enlace a mapa cuando haya coordenadas.
- **Archivos probables:** `src/app/admin/orders/[orderNumber]/page.tsx` (sección "Entrega"); reutilizar `buildGoogleMapsEmbedUrl`/un `maps?q=lat,lng` de `src/lib/fulfillment.ts`.
- **Criterios de aceptación:** una orden de envío local con notas y pin muestra ambas y un enlace de mapa clickeable.
- **Cómo verificar:** crear orden local con notas/coordenadas y revisar el detalle; revisión visual.
- **Dependencias:** ninguna (datos ya persistidos en `Order`/`Shipment`/`Address`).
- **Riesgo:** bajo (solo presentación).
- **Modelo recomendado:** **Haiku 4.5** — render de datos ya disponibles.
- **Aprobación:** No.

### NPW-A3 · Unificar el email de reset por la capa transaccional
- **Hallazgos:** NP-014 (P3).
- **Objetivo:** enviar el correo de recuperación vía `transactional.ts` (registro en `EmailLog`, redacción de token) y unificar la base URL con `buildAbsoluteAppUrl`.
- **Archivos probables:** `src/lib/email/transactional.ts` (nueva función `sendPasswordResetEmail`), `src/lib/email/templates.ts` (plantilla), `src/app/auth/forgot-password/actions.ts` (usar la función).
- **Criterios de aceptación:** el reset queda registrado en `EmailLog`; el enlace usa la misma base URL que los demás emails; token redactado en el log; el flujo sigue sin revelar si el email existe.
- **Cómo verificar:** test de la nueva función/plantilla; revisión de `EmailLog` tras reset en dev; `npm test`.
- **Dependencias:** ninguna.
- **Riesgo:** bajo (no cambia la lógica de tokens, solo el canal de envío/registro).
- **Modelo recomendado:** **Haiku 4.5** — mover a un patrón existente.
- **Aprobación:** No.

---

## Fase B — Flujo cliente y conversión

### NPW-B1 · Capturar teléfono en checkout para usuarios con sesión (eliminar el placeholder)
- **Hallazgos:** NP-003 (P2, P1 en envío local).
- **Objetivo:** permitir que un usuario con sesión sin teléfono lo ingrese en el checkout (y se guarde en su perfil); exigirlo para envío local; nunca inyectar `"00000000"`.
- **Archivos probables:** `src/app/checkout/page.tsx` (campo editable cuando el perfil no tiene teléfono), `src/app/checkout/actions.ts` (no rellenar placeholder; persistir el teléfono ingresado), `src/lib/checkout.ts` (validación), posible uso de `src/app/account/actions.ts`.
- **Criterios de aceptación:** un usuario con sesión sin teléfono puede ingresarlo; el envío local exige teléfono válido; **ninguna** orden se crea con `customerPhone = "00000000"`.
- **Cómo verificar:** E2E de checkout de usuario registrado sin teléfono (pickup y envío local); inspección de la orden; `npm run test:e2e`.
- **Dependencias:** ninguna pendiente. Relacionada con NPW-F2 (E2E).
- **Riesgo:** medio (toca validación de checkout; cuidar que no rompa el flujo guest).
- **Modelo recomendado:** **Sonnet 4.6** — lógica de formulario/validación acotada.
- **Aprobación:** ✅ Confirmado (PO 2026-06-24) — teléfono **obligatorio** para envío local; el usuario con sesión lo captura en el checkout.

### NPW-B2 · Confirmación de "agregado al carrito" sin sacar al cliente de la página
- **Hallazgos:** NP-020 (P3).
- **Objetivo:** dar feedback no disruptivo al agregar (toast/mini-carrito o actualización de contador) y permitir seguir comprando, dejando "ir al carrito" como opción.
- **Archivos probables:** `src/app/cart/actions.ts` (`addCartItem` deja de forzar `redirect("/cart")`), `src/app/product/[slug]/page.tsx`, `src/components/site-header.tsx` (contador), posible nuevo componente de feedback.
- **Criterios de aceptación:** agregar desde la ficha de producto no fuerza navegación; hay confirmación visible y el contador del carrito se actualiza.
- **Cómo verificar:** prueba manual en producto/catálogo; **actualizar** el E2E `catalog-cart.spec.ts` que hoy asume `redirect` a `/cart`.
- **Dependencias:** coordinar con NPW-F2 (ajuste de E2E existente).
- **Riesgo:** medio (cambia un patrón usado por E2E; evitar rediseño visual grande).
- **Modelo recomendado:** **Sonnet 4.6** — UX con Server Action + estado de cliente.
- **Aprobación:** No (no es rediseño grande; si crece de alcance, confirmar).

---

## Fase C — Admin operativo e inventario

### NPW-C1 · Proteger contra auto-bloqueo y bloqueo del último ADMIN
- **Hallazgos:** NP-001 (P1).
- **Objetivo:** impedir que un `ADMIN` se desactive/degrade a sí mismo o desactive/degrade al último `ADMIN` activo.
- **Archivos probables:** `src/app/admin/users/actions.ts` (`updateAdminUserAction`), `src/lib/admin-user.ts` (`updateAdminUser`, contar `ADMIN` activos).
- **Criterios de aceptación:** desactivar/degradar al último `ADMIN` activo falla con mensaje claro y no muta nada; un `ADMIN` no puede auto-desactivarse ni quitarse el rol `ADMIN`; con dos `ADMIN` sí se puede desactivar a uno.
- **Cómo verificar:** test de integración con uno y dos `ADMIN`; prueba manual en `/admin/users` (entorno desechable); `npm test`.
- **Dependencias:** ninguna técnica.
- **Riesgo:** alto si se hace mal (un error abre o cierra el acceso de todos) → cobertura con tests obligatoria.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — lógica de autorización con impacto de bloqueo total.
- **Aprobación:** ✅ Confirmado (PO 2026-06-24) — bloquear auto-desactivación/auto-degradación y bloquear desactivar/degradar al último ADMIN activo.

### NPW-C2 · Catálogo solo para ADMIN (retirar MARKETING de productos e imágenes)
- **Hallazgos:** NP-005 (P2).
- **Decisión PO (2026-06-24):** en el MVP **solo `ADMIN`** gestiona productos, inventario e imágenes. Se retira `MARKETING` de esas superficies.
- **Objetivo:** matriz consistente — `/admin/products` y los endpoints de imágenes pasan a `ADMIN` únicamente; ningún control queda visible para roles que no pueden usarlo.
- **Archivos probables:** `middleware.ts` (quitar `MARKETING` del prefijo `/admin/products`), `src/app/admin/products/page.tsx` y `[slug]/edit/page.tsx` (`requireAdminRole("ADMIN")`), `src/app/admin/products/actions.ts` (ya es ADMIN), `src/app/api/admin/{upload,delete}-image/route.ts` (`getAdminUserForHandler("ADMIN")`), `src/components/admin/admin-nav.tsx` (no mostrar "Productos" a MARKETING).
- **Criterios de aceptación:** `MARKETING` no ve ni accede a productos/inventario/imágenes (ni en nav, ni en página, ni en endpoint → 403); `ADMIN` mantiene todo; no quedan controles que fallen en silencio.
- **Cómo verificar:** E2E de rol `MARKETING` (denegado en `/admin/products` y en upload/delete de imagen → 403) y `ADMIN` (permitido); `npm run test:e2e`.
- **Dependencias:** ninguna pendiente.
- **Riesgo:** medio (autorización transversal); cubrir con E2E de roles.
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — cambio de autorización en varias capas.
- **Aprobación:** ✅ Confirmado (PO 2026-06-24) — solo ADMIN gestiona catálogo.

### NPW-C3 · Búsqueda y paginación en la lista de órdenes
- **Hallazgos:** NP-006 (P2).
- **Objetivo:** buscar por número/nombre/email/teléfono y paginar la lista de órdenes.
- **Archivos probables:** `src/app/admin/orders/page.tsx` (filtro de búsqueda + paginación), reutilizar patrón de `src/components/catalog-pagination.tsx` y el `where` de búsqueda de productos.
- **Criterios de aceptación:** se localiza una orden por número/nombre/email; se navega por páginas; filtros preservados en la URL.
- **Cómo verificar:** prueba manual con >50 órdenes sembradas; E2E opcional.
- **Dependencias:** ninguna.
- **Riesgo:** bajo.
- **Modelo recomendado:** **Sonnet 4.6** — patrón ya existente en el repo.
- **Aprobación:** No.

### NPW-C4 · Hacer atómica la auditoría en creación/edición de usuarios admin
- **Hallazgos:** NP-017 (P3).
- **Objetivo:** mutación de usuario + auditoría en la misma transacción.
- **Archivos probables:** `src/app/admin/users/actions.ts`, `src/lib/admin-user.ts` (recibir `tx`).
- **Criterios de aceptación:** crear/editar usuario y su auditoría ocurren atómicamente; si falla la auditoría, no persiste el cambio.
- **Cómo verificar:** test que simula fallo de auditoría; `npm test`.
- **Dependencias:** combinar con NPW-A1 (mismo patrón de actor).
- **Riesgo:** bajo.
- **Modelo recomendado:** **Sonnet 4.6**.
- **Aprobación:** No.

### NPW-C5 · Filtros y paginación en la vista de auditoría
- **Hallazgos:** NP-016 (P3).
- **Objetivo:** filtrar por entidad/acción/fecha/actor y paginar.
- **Archivos probables:** `src/app/admin/audit/page.tsx`.
- **Criterios de aceptación:** se filtra por `entityType`/`action`/rango de fecha/actor y se pagina.
- **Cómo verificar:** prueba manual con muchos eventos sembrados.
- **Dependencias:** NPW-A1 (actor disponible para filtrar).
- **Riesgo:** bajo.
- **Modelo recomendado:** **Sonnet 4.6**.
- **Aprobación:** No.

### NPW-C6 · Ajuste de inventario consciente de unidades reservadas
- **Hallazgos:** NP-012 (P2).
- **Decisión PO (2026-06-24):** **bloquear** el cambio cuando el nuevo `quantityOnHand` quede por debajo de lo reservado (no solo advertir).
- **Objetivo:** mostrar `quantityReserved` y **bloquear** que `quantityOnHand` baje por debajo de lo reservado; derivar el estado de la disponibilidad real.
- **Archivos probables:** `src/app/admin/products/actions.ts` (`updateAdminProductInventory`), `src/app/admin/products/page.tsx` (mostrar reservado), `src/lib/admin-products.ts` (`normalizeAdminInventoryStatus`).
- **Criterios de aceptación:** el admin ve unidades reservadas; fijar `onHand < reserved` **se bloquea** con mensaje claro y no persiste; el estado refleja `onHand - reserved`.
- **Cómo verificar:** test con stock reservado; prueba manual con una orden en `PAYMENT_PROCESSING`.
- **Dependencias:** ninguna técnica.
- **Riesgo:** medio (toca reglas de inventario; no alterar el descuento atómico ni la reserva).
- **Modelo recomendado:** **Fable 5 / Opus 4.8** — inventario.
- **Aprobación:** ✅ Confirmado (PO 2026-06-24) — bloquear `onHand < reserved`. No altera el descuento atómico ni la reserva.

### NPW-C7 · Cobertura de zonas: mitigación documentada ahora
- **Hallazgos:** NP-013 (P2).
- **Decisión PO (2026-06-24):** **mitigación documentada ahora, sin cambio de schema.** Los límites/polígonos por zona quedan para preproducción con el proveedor de mapas final.
- **Objetivo:** que las zonas nuevas no queden sin validación de pin de forma **silenciosa**: hacer explícito el comportamiento y advertirlo al admin.
- **Archivos probables:** `src/lib/fulfillment.ts` (`isCoordinateInsideDeliveryZone`, comentario/aviso), `src/app/admin/settings/page.tsx` (aviso al crear/editar zona), nota en `docs/`.
- **Criterios de aceptación:** el comportamiento "sin límites definidos = no se valida el pin" queda **documentado y advertido** al crear/editar una zona; (los polígonos por zona quedan fuera de alcance por ahora).
- **Cómo verificar:** test de `isCoordinateInsideDeliveryZone` con zona sin límites; revisión del aviso en el flujo de creación de zona.
- **Dependencias:** polígonos por zona (schema) diferidos a preproducción; se cruza con NPW-E1 y el proveedor de mapas final.
- **Riesgo:** bajo (mitigación/aviso; sin cambio de comportamiento de cobertura).
- **Modelo recomendado:** **Sonnet 4.6** — aviso en UI + documentación.
- **Aprobación:** ✅ Confirmado (PO 2026-06-24) — mitigación interina sin schema. La versión con schema (bounds/polígono) requerirá aprobación al retomarse en preproducción.

---

## Fase D — Emails, comunicación y soporte

### NPW-D1 · Emails de cambio de estado de orden
- **Hallazgos:** NP-007 (P2).
- **Objetivo:** notificar al cliente en `SHIPPED`/`DELIVERED` (e idealmente `CANCELLED`/`REFUNDED`).
- **Archivos probables:** `src/lib/email/templates.ts` (plantillas), `src/lib/email/transactional.ts` (envío + `EmailLog`), `src/lib/admin-orders.ts` (`updateOrderStatusForAdmin` dispara el email tras commit).
- **Criterios de aceptación:** cada transición notificable genera un email registrado en `EmailLog` con número de orden y enlace con token; `console` en dev/E2E; el fallo de email no bloquea el cambio de estado.
- **Cómo verificar:** test de plantillas/envío; cambiar estado en E2E/local y revisar `EmailLog`/consola; `npm test`.
- **Dependencias:** NPW-A1 (mismo punto de cambio de estado). Coordinar copy con negocio.
- **Riesgo:** bajo-medio (no bloquear fulfillment si el email falla).
- **Modelo recomendado:** **Sonnet 4.6**.
- **Aprobación:** No (sin schema). Confirmar copy con negocio.

### NPW-D2 · Notificación automática "vuelve a haber stock"
- **Hallazgos:** NP-008 (P2).
- **Objetivo:** avisar por email a los contactos de `StockAlertRequest` abiertos cuando el producto se reabastece, y marcarlos `NOTIFIED`.
- **Archivos probables:** `src/app/admin/products/actions.ts` (`updateAdminProductInventory`) o acción dedicada en `src/app/admin/stock-alerts/actions.ts`; `src/lib/stock-alerts.ts`; `src/lib/email/{templates,transactional}.ts`.
- **Criterios de aceptación:** al reabastecer un producto con avisos `OPEN`, los contactos reciben email (en `EmailLog`) y el aviso pasa a `NOTIFIED`; sin envíos duplicados; respeta dedup existente.
- **Cómo verificar:** test del flujo reabastecer→notificar; E2E con `console`.
- **Dependencias:** NPW-D1 (infraestructura de plantillas/envío).
- **Riesgo:** medio (evitar spam/duplicados; idempotencia por aviso).
- **Modelo recomendado:** **Sonnet 4.6**.
- **Aprobación:** No (sin schema; usa `StockAlertRequest` existente).

### NPW-D3 · Enriquecer el email de confirmación de orden
- **Hallazgos:** NP-015 (P3).
- **Objetivo:** incluir líneas de producto, método de entrega y datos de retiro (dirección/horario/instrucciones) cuando aplique.
- **Archivos probables:** `src/lib/email/templates.ts`, `src/lib/payment-events.ts` (pasar los datos ya disponibles al armar el email).
- **Criterios de aceptación:** el email incluye ítems, total, método de entrega y datos de retiro cuando corresponde; tests de plantilla actualizados.
- **Cómo verificar:** `npm test` (`templates.test.ts`); revisión del HTML/texto.
- **Dependencias:** NPW-D1 (consolidar plantillas).
- **Riesgo:** bajo.
- **Modelo recomendado:** **Haiku 4.5** — copy/plantilla.
- **Aprobación:** No. Confirmar copy con negocio.

---

## Fase E — Accesibilidad, SEO y performance

### NPW-E1 · Ruta accesible para fijar la ubicación de envío local
- **Hallazgos:** NP-009 (P2).
- **Objetivo:** poder establecer coordenadas válidas sin ratón (campos de lat/lng o búsqueda de dirección seleccionable, o controles de teclado en el mapa), con foco visible.
- **Archivos probables:** `src/components/checkout/checkout-location-picker.tsx`, `src/components/checkout/checkout-delivery-fields.tsx`.
- **Criterios de aceptación:** se fija una ubicación válida solo con teclado; el envío local se completa sin geolocalización del navegador; foco visible.
- **Cómo verificar:** prueba manual con teclado/lector de pantalla; E2E que fije coordenadas por la UI (no por `evaluate`).
- **Dependencias:** se cruza con NPW-C7 y el proveedor de mapas final.
- **Riesgo:** medio (no romper la captura actual de coordenadas que el checkout exige).
- **Modelo recomendado:** **Sonnet 4.6** — Client Component con foco en a11y.
- **Aprobación:** No.

### NPW-E2 · Consultar solo los SKUs del carrito (dejar de cargar todo el catálogo)
- **Hallazgos:** NP-011 (P2).
- **Objetivo:** que ver/modificar el carrito consulte solo los productos del carrito con `select` mínimo.
- **Archivos probables:** `src/lib/cart.ts` (`getGuestCart`, `findProductBySku`), posible helper en `src/data/products.ts` (`getProductsBySkus`).
- **Criterios de aceptación:** el carrito no carga la tabla completa; resultados equivalentes en los tests de carrito existentes.
- **Cómo verificar:** `npm test` (`cart-state`/carrito); revisión de queries; opcional `EXPLAIN`.
- **Dependencias:** ninguna.
- **Riesgo:** bajo-medio (mantener el cálculo de disponibilidad `onHand - reserved`).
- **Modelo recomendado:** **Sonnet 4.6** — optimización acotada con tests existentes.
- **Aprobación:** No.

### NPW-E3 · Unificar el sistema de tokens visuales (empezando por post-compra)
- **Hallazgos:** NP-010 (P2).
- **Objetivo:** alinear las páginas de cara al cliente a un solo sistema de tokens, priorizando confirmación de orden y cuenta.
- **Archivos probables:** `src/app/orders/[orderNumber]/page.tsx`, `src/app/account/**`, luego home; `src/app/globals.css`/`src/index.css` para consolidar tokens.
- **Criterios de aceptación:** confirmación de orden y cuenta usan el mismo sistema que carrito/checkout; sin regresiones de responsive.
- **Cómo verificar:** revisión visual lado a lado; `npm run test:e2e` (responsive smoke).
- **Dependencias:** ninguna técnica.
- **Riesgo:** medio (alcance amplio; fasear por pantalla; **no** es rediseño nuevo).
- **Modelo recomendado:** **Sonnet 4.6** (primera pantalla/decisión) + **Haiku 4.5** (alineación repetitiva).
- **Aprobación:** Sí (ligera) — confirmar que es unificación, no rediseño visual grande.

---

## Fase F — QA, CI y documentación

### NPW-F1 · Añadir puerta de `npm audit` en CI
- **Hallazgos:** NP-018 (P3).
- **Objetivo:** detectar dependencias vulnerables en cada PR.
- **Archivos probables:** `.github/workflows/ci.yml` (paso en job `quality`).
- **Criterios de aceptación:** CI ejecuta `npm audit` y reporta severidad alta (no bloqueante al inicio si se prefiere; luego bloqueante).
- **Cómo verificar:** correr el workflow en un PR.
- **Dependencias:** ninguna.
- **Riesgo:** bajo.
- **Modelo recomendado:** **Haiku 4.5** — edición de CI acotada.
- **Aprobación:** No.

### NPW-F2 · Cerrar brechas de E2E en flujos críticos
- **Hallazgos:** NP-019 (P3), apoya NP-003, NP-002, NP-007, NP-008, NP-020.
- **Objetivo:** E2E de checkout de usuario registrado (pickup y envío local), transición admin con restauración de stock, y stock insuficiente al confirmar; ajustar el E2E de add-to-cart si cambia NPW-B2.
- **Archivos probables:** `tests/e2e/catalog-cart.spec.ts`, `tests/e2e/admin.spec.ts`, posible `tests/e2e/account-checkout.spec.ts`.
- **Criterios de aceptación:** existen y pasan los E2E nuevos; fallan si se rompe la restauración de stock o si reaparece el teléfono placeholder.
- **Cómo verificar:** `npm run test:e2e`.
- **Dependencias:** NPW-B1 (teléfono), NPW-B2 (add-to-cart), NPW-A1 (actor en auditoría).
- **Riesgo:** bajo (solo pruebas).
- **Modelo recomendado:** **Sonnet 4.6** — escritura de pruebas sobre comportamiento ya definido.
- **Aprobación:** No.

### NPW-F3 · Actualizar documentación de estado
- **Hallazgos:** transversal (cierre del ciclo).
- **Objetivo:** reflejar en la documentación viva las decisiones y cambios al cerrar tareas.
- **Archivos probables:** `docs/mvp-current-status.md`, `docs/learning-file.md` (decisiones nuevas: regla de teléfono, permisos de MARKETING, actor de auditoría), `docs/qa-checklists.md` (nuevos casos manuales del audit).
- **Criterios de aceptación:** el estado vivo refleja las tareas completadas y las reglas de negocio confirmadas por Eliezer.
- **Cómo verificar:** revisión documental en el PR.
- **Dependencias:** las tareas que documenta.
- **Riesgo:** bajo.
- **Modelo recomendado:** **Haiku 4.5** — documentación.
- **Aprobación:** No.

---

## Mapa de dependencias (orden sugerido)

```
Fase A (NPW-A1, A2, A3) ── independientes, hacer ya
        │
        ├─ NPW-A1 (actor) ─► NPW-C4 (user atómico) , NPW-C5 (filtros auditoría)
        │
Fase B  NPW-B1 (teléfono) ─┐
        NPW-B2 (add-to-cart)│
                            └─► NPW-F2 (E2E)
Fase C  NPW-C1 (lockout) · NPW-C2 (permisos MARKETING) · NPW-C3 (búsqueda órdenes)
        NPW-C6 (inventario+reservado) · NPW-C7 (cobertura zonas)
Fase D  NPW-D1 (emails estado) ─► NPW-D2 (back-in-stock) ; NPW-D3 (enriquecer confirmación)
Fase E  NPW-E1 (mapa a11y) · NPW-E2 (carrito perf) · NPW-E3 (tokens visuales)
Fase F  NPW-F1 (npm audit) · NPW-F2 (E2E) · NPW-F3 (docs)
```

## Aprobaciones — estado al 2026-06-24

| Tarea | Decisión / pendiente |
|---|---|
| NPW-A1 | ✅ Confirmado: registrar siempre al actor en la auditoría. |
| NPW-B1 | ✅ Confirmado: teléfono obligatorio en envío local. |
| NPW-C1 | ✅ Confirmado: bloquear auto-desactivación y desactivar/degradar al último ADMIN. |
| NPW-C2 | ✅ Confirmado: solo ADMIN gestiona catálogo (retirar MARKETING de productos/imágenes). |
| NPW-C6 | ✅ Confirmado: bloquear `quantityOnHand` por debajo de lo reservado. |
| NPW-C7 | ✅ Confirmado: mitigación documentada ahora; polígonos por zona (schema) → preproducción. |
| NPW-E3 | ⏳ Pendiente: confirmar que es unificación de tokens y **no** rediseño (se asume unificación). |

## Fuera de alcance (pendientes de preproducción — no implementar aquí)

Estos siguen congelados por la regla del brief y se listan solo para trazabilidad (ver `docs/auditoria.md`, `docs/production-operations-checklist.md`):

- Integración real de Wompi y webhook como **fuente de verdad** (firma, idempotencia, validación de monto).
- Conciliación, reversas y reembolsos reales.
- DTE real con Ministerio de Hacienda.
- Connection pooling de PostgreSQL en producción y verificación de variables de Vercel.
- Paso de CSP de `Report-Only` a enforcement tras QA en preview.
- Rate limiting distribuido (Upstash) obligatorio en producción para todos los flujos sensibles, incluido el de avisos de stock (hoy en memoria, inservible en serverless multi-instancia).
- Proveedor de mapas/autocomplete final (Google Places u otro) y cumplimiento de la política de uso de Nominatim/OpenStreetMap.
