import { Link } from "@/lib/i18n/navigation";
import { ArrowRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ScrollCarousel } from "@/components/ui/scroll-carousel";
import { parseCatalogFilters } from "@/data/catalog-filters";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import {
  getFilteredCatalogProducts,
  type CatalogProductsResult,
} from "@/data/products";

const MAX_RAILS = 6;
const PER_RAIL = 12;

/**
 * Bloques de producto, uno por categoría.
 *
 * En vez de una única sección de destacados, la home es una sucesión de
 * producto: cada categoría trae sus piezas en un carrusel y un enlace a su
 * filtro. El carrusel es lo que da la sensación de recorrido: se ven cuatro
 * tarjetas y el resto se pasa con las flechas.
 *
 * Se consulta por categoría en lugar de traer el catálogo entero y agrupar en
 * memoria: cada query va paginada y cacheada por su propio tag, que es lo que
 * se buscaba al sustituir la carga de la tabla completa.
 */
export async function CategoryProductRails({
  catalogStatus,
  options,
}: {
  catalogStatus: CatalogProductsResult["status"];
  options: CatalogFilterOptions;
}) {
  const categories = [...options.categories]
    .sort(
      (a, b) =>
        (options.categoryCounts[b] ?? 0) - (options.categoryCounts[a] ?? 0),
    )
    .slice(0, MAX_RAILS);

  const rails = await Promise.all(
    categories.map(async (category) => {
      const { products } = await getFilteredCatalogProducts(
        parseCatalogFilters({ category }),
        1,
      );

      return { category, products: products.slice(0, PER_RAIL) };
    }),
  );

  const visible = rails.filter((rail) => rail.products.length > 0);

  if (visible.length === 0)
    return <EmptyCatalogNotice status={catalogStatus} />;

  return (
    <>
      {visible.map((rail) => (
        <section className="space-y-3" key={rail.category}>
          <div className="flex items-baseline justify-between gap-4 border-b border-ca-border pb-2">
            <h2 className="font-display text-lg font-extrabold text-ca-navy-950">
              {rail.category}
            </h2>
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
              href={`/catalog?category=${encodeURIComponent(rail.category)}`}
            >
              Explorar {rail.category}
              {typeof options.categoryCounts[rail.category] === "number"
                ? ` (${options.categoryCounts[rail.category]})`
                : ""}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <ScrollCarousel autoPlay label={`Productos de ${rail.category}`}>
            {rail.products.map((product) => (
              <div
                className="w-[240px] shrink-0 snap-start sm:w-[264px] lg:w-[calc((100%-3rem)/4)]"
                key={product.sku}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </ScrollCarousel>
        </section>
      ))}
    </>
  );
}

function EmptyCatalogNotice({
  status,
}: {
  status: CatalogProductsResult["status"];
}) {
  return (
    <div className="rounded-ca-surface border border-ca-border bg-white p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ca-control bg-ca-navy-950/[0.07] text-ca-navy-900">
          <PackageSearch className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-black text-ca-navy-950">
            {status === "unavailable"
              ? "Catálogo temporalmente no disponible"
              : "Aún no hay productos publicados"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ca-text-secondary">
            {status === "unavailable"
              ? "No pudimos cargar el catálogo en este momento. Intenta nuevamente en unos minutos."
              : "Todavía no hay repuestos publicados en esta categoría."}
          </p>
        </div>
      </div>
    </div>
  );
}
