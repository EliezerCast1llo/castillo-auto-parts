# Canva Design Sync

## Objetivo

Conectar el trabajo visual de Canva con lo que ya funciona en la aplicacion:

- home con entrada a catalogo;
- catalogo con filtros por URL y auto-submit;
- busqueda por nombre, SKU, parte, categoria, marca, disponibilidad y vehiculo;
- product cards;
- detalle de producto;
- estados vacios.

## Estado

Fecha: 2026-05-20.

Canva no tiene brand kits configurados para esta cuenta, asi que el primer pase se genero sin brand kit formal.

## Candidato Aprobado 2026-05-20

El QA/PO eligio el candidato 1 del set `Castillo Auto Parts - Propuestas de identidad visual y pantallas MVP`.

Diseno editable final:

- Canva ID: `DAHKOIK3IR4`
- Edit URL: https://www.canva.com/d/MnVjKxaq03kPRJi
- View URL: https://www.canva.com/d/AZV5aTViDF42jhF

Decision de producto derivada:

- Home no debe tener filtros.
- Los filtros viven en `/catalog`.
- Home debe funcionar como entrada clara hacia catalogo, busquedas populares y productos destacados.
- Catalogo debe concentrar comparacion, filtros activos, busqueda por vehiculo y decision de compra.

## Outline Para Componentes Implementables

Se preparo un nuevo outline de Canva para extender el candidato 1 hacia componentes implementables.

Tema:

`Castillo Auto Parts - Guía visual de componentes implementables`

Paginas:

1. Sistema de componentes MVP.
2. Home sin filtros.
3. Catalogo como centro de decision.
4. Producto y compatibilidad.
5. Carrito y responsive QA.

Pendiente:

- QA/PO debe aprobar este outline en Canva.
- Luego se genera una presentacion visual editable con componentes y pantallas.

Nota 2026-05-20:

Canva sirve como referencia visual, pero la validacion principal de componentes se hara en `/design`, porque ahi se ven los componentes reales implementables con Tailwind, iconos y datos mock del MVP.

## Candidatos Generados

Canva genero candidatos para un documento editable de direccion visual llamado:

`Castillo Auto Parts - UI Design Direction MVP`

Candidatos:

1. https://www.canva.com/d/6P4_B4pJsEWoEp7
2. https://www.canva.com/d/Y3G1cOCQXOYRJk9
3. https://www.canva.com/d/tVrUYlCG4q4gwup
4. https://www.canva.com/d/cHQDbOolzJ-li5K

## Candidatos Visuales Materializados

Como el QA/PO necesita ver propuestas concretas y no solo descripciones, se genero un segundo set mas visual:

`Castillo Auto Parts - Propuestas Visuales Materializadas MVP`

Job Canva:

- `a13ce7a8-9290-4855-96f3-e3f0ca0a801e`

Candidatos:

1. Materializado 1
   - Candidate ID: `dg-5d593222-7ea5-438d-b102-4796d4f2dcc0`
   - Link: https://www.canva.com/d/b2o2LpIwpW72UEw
   - Preview: https://design.canva.ai/hCKEGnrlMMQaZWe
2. Materializado 2
   - Candidate ID: `dg-68168d8a-680b-438a-bcbf-b88eb3d3ddf3`
   - Link: https://www.canva.com/d/4wyKXHODQmnK0wM
   - Preview: https://design.canva.ai/Kt3r2y847E2Fl2I
3. Materializado 3
   - Candidate ID: `dg-a062842a-22b4-434b-81dc-8be5b19a3b27`
   - Link: https://www.canva.com/d/WLlGnsEmGgPMpS5
   - Preview: https://design.canva.ai/D4QL2nLg3HnOWd6
4. Materializado 4
   - Candidate ID: `dg-bacddce0-a826-4179-b351-311cc4a712c1`
   - Link: https://www.canva.com/d/TLF_eSUy6ODhU56
   - Preview: https://design.canva.ai/RdDiJjGpuljHpUy

## Criterios Para Elegir Candidato

- Debe sentirse moderno, claro y confiable.
- Debe evitar apariencia vieja o catalogo torpe.
- Debe priorizar compatibilidad vehicular, stock, precio y filtros.
- Debe funcionar como guia para UI real, no solo como presentacion bonita.
- Debe usar una direccion compatible con:
  - azul profundo `#12324A`;
  - verde `#19A974`;
  - amarillo `#F2B705`;
  - gris claro `#F5F7F8`;
  - carbon `#1E252B`;
  - blanco `#FFFFFF`.

## Pantallas Que Debe Cubrir

- Home/catalog entry.
- Catalogo con filtros.
- Product card.
- Detalle de producto.
- Empty state de filtros.
- Mobile responsive.

## Prototipo Local Materializado

Para revisar la pagina como UI real y no como descripcion, se creo una ruta local:

- `http://localhost:3000/design`

Incluye:

- pantalla de catalogo materializada;
- filtros laterales;
- hero de catalogo;
- cards de producto;
- pantalla de detalle de producto;
- galeria visual;
- panel de compra;
- compatibilidad;
- productos relacionados;
- comportamiento responsive desktop/mobile.
- tema `Taller Tecnico Moderno` aplicado como base visual nueva.

Esta ruta es temporal de diseno y no reemplaza todavia las rutas productivas `/catalog` y `/product/[slug]`.

Documento de investigacion relacionado:

- `docs/design-ux-research.md`
- `docs/design-component-guide.md`

## Siguiente Paso

El UI Agent debe extraer y extender desde el candidato aprobado:

- tokens visuales;
- reglas de botones;
- reglas de filtros;
- reglas de cards;
- reglas de badges;
- reglas mobile;
- ajustes concretos para implementar en Next.js.
