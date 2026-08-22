import { Link } from "@/lib/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowRight, PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ScrollCarousel } from "@/components/ui/scroll-carousel";
import { categoryLabelOf, parseCatalogFilters } from "@/data/catalog-filters";
import type { CatalogFilterOptions } from "@/data/catalog-filters";
import type { Locale } from "@/lib/i18n/config";
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
  locale,
  options,
}: {
  catalogStatus: CatalogProductsResult["status"];
  /**
   * El idioma llega por prop y no se lee del contexto: la consulta de cada
   * riel es una lectura de catálogo más, y sin idioma devolvía los productos
   * en español dentro de la home en inglés.
   */
  locale: Locale;
  options: CatalogFilterOptions;
}) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const categories = [...options.categories]
    .sort(
      (a, b) =>
        (options.categoryCounts[b] ?? 0) - (options.categoryCounts[a] ?? 0),
    )
    .slice(0, MAX_RAILS);

  const rails = await Promise.all(
    categories.map(async (slug) => {
      const { products } = await getFilteredCatalogProducts(
        parseCatalogFilters({ category: slug }),
        1,
        "relevance",
        locale,
      );

      return {
        slug,
        label: categoryLabelOf(options, slug),
        products: products.slice(0, PER_RAIL),
      };
    }),
  );

  const visible = rails.filter((rail) => rail.products.length > 0);

  if (visible.length === 0)
    return <EmptyCatalogNotice locale={locale} status={catalogStatus} />;

  return (
    <>
      {visible.map((rail) => (
        <section className="space-y-3" key={rail.slug}>
          <div className="flex items-baseline justify-between gap-4 border-b border-ca-border pb-2">
            <h2 className="font-display text-lg font-extrabold text-ca-navy-950">
              {rail.label}
            </h2>
            <Link
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ca-blue-700 transition hover:text-ca-navy-950"
              href={{ pathname: "/catalog", query: { category: rail.slug } }}
            >
              Explorar {rail.label}
              {typeof options.categoryCounts[rail.slug] === "number"
                ? ` (${options.categoryCounts[rail.slug]})`
                : ""}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          <ScrollCarousel
            autoPlay
            label={t("railLabel", { category: rail.label })}
            nextLabel={t("carouselNext")}
            previousLabel={t("carouselPrevious")}
          >
            {rail.products.map((product) => (
              <div
                className="w-[240px] shrink-0 snap-start sm:w-[264px] lg:w-[calc((100%-3rem)/4)]"
                key={product.sku}
              >
                <ProductCard locale={locale} product={product} />
              </div>
            ))}
          </ScrollCarousel>
        </section>
      ))}
    </>
  );
}

async function EmptyCatalogNotice({
  locale,
  status,
}: {
  locale: Locale;
  status: CatalogProductsResult["status"];
}) {
  const t = await getTranslations({ locale, namespace: "Catalog" });
  return (
    <div className="rounded-ca-surface border border-ca-border bg-white p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ca-control bg-ca-navy-950/[0.07] text-ca-navy-900">
          <PackageSearch className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-black text-ca-navy-950">
            {status === "unavailable"
              ? t("railsUnavailableTitle")
              : t("railsEmptyTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ca-text-secondary">
            {status === "unavailable"
              ? t("railsUnavailableDescription")
              : t("railsEmptyDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
