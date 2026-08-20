# Database Schema - Modelo inicial

## Objetivo

Definir un modelo de datos que soporte el MVP sin cerrar el camino a multi-bodega, facturacion DTE, chat, usuarios registrados, checkout invitado y pagos con proveedor local.

El schema implementado vive en `prisma/schema.prisma` y es la fuente canonica tecnica. Este documento describe el modelo de negocio a alto nivel y puede incluir entidades futuras.

## Estado implementado

Implementado en Prisma:

- catalogo: `ProductCategory`, `Product`, `ProductImage`, `VehicleCompatibility`;
- inventario: `InventoryLocation`, `InventoryStock`;
- carrito/guest: `GuestSession`, `Cart`, `CartItem`;
- ordenes: `Order`, `OrderItem`, `Address`, `Shipment`;
- pagos mock/adaptador: `Payment`, `PaymentEvent`;
- fiscal manual futuro: `InvoiceDte`;
- fulfillment: `DeliveryZone`;
- operacion admin: `AdminAuditLog`;
- comunicaciones: `EmailLog`, `StockAlertRequest`.

## Convenciones

- IDs internos: `cuid` o `uuid`.
- Fechas: `createdAt`, `updatedAt`.
- Dinero: guardar en centavos como entero (`priceCents`, `totalCents`) o usar `Decimal` de Prisma. Recomendacion: entero en centavos para USD.
- Moneda inicial: `USD`.
- Precios visibles incluyen IVA.
- Estados como enums.

## Enums principales

```txt
UserRole = CUSTOMER | ADMIN | SALES | WAREHOUSE | SUPPORT
InventoryStatus = IN_STOCK | LOW_STOCK | OUT_OF_STOCK | PREORDER
OrderStatus = PAID_PENDING_SHIPMENT | SHIPPED | DELIVERED | CANCELLED | REFUNDED
PaymentStatus = PENDING | PAID | FAILED | CANCELLED | REFUNDED
InvoiceStatus = PENDING | ISSUED | FAILED | VOIDED | MANUAL_REVIEW
ChatStatus = OPEN | WAITING_CUSTOMER | WAITING_AGENT | CLOSED
ShipmentStatus = PENDING | IN_TRANSIT | DELIVERED | FAILED | CANCELLED
```

## User

Cliente registrado o usuario admin.

Campos:

- `id`
- `name`
- `email`
- `phone`
- `role`
- `emailVerifiedAt`
- `createdAt`
- `updatedAt`

Relaciones:

- muchas `Order`
- muchas `Address`
- muchas `ChatSession`

## GuestSession

Identidad temporal para carrito y orden invitada.

Campos:

- `id`
- `sessionTokenHash`
- `email`
- `phone`
- `expiresAt`
- `createdAt`
- `updatedAt`

Relaciones:

- un `Cart`
- muchas `Order`

## ProductCategory

Categoria comercial.

Campos:

- `id`
- `name`
- `slug`
- `description`
- `parentId`
- `isActive`
- `sortOrder`

Relaciones:

- muchos `Product`
- categoria padre opcional.

## Product

Producto vendible.

Campos:

- `id`
- `name`
- `slug`
- `brand`
- `sku`
- `partNumber`
- `shortDescription`
- `description`
- `technicalDetailsJson`
- `categoryId`
- `priceCents`
- `currency`
- `ivaRate`
- `isActive`
- `isFeatured`
- `createdAt`
- `updatedAt`

Relaciones:

- una `ProductCategory`
- muchas `ProductImage`
- muchas `VehicleCompatibility`
- muchos registros `InventoryStock`
- muchos `CartItem`
- muchos `OrderItem`

Notas:

- `sku` es interno.
- `partNumber` es numero de parte de fabricante/proveedor.
- En el MVP no hay variantes.

## ProductImage

Imagenes de producto.

Campos:

- `id`
- `productId`
- `url`
- `alt`
- `sortOrder`
- `isPrimary`

## VehicleCompatibility

Compatibilidad simple inicial.

Campos:

- `id`
- `productId`
- `make`
- `model`
- `yearFrom`
- `yearTo`

Futuro:

- motor;
- version;
- transmision;
- VIN;
- posicion;
- lado.

## InventoryLocation

Bodega o ubicacion logica.

Campos:

- `id`
- `name`
- `code`
- `address`
- `isDefault`
- `isActive`

MVP:

- crear una bodega default.

## InventoryStock

Stock por producto y ubicacion.

Campos:

- `id`
- `productId`
- `locationId`
- `quantityOnHand`
- `quantityReserved`
- `reorderPoint`
- `status`
- `updatedAt`

Reglas:

