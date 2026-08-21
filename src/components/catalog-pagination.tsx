/**
 * CatalogPagination — componente Server de paginación para el catálogo.
 *
 * URL-first: genera enlaces (<Link>) conservando todos los filtros activos en
 * la query string y solo cambiando el parámetro `page`.
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

import { Link, type LocaleHref } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import type { LinkQuery } from "@/lib/url-utils";
import type { CatalogSearchParams } from "@/data/catalog-filters";

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  searchParams: CatalogSearchParams;
  /**
   * Destino base de los enlaces; por defecto el catálogo. Con los pathnames
   * localizados ya no alcanza un string: la ruta de vehículos es dinámica y hay
   * que pasarla como `{ pathname, params }`.
   */
  basePath?: Extract<LocaleHref, { pathname: unknown }> | "/catalog";
};

export async function CatalogPagination({
  currentPage,
  totalPages,
  searchParams,
  basePath = "/catalog",
  locale,
}: CatalogPaginationProps & { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  if (totalPages <= 1) return null;

  const buildHref = (page: number): LocaleHref => {
    const query: LinkQuery = {};

    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue; // se reemplaza abajo
      if (value !== undefined) query[key] = value;
    }

    if (page > 1) query.page = String(page);

    const base = typeof basePath === "string" ? { pathname: basePath } : basePath;
    return { ...base, query } as LocaleHref;
  };

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label={t("paginationAriaLabel")} className="flex flex-wrap items-center justify-center gap-1.5">
      {/* Anterior */}
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="inline-flex h-10 items-center gap-1.5 rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white"
          aria-label={t("previousPage")}
        >
          ‹ Anterior
        </Link>
      ) : (
        <span className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-text-secondary opacity-50">
          ‹ Anterior
        </span>
      )}

      {/* Números de página */}
      {pageNumbers.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex h-10 w-10 items-center justify-center text-sm font-bold text-ca-text-secondary"
            aria-hidden="true"
          >
            …
          </span>
        ) : item === currentPage ? (
          <span
            key={item}
            aria-current="page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-ca-control bg-ca-navy-950 text-sm font-black text-white"
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-ca-control border border-ca-border bg-white text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-background"
            aria-label={`Página ${item}`}
          >
            {item}
          </Link>
        ),
      )}

      {/* Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="inline-flex h-10 items-center gap-1.5 rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-navy-950 transition hover:border-ca-navy-950 hover:bg-ca-navy-950 hover:text-white"
          aria-label={t("nextPage")}
        >
          Siguiente ›
        </Link>
      ) : (
        <span className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-ca-control border border-ca-border bg-white px-3 text-sm font-black text-ca-text-secondary opacity-50">
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
