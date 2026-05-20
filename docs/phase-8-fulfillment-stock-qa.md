# Phase 8 - Fulfillment, Stock Alerts and QA Automation

Fecha: 2026-05-20.

## Objetivo

Pulir el MVP antes de pagos reales con tres mejoras operativas:

- entrega local con ubicacion exacta;
- avisos cuando no hay stock suficiente;
- pruebas E2E iniciales para flujos criticos.

## Implementado

### Direccion con mapa/pin

- Checkout local exige direccion, zona de entrega y coordenadas.
- El usuario puede usar geolocalizacion del navegador.
- El usuario puede mover el pin manualmente sobre mapa basado en OpenStreetMap.
- Se guardan `latitude`, `longitude`, `formattedAddress` y `placeId` cuando existan.
- Retiro en bodega mantiene solo direccion/mapa de bodega y no muestra campos de domicilio.

Nota: esta version no usa Google Places todavia. El modelo ya queda preparado para `placeId`, direccion formateada y coordenadas para conectar Google Places o proveedor final despues.

### Avisos por stock

- Cuando un producto en carrito queda sin stock o con cantidad insuficiente, el usuario puede dejar email o telefono.
- Se guarda `StockAlertRequest` con producto, SKU, cantidad solicitada, contacto y estado `OPEN`.
- Admin tiene vista `/admin/stock-alerts` para revisar solicitudes.

### QA automatizado

- Se agrega Playwright como base de pruebas E2E.
- Script: `npm run test:e2e`.
- Cobertura inicial:
  - busqueda en catalogo;
  - agregar producto al carrito guest;
  - login admin local.

## Pendiente

- Google Places Autocomplete o proveedor final de mapas.
- Notificacion automatica cuando inventario pase de sin stock a disponible.
- Estados editables para solicitudes de stock.
- Pruebas E2E completas de checkout local/pickup con base aislada para no consumir inventario real.
