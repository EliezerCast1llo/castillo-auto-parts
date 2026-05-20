# Sistema visual - Castillo Auto Parts

Fecha: 2026-05-20.

## Dirección aprobada

Se adopta la propuesta **Taller Técnico Moderno** como base del MVP: sobria, azul, funcional y enfocada en encontrar el repuesto correcto antes de pagar.

La identidad debe transmitir:

- Confianza técnica sin verse antigua.
- Compra rápida, pero con compatibilidad clara.
- Uso cómodo en móvil para usuarios de San Salvador y Santa Tecla.
- Lenguaje completamente en español, con opción futura de inglés.

## Paleta principal

| Token | Hex | Uso |
| --- | --- | --- |
| `primary` | `#0B5CAD` | Acciones principales, links y búsqueda |
| `graphite` | `#1F2933` | Superficies densas y énfasis |
| `background` | `#F6F7F9` | Fondo general |
| `card` | `#FFFFFF` | Paneles, cards y formularios |
| `success` | `#16803C` | Disponible |
| `warning` | `#B7791F` | Últimas unidades |
| `danger` | `#B42318` | No disponible y errores |
| `info` | `#0F766E` | Compatibilidad, retiro o notas informativas |

## Reglas UI

- Las páginas de compra deben mostrar compatibilidad, SKU, precio y stock sin obligar al usuario a abrir el detalle.
- Los filtros aplicados deben verse como chips y poder quitarse de forma individual.
- Las cards de producto deben mantener CTA alineado abajo aunque el texto cambie.
- Los estados públicos de inventario son: `Disponible`, `Últimas unidades`, `No disponible`.
- El carrito debe mostrar SKU y advertencias antes del checkout.
- Los precios se muestran con IVA incluido; no se desglosa IVA en el MVP.

## Páginas actuales

- Home: entrada funcional sin filtros, con CTA al catálogo, búsquedas populares y productos destacados.
- Catálogo: filtros visibles, chips activos, estado vacío con acción clara y grilla de productos.
- Carrito: resumen de productos, edición de cantidad, disponibilidad y señales previas al pago.

## Próximas mejoras visuales

- Drawer de filtros para mobile.
- Imágenes reales o placeholders más cercanos a repuestos automotrices.
- Comparación visual de compatibilidad por vehículo.
- Propuesta Canva editable para Home, Catálogo y Carrito.
