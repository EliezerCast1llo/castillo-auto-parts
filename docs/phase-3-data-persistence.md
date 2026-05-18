# Phase 3 - Data Persistence

## Objetivo

Conectar el catalogo visible a una fuente de datos real sin bloquear el avance del MVP si la base local aun no esta disponible.

Esta fase prepara la transicion de mock data a PostgreSQL/Prisma para productos, categorias, compatibilidad e inventario inicial.

## Entregables

- `docker-compose.yml` con PostgreSQL local.
- Scripts `db:push` y `db:seed`.
- Seed inicial desde los productos mock existentes.
- Campo `technicalDetails` en `Product`.
- Capa de datos `src/data/products.ts`.
- Home, catalogo y detalle leyendo desde la capa de datos.
- Fallback a mock data cuando la base no responde o esta vacia.

## Flujo Local Esperado

1. Instalar dependencias con `npm install`.
2. Crear `.env` desde `.env.example`.
3. Levantar PostgreSQL con `docker compose up -d postgres`.
4. Ejecutar `npm run db:push`.
5. Ejecutar `npm run db:seed`.
6. Ejecutar `npm run dev`.
7. Revisar `/`, `/catalog` y `/product/filtro-aceite-toyota-18l`.

## Reglas Tecnicas

- La UI no debe importar directamente `mockProducts` para pantallas de catalogo.
- La capa `src/data/products.ts` decide si lee de Prisma o si usa fallback mock.
- Las paginas de catalogo/producto son dinamicas para evitar stock congelado por build estatico.
- El fallback mock es temporal y permite seguir desarrollando aunque PostgreSQL no este listo.
- El seed debe ser idempotente: puede ejecutarse varias veces sin duplicar productos.

## Riesgos Y Pendientes

- En la Mac actual no se pudo ejecutar PostgreSQL local porque `docker` no esta instalado.
- Cuando Docker este disponible, hay que correr `db:push` y `db:seed` para validar la ruta completa con base real.
- El catalogo todavia no tiene imagenes reales.
- La compatibilidad vehicular aun es simple y debe evolucionar a busqueda por marca/modelo/anio/motor.
- El manejo de `OUT_OF_STOCK` necesita una regla visual propia cuando avancemos carrito/checkout.

## QA Checklist

- La app carga con PostgreSQL apagado usando mock data.
- La app carga con PostgreSQL encendido usando seed data.
- `/catalog` muestra conteo correcto de productos.
- Cada tarjeta abre su detalle.
- Productos universales o sin compatibilidad estructurada muestran una compatibilidad legible.
- Stock bajo, en stock y preorder se ven diferenciados.
- Build, lint, typecheck y test pasan.
