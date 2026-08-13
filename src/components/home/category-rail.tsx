import Link from "next/link";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import { ProductVisual } from "@/components/product/product-visual";

/**
 * Acceso a categorías como tarjetas desplazables.
 *
 * El patrón viene de las tiendas de repuestos grandes: una tarjeta por
 * categoría, con el nombre arriba y un panel de color abajo. Ahí ellos ponen
 * la foto del producto; como todavía no hay fotos, el panel lleva el icono de
 * la categoría, que al menos distingue una tarjeta de otra.
 *
 * Es scroll horizontal en vez de grilla para que no reviente en móvil y para
 * que aguante más categorías sin rediseñar.
 */
export function CategoryQuickLinks({ options }: { options: CatalogFilterOptions }) {
  if (options.categories.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-black uppercase tracking-[0.1em] text-ca-navy-950">
        Comprar por categoría
      </h2>

      <ul className="mt-3 flex snap-x gap-4 overflow-x-auto pb-2">
        {options.categories.map((category) => (
          <li className="min-w-[168px] flex-1 snap-start sm:min-w-[190px]" key={category}>
            <Link
              className="group flex h-full flex-col overflow-hidden rounded-ca-surface border border-ca-border bg-white transition-colors hover:border-ca-navy-950/30"
              href={`/catalog?category=${encodeURIComponent(category)}`}
            >
              <span className="px-4 pb-3 pt-3.5">
                <span className="block font-display text-sm font-extrabold uppercase tracking-[0.04em] text-ca-navy-950">
                  Ver todo en {category}
                </span>
                {typeof options.categoryCounts[category] === "number" ? (
                  <span className="mt-0.5 block text-xs text-ca-text-secondary">
                    {options.categoryCounts[category]}{" "}
                    {options.categoryCounts[category] === 1 ? "producto" : "productos"}
                  </span>
                ) : null}
              </span>
              <span className="flex h-28 items-center justify-center bg-ca-navy-950">
                <ProductVisual
                  kind={category}
                  seed={category}
                  size="card"
                  tone="text-ca-gold-400"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
