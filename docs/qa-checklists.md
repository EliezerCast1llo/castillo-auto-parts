# QA Checklists - Castillo Auto Parts

## Estado

- Fecha: 2026-05-18.
- Uso: checklist vivo para QA/PO humano.
- Regla: cada feature debe marcar que aplica, que no aplica y que queda pendiente.

## Checklist Global Por Feature

Antes de aprobar una feature:

- [ ] Cumple el objetivo definido.
- [ ] Cumple criterios de aceptacion.
- [ ] No agrega alcance no aprobado.
- [ ] Maneja estados de carga.
- [ ] Maneja estados vacios.
- [ ] Maneja errores esperados.
- [ ] Funciona en mobile 360px.
- [ ] Funciona en tablet 768px.
- [ ] Funciona en desktop 1366px.
- [ ] Textos no se cortan ni se enciman.
- [ ] Botones y links son claros.
- [ ] No depende solo de color para comunicar estado.
- [ ] Usa precios en USD.
- [ ] Mantiene IVA incluido cuando muestra precios.
- [ ] No expone secretos ni credenciales.
- [ ] No rompe rutas existentes.
- [ ] Pasa `npm run typecheck`.
- [ ] Pasa `npm run lint`.
- [ ] Pasa `npm test`.
- [ ] Pasa `npm run build` si toca app/render.

## Home

- [ ] La primera pantalla comunica que es una tienda de repuestos.
- [ ] El buscador principal es visible sin hacer scroll.
- [ ] La busqueda permite entender que se puede buscar por repuesto, SKU, numero de parte o vehiculo.
- [ ] El selector por vehiculo es visible.
- [ ] Las categorias principales se entienden rapido.
- [ ] Hay CTA claro hacia catalogo.
- [ ] La home no parece landing generica.
- [ ] Mobile permite llegar a busqueda, carrito e idioma facilmente.

## Catalogo

- [ ] Carga lista de productos.
- [ ] Cada producto muestra nombre, imagen/placeholder, marca, parte/SKU, precio y stock.
- [ ] Se ve compatibilidad resumida.
- [ ] El boton "Agregar" es visible.
- [ ] Los filtros son visibles en desktop.
- [ ] Los filtros no bloquean la navegacion en mobile.
- [ ] Productos preorder no parecen stock inmediato.
- [ ] Los nombres largos no rompen tarjetas.
- [ ] Precio y stock son faciles de escanear.
- [ ] Estado vacio esta definido para cero resultados.

## Detalle De Producto

- [ ] Muestra nombre, marca, SKU y numero de parte.
- [ ] Muestra precio con IVA incluido.
- [ ] Muestra estado de stock.
- [ ] Muestra cantidad disponible o mensaje de disponibilidad.
- [ ] Muestra compatibilidad como bloque principal.
- [ ] Muestra descripcion.
- [ ] Muestra detalles tecnicos.
- [ ] CTA principal es "Agregar al carrito".
- [ ] CTA secundario permite validar con asesor.
- [ ] Explica retiro/envio local.
- [ ] Producto inexistente lleva a 404.
- [ ] Mobile mantiene CTA y precio faciles de encontrar.

## Carrito

- [ ] Agrega productos desde catalogo/detalle.
- [ ] Permite cambiar cantidad.
- [ ] Bloquea cantidad mayor al stock.
- [ ] Permite eliminar producto.
- [ ] Muestra productos, envio y total.
- [ ] Muestra nota de que los precios ya incluyen IVA, sin calculo separado de IVA.
- [ ] Muestra productos sin stock/preorder correctamente.
- [ ] Persiste carrito guest.
- [ ] Estado vacio invita a volver al catalogo.

## Checkout Guest

- [ ] Permite checkout sin crear cuenta.
- [ ] Pide nombre.
- [ ] Pide email.
- [ ] Pide telefono.
- [ ] Pide direccion o retiro en bodega.
- [ ] Valida campos obligatorios.
- [ ] Revalida stock antes de pago.
- [ ] Crea orden `PAID_PENDING_SHIPMENT` despues del pago web confirmado o simulado.
- [ ] No pide datos de tarjeta dentro de nuestra app.
- [ ] Muestra resumen final antes de pago.

## Direccion Y Mapa

- [ ] Solicita ubicacion actual con permiso del navegador.
- [ ] Permite continuar si el usuario niega ubicacion.
- [ ] Permite mover pin manualmente.
- [ ] Guarda direccion legible y coordenadas.
- [ ] Pide notas de entrega.
- [ ] Valida cobertura San Salvador/Santa Tecla.
- [ ] Bloquea zonas fuera de cobertura o ofrece retiro.
- [ ] Muestra tarifa de envio correcta.

## Pagos

- [ ] Crea intento de pago con proveedor configurado.
- [ ] Redirige a checkout/enlace seguro.
- [ ] Guarda referencia externa.
- [ ] Valida webhook server-side.
- [ ] Webhook duplicado no duplica descuento de inventario.
- [ ] Pago confirmado cambia orden a `PAID_PENDING_SHIPMENT`.
- [ ] Pago fallido/cancelado no descuenta inventario.
- [ ] No se almacenan datos de tarjeta.

## Admin

- [ ] Ruta admin requiere autenticacion antes de producción.
- [ ] Usuario no admin no puede entrar antes de producción.
- [ ] Admin ve ordenes por estado.
- [ ] Admin ve detalle de orden.
- [ ] Admin ve estado de pago.
- [ ] Admin ve estado DTE/manual.
- [ ] Admin ve direccion y metodo de entrega.
- [ ] Admin puede cambiar estado operativo de orden.
- [ ] Admin puede crear/editar productos.
- [ ] Admin puede actualizar stock manual.
- [ ] Cambios sensibles quedan auditados.

## DTE Semiautomatico

- [ ] Orden pagada queda con estado fiscal claro.
- [ ] Admin puede ver si DTE esta pendiente.
- [ ] Se guardan datos necesarios para emision.
- [ ] El flujo no promete DTE emitido si esta pendiente manual.
- [ ] Hay proceso definido para error o retraso.

## Release Checklist

Antes de mergear un PR:

- [ ] PR describe cambios.
- [ ] PR describe riesgos.
- [ ] PR lista pruebas ejecutadas.
- [ ] No hay cambios no relacionados.
- [ ] `npm run typecheck` OK.
- [ ] `npm run lint` OK.
- [ ] `npm test` OK.
- [ ] `npm run build` OK si aplica.
- [ ] QA/PO reviso rutas afectadas.
- [ ] Documentacion actualizada si cambio decision, flujo o regla.
