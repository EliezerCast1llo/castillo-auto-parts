# Database Schema - Modelo inicial

## Objetivo

Definir un modelo de datos que soporte el MVP sin cerrar el camino a multi-bodega, facturacion DTE, chat, usuarios registrados, checkout invitado y pagos con proveedor local.

Este documento describe entidades y campos esperados. El `schema.prisma` se debe crear en la fase de implementacion.

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
