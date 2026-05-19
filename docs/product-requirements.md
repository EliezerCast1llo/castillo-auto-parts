# Product Requirements - E-commerce de repuestos automotrices

## Estado del documento

- Proyecto: plataforma web para venta en linea de repuestos automotrices en El Salvador.
- Fecha base: 2026-05-15.
- Humano responsable: QA / Product Owner tecnico.
- Agente orquestador: Codex.
- Estado: borrador inicial para revision.

## Objetivo

Crear una tienda en linea rapida, confiable y responsive para vender repuestos automotrices propios, iniciando en San Salvador y Santa Tecla, con capacidad de crecer hacia mas zonas, mas bodegas, mas metodos de pago, facturacion electronica y automatizacion operativa.

El primer objetivo real del MVP es:

> Que un cliente pueda encontrar un repuesto, agregarlo al carrito, completar checkout como invitado o usuario registrado, pagar con un proveedor local, recibir confirmacion, y que el admin vea la orden como pendiente de envio/facturacion.

## Contexto de negocio

- Inventario: propio.
- Mercado inicial: El Salvador.
- Cobertura inicial: San Salvador y Santa Tecla.
- Moneda: dolares estadounidenses (`USD`).
- Precio: mostrar precios con IVA incluido, usando IVA 13%.
- Facturacion: debe prepararse para Documento Tributario Electronico (DTE) segun el esquema vigente del Ministerio de Hacienda.
- Pago: Wompi SV como primera opcion tecnica; BAC Compra Click como fallback operativo.
- Metodo de pago MVP: pago completo en linea.
- Entrega MVP: retiro gratis en bodega y envio local con equipo propio.
- Envio futuro: tercerizado para cobertura departamental.
- Marca: `Castillo Auto Parts` es codename/propuesta provisional, pendiente de validacion por posibles coincidencias comerciales en El Salvador.
- Idioma: interfaz principal en espanol, con base tecnica para ingles.
- Horizonte de MVP: 3 meses, priorizando robustez sobre velocidad de demo.

## Propuesta inicial de marca

El agente de marca/marketing debe evaluar nombres por recordacion, confianza, disponibilidad de dominio/redes y claridad comercial.

Opciones iniciales:

- Repuestos Castillo
- Auto Repuestos Castillo
- Castillo Parts
- RepuestoYa SV
- AutoPiezas Castillo
- Castillo Repuestos Express

Recomendacion inicial: **Repuestos Castillo** si se quiere confianza local y apellido/familia; **RepuestoYa SV** si se quiere sonar mas rapido y digital. La decision final queda pendiente de validacion de dominio, redes sociales y posicionamiento.

## Usuarios principales

### Cliente comprador

Persona que necesita repuesto para su vehiculo y quiere comparar precio, disponibilidad y compatibilidad antes de comprar. Puede comprar desde telefono.

Necesidades:

- Buscar por nombre, categoria, marca, modelo, anio, SKU o numero de parte.
- Confirmar compatibilidad.
- Ver precio final con IVA incluido.
- Saber si hay stock.
- Comprar sin crear cuenta.
- Recibir confirmacion de orden y factura/comprobante.

### Administrador

Persona interna que carga productos, revisa inventario y procesa ordenes.

Necesidades:

- Ver ordenes pagadas pendientes de envio.
- Revisar datos del cliente y direccion.
- Ver productos comprados.
- Cambiar estado de orden.
- Cargar inventario manualmente.
- Preparar facturacion DTE.

Roles futuros sugeridos:

- `ADMIN`: todos los permisos.
- `SALES`: ordenes, clientes y soporte comercial.
- `WAREHOUSE`: inventario, despacho y preparacion.
- `SUPPORT`: chat, casos y seguimiento.
- `ACCOUNTING`: facturacion DTE, pagos, reembolsos y reportes fiscales.
- `MARKETING`: contenido, SEO, categorias y promociones.

Para el MVP, el primer usuario admin tendra permisos completos.

