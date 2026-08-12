import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CatalogFilterOptions } from "@/data/catalog-filters";

/**
 * Categorías del catálogo.
 *
 * Antes había dos secciones lado a lado ("Lo más buscado" y "Explorar
 * catálogo") con listas distintas escritas a mano, elementos repetidos entre
 * ambas y enlaces que en varios casos iban a una búsqueda de texto (`?q=`) en
 * lugar del filtro de categoría. Ahora es una sola sección alimentada por las
 * facetas reales del catálogo, con el conteo de cada categoría y enlaces al
 * filtro correcto.
 */
export function CategoryQuickLinks({ options }: { options: CatalogFilterOptions }) {
  if (options.categories.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-5 w-1 bg-ca-gold-400" />
          <h2 className="font-display text-xl font-extrabold tracking-[0.02em] text-ca-navy-950">
            Explorar por categoría
          </h2>
        </div>
        <Link
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
          href="/catalog"
        >
          Ver catálogo completo
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {options.categories.map((category) => (
          <Link
            className="group flex min-h-[72px] flex-col justify-center gap-1 rounded-ca-surface border border-ca-border bg-white px-4 py-3 transition-colors hover:border-ca-navy-950/30"
            href={`/catalog?category=${encodeURIComponent(category)}`}
            key={category}
          >
            <span className="text-sm font-bold text-ca-navy-950 transition group-hover:text-ca-blue-700">
              {category}
            </span>
            {typeof options.categoryCounts[category] === "number" ? (
              <span className="text-xs text-ca-text-secondary">
                {options.categoryCounts[category]}{" "}
                {options.categoryCounts[category] === 1 ? "producto" : "productos"}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
