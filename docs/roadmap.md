# Roadmap - Implementacion por fases

## Principio

El proyecto debe avanzar por fases pequenas. Cada fase debe dejar algo revisable por QA humano.

No se debe construir todo de una vez.

Horizonte objetivo: 3 meses para un MVP robusto, no una demo apresurada.

## Fase 0 - Documentacion y decisiones base

Estado: en progreso.

Entregables:

- product requirements;
- arquitectura tecnica;
- modelo de datos;
- workflow de agentes;
- estrategia QA;
- plan de investigacion de mercado;
- roadmap;
- contexto maestro del proyecto;
- plan de tracking visual.

Criterio de salida:

- QA/PO aprueba alcance MVP.
- Quedan registradas preguntas abiertas.

## Fase 1 - Investigacion de mercado e inventario inicial

Objetivo:

Definir con evidencia las primeras categorias y SKUs.

Entregables:

- ranking de categorias;
- propuesta de 50 a 80 SKUs de catalogo;
- propuesta de 25 a 40 SKUs para inventario fisico inicial;
- lista de proveedores a contactar;
- propuesta de marca/nombre.
- propuesta de estilo visual con referencias.

Criterio de salida:

- QA/PO aprueba catalogo inicial.
- Se decide que productos seran stock real y cuales seran preorder/validacion.

## Fase 2 - Setup tecnico

Objetivo:

Crear base del proyecto.

Estado: en progreso.

Entregables:

- Next.js App Router;
- TypeScript;
- Tailwind;
- shadcn/ui;
- Prisma;
- PostgreSQL;
- i18n base espanol/ingles;
- lint/typecheck;
- estructura de carpetas;
- layout base.

Criterio de salida:

- app corre localmente;
- home basica carga;
- tooling funciona.

Avance actual:

- Next.js, TypeScript, Tailwind, Prisma y Vitest instalados.
- Home inicial con mock data creada.
- Prisma schema inicial creado.
- Verificaciones basicas pasan.
- Servidor local disponible en `http://localhost:3000`.

## Fase 3 - Catalogo y producto

Objetivo:

Permitir descubrir repuestos.

Estado: en progreso.

Entregables:

- modelos Prisma de catalogo;
- seed data;
- listado de productos;
- filtros basicos;
- detalle de producto;
- compatibilidad simple;
- estados de stock.

Criterio de salida:

- cliente puede encontrar producto;
- producto sin stock se muestra correctamente;
- responsive validado.

Avance actual:

- Ruta `/catalog` creada con mock data.
- Ruta `/product/[slug]` creada.
- Componentes reutilizables de catalogo creados.
- Mock data enriquecida con compatibilidad, stock y detalles tecnicos.
- Capa `src/data/products.ts` creada para leer desde Prisma/PostgreSQL con fallback mock.
- Seed inicial creado para categorias, productos, compatibilidad e inventario.
- Paginas marcadas como dinamicas para no congelar stock en el build.
- Filtros funcionales por query params para busqueda, categoria, marca, disponibilidad y vehiculo.
- Build, lint y pruebas pasan con fallback mock.

## Fase 4 - Carrito

Objetivo:

Permitir construir una compra.

Entregables:

- carrito invitado;
- carrito usuario registrado si auth ya esta activo;
- agregar/eliminar/cambiar cantidad;
- validacion de stock;
- totales con productos, envio y total, mas nota de IVA incluido.

Criterio de salida:

- no se puede exceder stock;
- carrito persiste para invitado;
- totales son correctos.

## Fase 5 - Checkout y ordenes

Objetivo:

Crear orden despues del pago web confirmado o simulado.

Entregables:

- formulario checkout;
- validacion Zod;
- direccion textual;
- selector de retiro en bodega o envio local;
- mapa con ubicacion actual y pin manual;
- calculo de tarifa de envio;
- creacion de orden `PAID_PENDING_SHIPMENT`;
- snapshot de precios;
- vista de resumen.

Criterio de salida:

- orden se crea correctamente;
- datos invalidos se bloquean;
- stock se revalida antes de pago.
- direccion, pin y cobertura se validan.

## Fase 6 - Pagos locales

Objetivo:

Integrar proveedor local aprobado.

Entregables:

- `PaymentProvider`;
- integracion sandbox/mock;
- creacion de pago;
- redirect/checkout/link;
- webhook;
- idempotencia;
- cambio a `PAID_PENDING_SHIPMENT`;
- descuento de inventario.

Criterio de salida:

- pago confirmado actualiza orden;
- webhook duplicado no descuenta dos veces;
- errores quedan auditados.

## Fase 7 - Admin basico

Objetivo:

Operar ventas e inventario inicial.

Entregables:

- login admin;
- vista de ordenes;
- detalle de orden;
- cambio de estado;
- crear/editar producto;
- actualizar stock manual.
- configurar datos base de retiro/zona si aplica.

Criterio de salida:

- admin puede procesar orden pagada;
- cambios sensibles quedan auditados.

## Fase 8 - Facturacion DTE

Objetivo:

Integrar o preparar flujo fiscal aprobado.

Entregables:

- `InvoiceProvider`;
- modelo `InvoiceDte`;
- emision via proveedor o estado manual controlado;
- almacenamiento de codigo de generacion, numero de control y sello de recepcion;
- representacion legible/PDF;
- estado visible en admin.

Criterio de salida:

- cada orden pagada tiene estado fiscal claro;
- errores de DTE no se pierden;
- contador/QA aprueba flujo.

## Fase 9 - Envio, emails y polish comercial

Objetivo:

Mejorar experiencia post-compra.

Entregables:

- email confirmacion;
- email estado de orden;
- zonas de entrega;
- politicas de cambios/devoluciones;
- SEO basico;
- analytics.

Criterio de salida:

- cliente recibe confirmacion;
- admin puede gestionar entrega.

## Fase 10 - Mejoras posteriores

Posibles mejoras:

- Google Maps Places Autocomplete;
- refinamiento de mapas/rutas;
- chat basico;
- WhatsApp;
- Apple Pay / Google Pay si el proveedor lo soporta;
- multi-bodega;
- escaner de facturas;
- pruebas E2E completas;
- busqueda avanzada por compatibilidad;
- recomendaciones de productos.

## Proxima accion recomendada

Antes de escribir codigo, ejecutar Fase 1:

1. Investigar mercado.
2. Proponer marca.
3. Recomendar proveedor de pago local.
4. Recomendar proveedor/estrategia DTE.
5. Aprobar alcance final de MVP.
