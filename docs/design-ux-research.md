# Investigación UX/UI - Catálogo y producto

Fecha: 2026-05-18.

## Fuentes Revisadas

- Baymard - Product Lists & Filtering UX: https://baymard.com/research/ecommerce-product-lists
- Baymard - Applied Filters Overview: https://baymard.com/blog/how-to-design-applied-filters
- Auto Care Association - Data Standards / ACES: https://www.autocare.org/data-standards
- W3C - WCAG 2.2: https://w3c.github.io/wcag/guidelines/22/
- W3C - Contrast Minimum: https://w3c.github.io/wcag/understanding/contrast-minimum.html
- DataReportal - Digital 2026 El Salvador: https://datareportal.com/reports/digital-2026-el-salvador

## Hallazgos Aplicables

- El catálogo no debe sentirse como una grilla decorativa. Es una pantalla de decisión donde el usuario compara compatibilidad, precio, disponibilidad y datos técnicos.
- Los filtros aplicados deben ser visibles, fáciles de limpiar y reproducibles por URL.
- En autopartes, la compatibilidad vehicular es información central. Marca, modelo, año y motor/versión deben evolucionar hacia datos estructurados, no solo texto.
- El flujo debe ser mobile-first para El Salvador. Los filtros deben funcionar bien en pantallas pequeñas y no deben provocar saltos de scroll innecesarios.
- El contraste debe tratarse como parte del diseño, no como ajuste final. Los botones, badges, inputs y foco deben cumplir contrastes legibles.

## Principios Para Castillo Auto Parts

- Priorizar encontrar la pieza correcta antes que mostrar muchas tarjetas bonitas.
- Mantener cards de igual altura: imagen fija, título con espacio reservado, metadata consistente, compatibilidad con espacio reservado y CTA alineado abajo.
- Evitar términos internos o Spanglish. Estados públicos:
  - `Disponible`
  - `Últimas unidades`
  - `No disponible`
- Usar color + texto. No depender solo del color para comunicar disponibilidad.
- En detalle de producto, cantidad debe ser un stepper editable con `-`, input numérico y `+`.
- El CTA de compra debe destacar más que acciones secundarias.

## Tema Propuesto: Taller Técnico Moderno

| Token | Hex | Uso |
| --- | --- | --- |
| `foreground` | `#111827` | Texto principal |
| `graphite` | `#1F2933` | Header, carrito, superficies densas |
| `steel` | `#56616F` | Texto secundario |
| `background` | `#F6F7F9` | Fondo general |
| `card` | `#FFFFFF` | Cards y paneles |
| `border` | `#D8DEE6` | Bordes e inputs |
| `primary` | `#0B5CAD` | Links, búsqueda y acciones primarias |
| `accent` | `#F59E0B` | Alertas visuales y apoyo comercial |
| `accent-foreground` | `#1A1200` | Texto sobre accent |
| `success` | `#16803C` | Disponible |
| `warning` | `#B7791F` | Últimas unidades |
| `danger` | `#B42318` | No disponible |
| `info` | `#0F766E` | Compatibilidad o retiro |

## Cambios Aplicados

- Tema base actualizado en CSS global.
- Foco visible agregado para links, botones, inputs y selects.
- Product cards alineadas con altura consistente.
- Estados de stock actualizados a español.
- Quantity stepper editable agregado.
- CTA de compra actualizado a azul por decisión de QA.
- Limpiar filtros fuerza remount del formulario para limpiar selector de vehículo.
- Catálogo y detalle productivo actualizados con visuales de producto, hero y alineación de cards.

## Pendientes De Diseño

- Agregar filtros activos como chips.
- Evaluar drawer mobile para filtros.
- Agregar imágenes reales o placeholders de producto más cercanos a repuestos.