- stock disponible = `quantityOnHand - quantityReserved`.
- para MVP se puede usar solo `quantityOnHand` si no hay reservas.

## InventoryMovement

Auditoria de inventario.

Campos:

- `id`
- `productId`
- `locationId`
- `type`
- `quantityDelta`
- `reason`
- `orderId`
- `createdByUserId`
- `createdAt`

Tipos sugeridos:

- `MANUAL_ADJUSTMENT`
- `SALE`
- `RETURN`
- `RESTOCK`
- `CANCELLATION`

## Cart

Carrito activo.

Campos:

- `id`
- `userId`
- `guestSessionId`
- `status`
- `createdAt`
- `updatedAt`

Reglas:

- debe pertenecer a `User` o `GuestSession`.
- un carrito activo por identidad.

## CartItem

Item del carrito.

Campos:

- `id`
- `cartId`
- `productId`
- `quantity`
- `priceSnapshotCents`
- `createdAt`
- `updatedAt`

Nota:

- El precio se recalcula/valida al checkout, pero se guarda snapshot para mostrar consistencia.

## Address

Direccion de envio.

Campos:

- `id`
- `userId`
- `guestSessionId`
- `formattedAddress`
- `addressLine1`
- `addressLine2`
- `city`
- `department`
- `country`
- `postalCode`
- `placeId`
- `latitude`
- `longitude`
- `deliveryNotes`
- `createdAt`
- `updatedAt`

MVP:

- direccion textual obligatoria.
- coordenadas opcionales hasta integrar mapa.

## Order

Orden de compra.

Campos:

- `id`
- `orderNumber`
- `userId`
- `guestSessionId`
- `customerName`
- `customerEmail`
- `customerPhone`
- `status`
- `subtotalCents`
- `taxCents`
- `shippingCents`
- `totalCents`
- `currency`
- `addressId`
- `notes`
- `paidAt`
- `createdAt`
- `updatedAt`

Relaciones:

- muchos `OrderItem`
- un `Payment`
- un `InvoiceDte`
- un `Shipment`
- una `Address`

Reglas:

- los totales no se recalculan desde producto despues de creada la orden;
- la orden guarda precio congelado.

## OrderItem

Producto comprado.

Campos:

- `id`
- `orderId`
- `productId`
- `productNameSnapshot`
- `skuSnapshot`
- `partNumberSnapshot`
- `brandSnapshot`
- `unitPriceCents`
- `quantity`
- `taxCents`
- `lineTotalCents`

## Payment

Registro del pago.

Campos:

- `id`
- `orderId`
- `provider`
- `status`
- `amountCents`
- `currency`
- `externalPaymentId`
- `externalReference`
- `checkoutUrl`
- `rawStatus`
- `paidAt`
- `createdAt`
- `updatedAt`

Eventos:

- relacion opcional a `PaymentEvent`.

## PaymentEvent

Auditoria de eventos/webhooks.

Campos:

- `id`
- `paymentId`
- `provider`
- `eventType`
- `externalEventId`
- `payloadJson`
- `receivedAt`
- `isValid`

## InvoiceDte

Registro fiscal/DTE.

Campos:

- `id`
- `orderId`
- `status`
- `documentType`
- `generationCode`
- `controlNumber`
- `receptionSeal`
- `issuedAt`
- `receiverName`
- `receiverDocument`
- `receiverEmail`
- `jsonUrl`
- `pdfUrl`
- `errorMessage`
- `createdAt`
- `updatedAt`

Notas:

- Para consumidor final, validar con contador que datos del receptor son obligatorios segun monto y tipo de documento.
- Guardar representacion legible y JSON cuando el proveedor lo entregue.

## Shipment

Entrega.

Campos:

- `id`
- `orderId`
- `status`
- `carrier`
- `trackingNumber`
- `deliveryZone`
- `estimatedDeliveryAt`
- `deliveredAt`
- `notes`

MVP:

- puede ser manual con estados basicos.

## StockNotificationRequest

Solicitud de aviso cuando vuelva stock.

Campos:

- `id`
- `productId`
- `email`
- `phone`
- `userId`
- `guestSessionId`
- `createdAt`
- `notifiedAt`

## ChatSession

Sesion de soporte.

Campos:

- `id`
- `userId`
- `guestEmail`
- `guestName`
- `status`
- `subject`
- `createdAt`
- `updatedAt`

## ChatMessage

Mensaje de soporte.

Campos:

- `id`
- `chatSessionId`
- `senderType`
- `senderUserId`
- `body`
- `createdAt`

## AuditLog

Cambios sensibles.

Campos:

- `id`
- `actorUserId`
- `entityType`
- `entityId`
- `action`
- `beforeJson`
- `afterJson`
- `createdAt`

