# QA Strategy - E-commerce de repuestos

## Objetivo

Validar que el MVP permita comprar repuestos sin errores criticos en catalogo, carrito, checkout, pagos, inventario, ordenes, admin y responsive.

El humano actuara como QA/Product Owner tecnico y tendra la ultima palabra sobre aprobacion.

## Principios

- Probar primero flujos que afectan dinero, inventario y datos fiscales.
- Mantener casos de prueba pequenos y repetibles.
- Registrar bugs con pasos claros.
- No aprobar features sin estados de error y vacios.
- Mobile es obligatorio, no secundario.

## Niveles de prueba

### Checklist manual

Primer nivel obligatorio para cada feature.

Debe cubrir:

- flujo feliz;
- estados vacios;
- errores esperados;
- responsive;
- accesibilidad basica;
- datos invalidos;
- permisos.

### Tests unitarios

Usar para reglas puras:

- calculo de totales;
- IVA;
- validacion de stock;
- transiciones de estado;
- formateo de dinero;
- validaciones Zod.

### Tests de integracion

Usar para:

- crear orden;
- actualizar inventario;
- procesar webhook;
- emitir/marcar DTE;
- carrito invitado.

### Tests E2E

Usar con Playwright cuando exista UI funcional:

- catalogo a carrito;
- checkout invitado;
- checkout registrado;
- admin ve orden;
- producto sin stock no se compra.

### Pruebas visuales/responsive

Usar capturas en pantallas criticas cuando cambie UI:

- catalogo;
- detalle de producto;
- carrito;
- checkout;
- selector de mapa/pin;
- admin ordenes.

### Pruebas de integraciones externas

Usar mocks/sandbox para:

- proveedor de pago local;
- webhook de pago;
- proveedor DTE;
- mapas/geocoding;
- email transaccional.

## Flujos criticos del MVP

1. Cliente invitado compra producto en stock.
2. Cliente registrado compra producto en stock.
3. Producto se queda sin stock durante checkout.
4. Pago confirmado cambia orden a `PAID_PENDING_SHIPMENT`.
5. Webhook duplicado no descuenta inventario dos veces.
6. Admin ve orden pagada.
7. Admin actualiza stock manualmente.
8. Cliente ve orden.
9. Ruta admin bloquea cliente normal/invitado.
10. Mobile checkout no rompe layout.
11. Cliente elige retiro en bodega gratis.
12. Cliente elige envio a Santa Tecla y se aplica tarifa correcta.
13. Cliente elige envio a San Salvador y se aplica tarifa segun zona.
14. Cliente permite ubicacion actual y el pin queda precargado.
15. Cliente rechaza ubicacion actual y puede escoger pin manual.
16. Direccion fuera de cobertura bloquea envio local.
17. UI principal se muestra en espanol.
18. Cambio a ingles no rompe layout ni rutas principales.

## Criterios de aceptacion globales

- No hay compra sin stock.
- No hay descuento de inventario antes de pago confirmado.
- No hay doble descuento por webhook repetido.
- Precio final visible coincide con total de orden.
- IVA 13% se calcula y registra correctamente cuando aplique.
- El cliente no ingresa datos de tarjeta en nuestra app si el proveedor usa checkout hospedado.
- Webhook se valida server-side.
- Rutas admin estan protegidas.
- Carrito invitado persiste durante la sesion.
- Estados de error son comprensibles.

## Escenarios Gherkin iniciales

### Compra invitada exitosa

```gherkin
Feature: Checkout invitado

Scenario: Cliente invitado compra un producto en stock
  Given existe un producto activo con 3 unidades disponibles
  And el cliente agrega 1 unidad al carrito
  When completa checkout con nombre, email, telefono y direccion
  And el pago es confirmado por el proveedor
  Then la orden queda en estado PAID_PENDING_SHIPMENT
  And el inventario disponible baja a 2
  And el admin puede ver la orden en pendientes de envio
```

### Stock agotado durante checkout

```gherkin
Feature: Validacion de inventario

Scenario: Producto se agota antes de pagar
  Given el cliente tiene un producto en el carrito
  And el producto queda con 0 unidades disponibles antes del checkout
  When el cliente intenta continuar al pago
  Then el sistema bloquea el pago
  And muestra que el producto ya no esta disponible
  And solicita email o telefono para aviso de reposicion si el cliente es invitado
```

### Webhook duplicado

```gherkin
Feature: Webhook de pago

Scenario: El proveedor envia dos veces la confirmacion de pago
  Given existe una orden PENDING_PAYMENT con pago pendiente
  When el sistema recibe un webhook valido de pago confirmado
  And recibe el mismo webhook otra vez
  Then la orden queda PAID_PENDING_SHIPMENT
  And el inventario se descuenta solo una vez
  And ambos eventos quedan auditados
```

## Matriz de responsive

Probar como minimo:

- Mobile pequeno: 360x740.
- Mobile comun: 390x844.
- Tablet: 768x1024.
- Desktop: 1366x768.
- Desktop amplio: 1440x900.

Pantallas prioritarias:

- home;
- catalogo;
- detalle;
- carrito;
- checkout;
- mapa/pin;
- admin ordenes.

## Checklist por release

- `npm run lint` pasa.
- `npm run typecheck` pasa si existe.
- tests relevantes pasan.
- seed/demo funciona.
- rutas criticas cargan.
- no hay secretos en repo.
- responsive validado.
- mapa/pin validado si la release toca checkout/direccion.
- i18n validado si la release toca textos visibles.
- cambios documentados.
- QA humano reviso criterios de aceptacion.

## Formato de bug

```md
# Bug

## Severidad
P0/P1/P2/P3

## Ambiente

## Pasos para reproducir

## Resultado actual

## Resultado esperado

## Evidencia

## Notas
```

## Severidades

- P0: bloquea compra, pago, inventario, seguridad o datos fiscales.
- P1: rompe flujo importante pero existe workaround.
- P2: error visible o UX mala sin bloquear venta.
- P3: detalle menor, texto, polish.
