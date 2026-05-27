/**
 * CatalogPagination — componente Server de paginación para el catálogo.
 *
 * URL-first: genera <a href> conservando todos los filtros activos en la query
 * string y solo cambiando el parámetro `page`. No usa estado cliente ni JS.
 *
 * Props:
 *   currentPage  — página actual (1-based).
 *   totalPages   — total de páginas calculado por la capa de datos.
 *   searchParams — los searchParams actuales de la página; se preservan en cada
 *                  enlace para no perder filtros activos al paginar.
 *
 * Comportamiento:
 *   - No se renderiza si totalPages <= 1.
 *   - Muestra botones Anterior / Siguiente y hasta 5 números de página.
 *   - La página activa no es un link (aria-current="page").
 *   - Las páginas anteriores/siguientes más lejanas se truncan con "…".
 */

import type { CatalogSearchParams } from "@/data/catalog-filters";

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  searchParams: CatalogSearchParams;
};

export function CatalogPagination({ currentPage, totalPages, searchParams }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue; // se reemplaza abajo
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v);
      } else if (value !== undefined) {
        params.set(key, value);
      }
    }

    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    return qs ? `/catalog?${qs}` : "/catalog";
  };

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Paginación del catálogo" className="flex items-center justify-center gap-1">
      {/* Anterior */}
      {currentPage > 1 ? (
        <a
          href={buildHref(currentPage - 1)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary hover:bg-primary/5"
          aria-label="Página anterior"
        >
          ‹ Anterior
        </a>
      ) : (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold text-muted-foreground opacity-50 cursor-not-allowed">
          ‹ Anterior
        </span>
      )}

      {/* Números de página */}
      {pageNumbers.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : item === currentPage ? (
          <span
            key={item}
            aria-current="page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-white"
          >
            {item}
          </span>
        ) : (
          <a
            key={item}
            href={buildHref(item)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-primary hover:bg-primary/5"
            aria-label={`Página ${item}`}
          >
            {item}
          </a>
        ),
      )}

      {/* Siguiente */}
      {currentPage < totalPages ? (
        <a
          href={buildHref(currentPage + 1)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold text-primary hover:bg-primary/5"
          aria-label="Página siguiente"
        >
          Siguiente ›
        </a>
      ) : (
        <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-sm font-semibold text-muted-foreground opacity-50 cursor-not-allowed">
          Siguiente ›
        </span>
      )}
    </nav>
  );
}

/**
 * Genera la secuencia de páginas a mostrar.
 * Muestra siempre primera, última y las 2 vecinas de la actual.
 * Inserta "ellipsis" cuando hay saltos.
 *
 * Ejemplos:
 *   totalPages=10, current=5  → [1, "ellipsis", 4, 5, 6, "ellipsis", 10]
 *   totalPages=5,  current=1  → [1, 2, 3, 4, 5]
 *   totalPages=10, current=1  → [1, 2, 3, "ellipsis", 10]
 */
function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1; // vecinos a cada lado del actual
  const range = new Set<number>();

  range.add(1);
  range.add(total);

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.add(i);
  }

  const sorted = [...range].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]!;
    const previous = sorted[i - 1];

    if (previous !== undefined && current - previous > 1) {
      result.push("ellipsis");
    }

    result.push(current);
  }

  return result;
}