### QA / Product Owner tecnico

Responsable humano de aprobar entregables.

Necesidades:

- Revisar criterios de aceptacion.
- Probar flujos criticos.
- Priorizar features.
- Rechazar cambios innecesarios.
- Mantener claridad de alcance.

## Alcance del MVP

### Incluido

- Home page funcional, no landing generica.
- Catalogo de productos.
- Busqueda y filtros basicos.
- Detalle de producto.
- Compatibilidad simple: marca, modelo y anio.
- Carrito para invitado y usuario registrado.
- Checkout guest.
- Checkout usuario registrado.
- Validacion de datos con Zod.
- Precio con IVA incluido.
- Moneda USD.
- Retiro en bodega gratis en dias/horarios definidos.
- Envio local por zona: Santa Tecla con tarifa inicial de referencia de USD 2; San Salvador con tarifa inicial de referencia de USD 3 a USD 5.
- Direccion con mapa: usar ubicacion actual del cliente cuando sea posible y permitir mover/escoger pin manualmente.
- Orden en estado `PAID_PENDING_SHIPMENT` despues del pago web confirmado o simulado.
- Integracion con proveedor de pagos local mediante abstraccion.
- Webhook o confirmacion equivalente del proveedor de pagos.
- Cambio de orden a `PAID_PENDING_SHIPMENT`.
- Admin basico para ver ordenes.
- Admin basico para cargar/editar productos e inventario manual.
- Estructura lista para facturacion DTE.
- Base de internacionalizacion para espanol/ingles.
- Estados de stock: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `PREORDER`.
- Responsive mobile/tablet/desktop.

### No incluido en el primer corte funcional

- Multi-bodega operativa completa.
- Escaner de facturas para carga automatica.
- Chat completo con admin.
- Optimizacion avanzada de rutas de entrega.
- Apple Pay / Google Pay si el proveedor local no lo soporta desde el inicio.
- Recomendaciones con IA.
- Automatizacion completa de facturacion si aun no hay proveedor/contador definido.
- Marketplace de terceros.
- Traduccion completa de todo el contenido comercial si no hay copy aprobado en ingles.

## Reglas de negocio

### Precio e impuestos

- Los precios visibles al cliente deben incluir IVA.
- El sistema debe poder almacenar desglose fiscal para DTE: subtotal, IVA 13%, total.
- En el MVP, cada producto tendra una sola variante.

### Inventario

- No permitir agregar al carrito productos `OUT_OF_STOCK`.
- No permitir comprar mas unidades que el stock disponible.
- Validar stock al entrar a checkout y antes de enviar a pago.
- Si el producto queda sin stock durante checkout:
  - mostrar mensaje claro;
  - remover o marcar el producto afectado;
  - solicitar email o telefono si el cliente es invitado;
  - permitir suscripcion a aviso de reposicion.
- Actualizar inventario solo cuando el pago este confirmado por el proveedor.

### Checkout

- El cliente puede comprar como invitado.
- El cliente registrado puede guardar datos y ver ordenes.
- El checkout debe capturar:
  - nombre;
  - email;
  - telefono;
  - direccion legible;
  - municipio/departamento;
  - ubicacion en mapa cuando sea envio local;
  - notas de entrega;
  - metodo de pago.
- El cliente puede escoger retiro en bodega o envio local.
- Retiro en bodega no tiene costo de envio.
- Envio en Santa Tecla tiene tarifa inicial de referencia de USD 2.
- Envio en San Salvador tiene tarifa inicial de referencia de USD 3 a USD 5, pendiente de definir por zona exacta.

### Pago

- No almacenar datos de tarjeta.
- Pago completo en linea para MVP.
- Usar redireccion, enlace de pago, boton de pago, checkout hospedado o API segura de proveedor local.
- El backend debe registrar intentos de pago, estado, referencia externa y evento recibido.
- Toda confirmacion de pago debe validarse server-side.

### Facturacion DTE

