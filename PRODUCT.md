# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primario: la persona dueña del vehículo con una falla concreta.** Se le rompió
algo, busca la pieza por su nombre o por su carro, y necesita saber dos cosas
rápido: si la tienen y cuánto cuesta. Decide en una sesión.

**Secundario: talleres y mecánicos.** Compran seguido y conocen la pieza por
número de parte. Llegan a la misma página, pero no es a quien se le habla.

El tráfico llega de Google Ads, así que la visita empieza en frío: nadie viene
buscando la marca, vienen buscando una pieza.

## Product Purpose

Castillo Auto Parts vende repuestos automotrices en El Salvador. La tienda en
línea está construida pero **todavía no publicada**; mientras tanto hay una
landing temporal cuyo único trabajo es convertir la visita del anuncio en una
conversación por WhatsApp.

Éxito de la landing: la persona escribe por WhatsApp con su consulta. No hay
carrito, ni catálogo, ni cuenta: cualquier otra acción es ruido.

## Positioning

**Bodega propia con stock real, no intermediarios.** La pieza está físicamente
y puede retirarse en bodega o salir el mismo día. Un revendedor que publica un
catálogo que no tiene no puede decir esto con verdad.

**Respuesta y entrega rápidas.** Se contesta WhatsApp en minutos y se entrega en
San Salvador el mismo día o al siguiente.

Lo que la página dice hoy —"repuestos automotrices con envíos a todo El
Salvador"— lo dice cualquiera, y por eso no distingue nada.

## Operating Context

- La conversación ocurre en WhatsApp, desde el teléfono, a menudo con el carro
  parado o en el taller. La página se ve en móvil antes que en escritorio.
- La tienda completa ya existe en el repositorio: catálogo, carrito, checkout
  con Wompi, y tres formas de entrega —retiro en bodega, entrega local y envío
  nacional—. La landing es un estado temporal, no el producto final.
- `SITE_MODE=landing` recorta la compilación a los archivos `*.landing.tsx`, así
  que en ese modo existe una sola página en `/`.

## Capabilities and Constraints

- Español e inglés. El español es el idioma principal; el inglés ya está
  traducido y se elige con el conmutador o por `Accept-Language`.
- Contacto: WhatsApp y teléfono al +503 7890 7671.
- Cobertura declarada: envíos a todo El Salvador.
- **Sin dirección física ni horario publicables todavía.** No deben inventarse.
- **Sin precios, sin catálogo y sin inventario visibles** en la landing: la
  tienda no está abierta.

## Brand Commitments

- Nombre: Castillo Auto Parts (en la landing aparece como "Castillo Autoparts").
- No hay manual de identidad definido. El azul marino y el dorado que hay en el
  código son del storefront, no una decisión de marca confirmada.

## Evidence on Hand

**Ninguna todavía.** No hay fotos de bodega, de piezas ni del equipo; no hay
testimonios, cifras de clientes, años de operación verificados ni logos de
marcas con permiso de uso.

La página debe funcionar **sin imágenes** y dejar marcado dónde entran cuando
existan. Nada de stock fotográfico genérico, y nada de cifras, reseñas o
trayectoria inventadas.

## Product Principles

1. **Una sola acción.** La landing existe para que alguien escriba por WhatsApp.
   Todo lo que no empuje ahí sobra.
2. **Concreto antes que adjetivos.** "Bodega propia, retiro el mismo día" dice
   más que "calidad y confianza", y además es verificable.
3. **No afirmar lo que no se puede probar.** Sin evidencia, se dice lo que es
   cierto y se calla el resto; una cifra inventada destruye lo que la página
   intenta construir.
4. **El teléfono primero.** Llega de un anuncio, en móvil, con prisa.
5. **Temporal sin parecer abandonado.** "Estamos preparando la tienda" debe
   leerse como algo que está por venir, no como un sitio a medio hacer.

## Accessibility & Inclusion

- El idioma del documento sigue al idioma del contenido.
- La acción principal debe alcanzarse sin JavaScript: es la página que recibe
  tráfico pagado y no puede depender de que todo cargue.