Usos:

- cambios de stock;
- cambios de orden;
- cambios de producto;
- cambios de factura.

## Indices sugeridos

- `Product.slug` unique.
- `Product.sku` unique.
- `Product.partNumber`.
- `Product.name` full-text/trigram en fase posterior.
- `Order.orderNumber` unique.
- `Order.status`.
- `Order.customerEmail`.
- `Payment.externalPaymentId`.
- `InvoiceDte.generationCode`.
- `VehicleCompatibility(make, model, yearFrom, yearTo)`.

## Traducciones de contenido

`ProductTranslation` y `ProductCategoryTranslation` guardan el contenido en los
idiomas **distintos del principal**. El espanol vive en las columnas de
`Product` y `ProductCategory`; estas tablas solo tienen filas para los demas.

Cada campo traducible es nullable a proposito: el fallback es **por campo**, no
por fila. Un producto con nombre en ingles pero sin descripcion muestra el
nombre traducido y la descripcion en espanol, en vez de caer entero a un idioma.

La clave `@@unique([productId, locale])` es la que usa el admin para el upsert.
Cuando los tres campos quedan vacios la fila se borra: una traduccion sin
contenido no aporta y ensucia el `include` de cada lectura del catalogo.

Las cuatro columnas `locale` (las dos tablas de traduccion, `Order` y `User`)
llevan un CHECK de formato `^[a-z]{2}$` que Prisma no puede declarar y vive en
la migracion `20260820120000_locale_format_check`. Ataja la fila escrita por
script con `"EN"` o `"en-US"`: el `where: { locale }` busca `"en"` exacto, asi
que esa fila no se selecciona nunca y la traduccion se da por cargada sin
estarlo. Verifica la forma y no la lista de idiomas soportados —esa vive en
`src/lib/i18n/config.ts` y repetirla en SQL garantiza que una de las dos se
desactualice. Si algun dia se soporta un idioma con region (`pt-BR`), el CHECK
hay que relajarlo a `^[a-z]{2}(-[A-Z]{2})?$`.

**`ProductCategory.slug` es el identificador del filtro del catalogo**, no su
`name`. El nombre se traduce, asi que filtrar por el hacia imposible traducir la
faceta: en cuanto el sidebar dijera "Brakes", `?category=Brakes` no encontraba
nada. Las URLs con el nombre en espanol (`?category=Frenos`) se siguen
entendiendo y redirigen 308 al slug. Esa traduccion de vuelta asume
`slug === slugify(name)`, que se sostiene porque los dos caminos que crean
categorias —el seed y el `resolveCategoryId` del admin— derivan el slug del
nombre.

**Los slugs no se traducen.** `/en/product/pastillas-freno-toyota` conserva el
slug en espanol. Traducirlos pediria una columna `slugEn`, una politica de
colisiones y su propia tabla de redirects; queda fuera de alcance.

**La busqueda no tiene indice para las traducciones.** La clausula sobre
`ProductTranslation.name` es un `ILIKE '%q%'` con scan secuencial, igual que las
que ya existian sobre `Product`. No es una regresion de tipo, pero una busqueda
seria pide `pg_trgm` o una columna `tsvector`.

Dos limites de esa busqueda, medidos contra el seed de 63 productos:

- **Los dos caminos no devuelven lo mismo.** La base consulta `name`, `sku`,
  `partNumber` y `brand` (`DB_QUERY_FIELDS`); el camino en memoria
  —`filterCatalogProducts`, que corre con el mock y en el autocompletado— suma
  `category`, `compatibility`, `description`, `compatibleVehicles` y
  `technicalDetails`. No es que uno cubra mas: es que la misma consulta devuelve
  cosas distintas segun cual este activo. `bujias` da 0 contra la base y 6 en
  memoria; `freno`, 2 y 8. Si la base se cae, la busqueda encuentra **mas** que
  en operacion normal.
- **No hay lematizacion ni normalizacion de acentos.** El plural no encuentra al
  singular (`amortiguadores` da 0, `amortiguador` da 4) y `bujia` sin tilde da 0
  contra la base. Por eso las sugerencias del estado vacio guardan la query en
  singular y con acento, con `src/data/search-suggestions.test.ts` verificandolo.

Las dos se cierran juntas moviendo la busqueda a `tsvector` con un diccionario
en espanol, que resuelve stemming y acentos y de paso deja de depender de que
camino corra.

`Order.locale` y `User.locale` existen para los correos: el de confirmacion se
dispara desde el webhook del proveedor de pagos, fuera de todo request con
segmento de idioma. El checkout admite invitados, asi que `User` no alcanza y la
columna tiene que estar en la orden.