- El sistema debe guardar informacion suficiente para emitir DTE.
- La emision puede integrarse en una fase separada si el onboarding ante Ministerio de Hacienda o proveedor DTE aun no esta completo.
- Para MVP comercial, una orden pagada no debe quedar sin proceso fiscal definido: emitida, pendiente de emision o marcada para revision manual.

### Direccion y mapa

- El checkout debe solicitar permiso para tomar ubicacion actual del dispositivo.
- Si el cliente no concede permiso, debe poder buscar o seleccionar ubicacion manualmente.
- El cliente debe poder mover el pin antes de confirmar.
- No guardar solo coordenadas: tambien se debe guardar direccion legible y notas de referencia.
- Si la direccion cae fuera de cobertura inicial, el sistema debe bloquear envio local y ofrecer retiro en bodega o aviso de cobertura futura.

### Idioma

- Espanol es el idioma principal.
- La arquitectura debe permitir ingles.
- En MVP, las pantallas principales deben estar preparadas para traducciones aunque no todo el contenido comercial este traducido.

## Requisitos funcionales

### Catalogo

- Ver lista de productos con imagen, nombre, precio, marca, categoria, SKU/parte y stock.
- Filtrar por categoria, marca y compatibilidad simple.
- Buscar por texto.
- Mostrar estados vacios y errores.

### Detalle de producto

- Galeria de imagenes.
- Nombre, marca, SKU/numero de parte.
- Precio con IVA.
- Stock.
- Selector de cantidad.
- Boton agregar al carrito.
- Descripcion completa.
- Detalles tecnicos.
- Compatibilidad vehicular.
- CTA de soporte.

### Carrito

- Agregar producto.
- Cambiar cantidad.
- Eliminar producto.
- Ver productos, envio y total.
- Ver nota informativa indicando que los precios ya incluyen IVA.
- Persistir carrito invitado con cookie/session segura.
- Mantener carrito por usuario registrado.

### Ordenes

- Crear orden antes del pago.
- Registrar items con precio congelado al momento de compra.
- Ver ordenes del cliente.
- Admin ve ordenes por estado.

### Admin

- Login protegido.
- Primer rol admin con todos los permisos.
- Ver ordenes.
- Ver detalle de orden.
- Cambiar estado de orden.
- Crear/editar productos.
- Actualizar stock manual.
- Ver estado fiscal/DTE de cada orden.
- Ver metodo de entrega y datos de ubicacion.

## Requisitos no funcionales

- TypeScript estricto.
- Componentes reutilizables.
- Validaciones server-side y client-side.
- Rutas admin protegidas.
- Diseno responsive.
- Buen rendimiento en movil.
- Manejo de errores y estados de carga.
- Logs de eventos criticos: pago, inventario, factura, cambios admin.
- No guardar tarjetas.
- Webhooks con validacion de firma o mecanismo equivalente del proveedor.
- Base de i18n para espanol/ingles.
- Soporte de geolocalizacion/map picker en checkout.

## Metricas de exito del MVP

- Cliente completa compra de punta a punta sin soporte manual.
- Admin puede procesar orden pagada.
- 0 compras permitidas sin stock.
- 0 ordenes pagadas sin registro de pago externo.
- Tiempo de carga inicial aceptable en movil.
- QA aprueba flujo guest, flujo registrado, responsive y error states.
- QA aprueba mapa/pin, tarifas de envio y retiro en bodega.
- QA aprueba pruebas unitarias, integracion y E2E en flujos criticos.

## Preguntas abiertas

1. Proveedor Wompi: requisitos KYC, tiempos de desembolso, contracargos y retenciones.
2. DTE semiautomatico: proceso operativo final con contador.
3. Nombre de marca definitivo.
4. Tamano de inventario inicial segun estudio de mercado.
5. Direccion exacta, horarios y dias de retiro en bodega.
6. Tabla final de zonas/tarifas para San Salvador.
7. Proveedor de mapas final y costos esperados.
8. Alcance exacto del ingles en MVP: solo UI base o contenido completo.
