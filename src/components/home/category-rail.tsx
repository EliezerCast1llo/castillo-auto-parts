import Link from "next/link";
import type { CatalogFilterOptions } from "@/data/catalog-filters";

/**
 * Acceso rápido a categorías como fila de enlaces.
 *
 * Antes eran tarjetas con caja. Sin imagen dentro, la caja solo añadía altura:
 * seis recuadros para seis palabras. Como fila de texto ocupa una línea y deja
 * el espacio a los productos, que es lo que la home debería estar mostrando.
 */
export function CategoryQuickLinks({ options }: { options: CatalogFilterOptions }) {
  if (options.categories.length === 0) return null;

  return (
    <section className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-ca-border pb-5">
      <h2 className="text-xs font-black uppercase tracking-[0.1em] text-ca-navy-950">
        Comprar por categoría
      </h2>
      {options.categories.map((category) => (
        <Link
          className="text-sm font-semibold text-ca-text-primary underline-offset-4 transition hover:text-ca-blue-700 hover:underline"
          href={`/catalog?category=${encodeURIComponent(category)}`}
          key={category}
        >
          {category}
          {typeof options.categoryCounts[category] === "number" ? (
            <span className="ml-1 font-normal text-ca-text-secondary">
              ({options.categoryCounts[category]})
            </span>
          ) : null}
        </Link>
      ))}
      <Link
        className="ml-auto text-sm font-bold text-ca-blue-700 underline-offset-4 hover:underline"
        href="/catalog"
      >
        Ver catálogo completo
      </Link>
    </section>
  );
}
