# Agent Review Findings - 2026-05-26 — Bloque 4

Búsqueda en tiempo real con autocomplete en el header.

## Contexto

El header tenia un formulario estático que enviaba a `/catalog?q=`. El usuario tenia que
presionar Enter o el botón para ver resultados. No habia retroalimentación inmediata
mientras escribia.

## Solución

### Route Handler — GET /api/search

Nuevo archivo `src/app/api/search/route.ts`:

- Acepta `?q=<query>` como query param.
- Reutiliza `filterCatalogProducts` y `getCatalogProducts` — misma lógica de búsqueda
  que el catálogo, resultados siempre consistentes.
- Límites: query < 2 chars → `[]`; query > 100 chars → 400; máximo 6 resultados.
- Incluye precio formateado (`formattedPrice`) para no exponer centavos al cliente.
- Cache-Control: `s-maxage=30, stale-while-revalidate=60` para reducir carga en CDN.
- Exporta tipos `SearchResult` y `SearchResponse` para compartir con el cliente sin duplicar.

Tests en `src/app/api/search/route.test.ts` cubren: query corta, query vacía, query larga,
búsqueda por nombre, búsqueda por SKU, precio formateado, query en respuesta, límite de 6.

### Componente SearchAutocomplete

Nuevo archivo `src/components/search/search-autocomplete.tsx`:

- Client Component (`"use client"`).
- Input controlado con debounce de 300ms — no dispara fetch en cada keystroke.
- Cancela el request anterior con `AbortController` si el usuario sigue escribiendo.
- Muestra dropdown con hasta 6 sugerencias: nombre, categoría, SKU, precio, stock.
- Navegación por teclado: ArrowDown/Up mueve el foco, Enter selecciona o envía form,
  Escape cierra el dropdown.
- `onMouseDown` en lugar de `onClick` en sugerencias para ejecutar antes del blur del input.
- Clic fuera cierra el dropdown via `mousedown` listener en `document`.
- Accesibilidad: `role="combobox"`, `role="listbox"`, `role="option"`,
  `aria-expanded`, `aria-autocomplete`, `aria-selected`.
- Fallback sin JS: el form sigue apuntando a `action="/catalog"` — funciona igual sin
  JavaScript activo.
- Al seleccionar una sugerencia navega a `/product/<slug>` via `useRouter`.
- "Ver todos los resultados" al pie del dropdown envía el form a `/catalog?q=`.

### SiteHeader actualizado

`src/components/site-header.tsx` reemplaza el form estático con `<SearchAutocomplete />`.
El header sigue siendo un Server Component async (lee el conteo del carrito).
Solo el formulario de búsqueda es Client Component.

## Archivos nuevos

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/api/search/route.ts` | Route Handler de búsqueda. |
| `src/app/api/search/route.test.ts` | Tests unitarios del endpoint. |
| `src/components/search/search-autocomplete.tsx` | Componente de búsqueda con autocomplete. |

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/components/site-header.tsx` | Reemplaza form estático con `<SearchAutocomplete />`. |

## Pendiente

- Tests de componente React (requiere setup de testing-library + jsdom).
- Rate limiting en /api/search si se detecta abuso en produccion.
- Busqueda con paginacion en DB cuando el catalogo crezca (Bloque 5).
